"use client";

import { Footprints, MapPin, TramFront } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { iconFor } from "./place-icon";
import { useContext } from "react";
import { TripBridge } from "./itinerary-spread";
import { useItinerary } from "./itinerary";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

// Maps for the planner, in the design system's quiet colours: MapLibre over OpenFreeMap's keyless
// vector tiles, restyled to our greys with the map's own labels removed, under coral numbered pins
// with Timeless names and a dotted pencil route. Coordinates are always
// real: names go to /api/planner/geocode, never to the model.
//   TileMap      the map itself, fitted to its points
//   MapSpread    the journal's Map spread: a day's stops, in order, with the walk between them
//   MiniMap      a small map for a sheet, with an "Open in Maps" pill
//   LocationLine the neighbourhood, how far from the stay, and the walk or transit time

export type Point = { name: string; lat: number; lon: number; area?: string };

const memo = new Map<string, Promise<Point[]>>();
/** Real coordinates for names, near the trip's place; names that can't be found are left out. */
export function useGeocode(names: string[], near?: string) {
  const key = `${names.join("|")}@${near ?? ""}`;
  const [points, setPoints] = useState<Point[] | null>(null);
  useEffect(() => {
    if (!names.length) return setPoints([]);
    if (!memo.has(key))
      memo.set(
        key,
        fetch("/api/planner/geocode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ names, near }) })
          .then((r) => (r.ok ? r.json() : { points: [] }))
          .then((b: { points: Point[] }) => b.points)
          .catch(() => []),
      );
    let gone = false;
    memo.get(key)!.then((p) => !gone && setPoints(p));
    return () => {
      gone = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return points;
}

/** Kilometres between two points. */
export function km(a: Point, b: Point) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
/** How you'd get there: walking up to about 2 km, else transit (rough, city speeds). */
export function travel(a: Point, b: Point) {
  const d = km(a, b) * 1.25; // streets aren't straight
  if (d <= 2.2) return { walk: true, minutes: Math.max(2, Math.round((d / 4.8) * 60)) };
  return { walk: false, minutes: Math.round((d / 22) * 60 + 8) };
}
const distance = (d: number) => (d < 1 ? `${Math.round(d * 10) * 100} m` : `${d.toFixed(d < 10 ? 1 : 0)} km`);
const mins = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim());

// The basemap: OpenFreeMap's Positron (keyless vector tiles), recoloured to the design system's
// cool greys and pale water, with every map label removed: the only words on a map are ours, in
// Timeless, beside the pins.
const STYLE = "https://tiles.openfreemap.org/styles/positron";
// Colours by layer name; the paint property follows the layer's own type (a pier is a fill, a
// road a line), so a colour never lands on a property the layer doesn't have.
const palette: [RegExp, string][] = [
  [/^background$/, "#f3f4f6"],
  [/^water$|^waterway$/, "#dde5ec"],
  [/^park$|landcover_wood/, "#e9ede9"],
  [/landuse_residential/, "#eff0f2"],
  [/^building$/, "#e6e8eb"],
  [/casing/, "#e3e6ea"],
  [/^highway|^road|^tunnel/, "#ffffff"],
  [/^railway/, "#d9dce0"],
  [/^boundary/, "#d3d6db"],
];
const paintKey: Record<string, string> = { background: "background-color", fill: "fill-color", line: "line-color" };
let styled: Promise<unknown> | null = null;
function quietStyle() {
  styled ??= fetch(STYLE)
    .then((r) => r.json())
    .then((style: { layers: { id: string; type: string; paint?: Record<string, unknown> }[] }) => {
      style.layers = style.layers.filter((l) => l.type !== "symbol");
      for (const layer of style.layers) {
        const hit = palette.find(([re]) => re.test(layer.id));
        const key = paintKey[layer.type];
        if (hit && key) layer.paint = { ...layer.paint, [key]: hit[1] };
      }
      return style;
    });
  return styled;
}

/** The map, fitted to its points with room around them; pins numbered when there's a route, each
 *  with its name beside it in Timeless. Drag to look around; the wheel stays with the page. */
export function TileMap({
  points,
  route = false,
  pad = 56,
  maxZoom = 16,
  labels = true,
  finding = false,
  className,
}: {
  points: Point[];
  /** The places are still being looked up. */
  finding?: boolean;
  route?: boolean;
  pad?: number;
  maxZoom?: number;
  labels?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Shown until the first tiles are drawn: a sketch of a map with a pin dropping in, and words
  // saying what's happening, so the space never reads as an empty grey box.
  const [ready, setReady] = useState(false);
  const key = points.map((p) => `${p.lat},${p.lon}`).join(";");
  useEffect(() => {
    const el = ref.current;
    if (!el || !points.length) return;
    setReady(false);
    let gone = false;
    let map: { remove: () => void } | null = null;
    (async () => {
      const [maplibregl, style] = await Promise.all([import("maplibre-gl"), quietStyle()]);
      if (gone) return;
      maplibregl.setWorkerUrl("/api/planner/maplibre-worker");
      const m = new maplibregl.Map({
        container: el,
        style: style as never,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        center: [points[0].lon, points[0].lat],
        zoom: maxZoom,
      });
      map = m;
      if (points.length > 1) {
        const lons = points.map((p) => p.lon);
        const lats = points.map((p) => p.lat);
        m.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: pad, maxZoom, duration: 0 },
        );
      }
      // Ready once the first tiles are drawn; never held longer than a few seconds.
      m.once("idle", () => !gone && setReady(true));
      window.setTimeout(() => !gone && setReady(true), 8000);
      m.on("load", () => {
        if (route && points.length > 1)
          m.addLayer({
            id: "pl-route",
            type: "line",
            source: { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points.map((p) => [p.lon, p.lat]) } } },
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#000", "line-opacity": 0.7, "line-width": 2.4, "line-dasharray": [0.1, 3.6] },
          });
      });
      points.forEach((p, i) => {
        const pin = document.createElement("div");
        pin.className = "pl-map__marker";
        pin.innerHTML = `<span class="pl-map__pin${route ? "" : " is-plain"}">${route ? i + 1 : ""}</span>${labels ? `<span class="pl-map__label"></span>` : ""}`;
        const label = pin.querySelector(".pl-map__label");
        if (label) label.textContent = p.name;
        new maplibregl.Marker({ element: pin, anchor: "left", offset: [route ? -15 : -11, 0] }).setLngLat([p.lon, p.lat]).addTo(m);
      });
    })();
    return () => {
      gone = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, route, pad, maxZoom, labels]);
  return (
    <div className={`pl-map${ready ? " is-ready" : ""}${className ? ` ${className}` : ""}`}>
      <div ref={ref} className="pl-map__canvas" />
      {ready ? null : (
        <div className="pl-map__loading" role="status">
          <svg className="pl-map__sketch" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <path d="M-10 78 C 30 60, 60 92, 100 70 S 170 52, 210 66" />
            <path d="M-10 30 C 40 42, 70 18, 120 34 S 180 40, 210 26" />
            <path d="M60 -10 C 66 30, 52 70, 64 130" />
            <path d="M150 -10 C 140 40, 158 80, 146 130" />
          </svg>
          <span className="pl-map__drop" aria-hidden>
            <MapPin strokeWidth={1.75} />
          </span>
          <span className="pl-map__status">
            {finding || points.length ? (points.length > 1 ? `Placing ${points.length} stops on the map…` : "Finding it on the map…") : "Couldn't find this on the map"}
          </span>
        </div>
      )}
      {points.length ? <span className="pl-map__credit">© OpenFreeMap · © OpenStreetMap</span> : null}
    </div>
  );
}

/** Where a place is: its neighbourhood, how far from the stay, and how you'd get there. */
export function LocationLine({ point, from, fromLabel = "your stay" }: { point?: Point | null; from?: Point | null; fromLabel?: string }) {
  if (!point) return null;
  const how = from ? travel(from, point) : null;
  const Icon = how ? (how.walk ? Footprints : TramFront) : null;
  return (
    <p className="pl-location">
      <MapPin aria-hidden />
      <span>{point.area ?? point.name}</span>
      {from && how && Icon ? (
        <>
          <span className="pl-location__sep">·</span>
          <span>
            {distance(km(from, point))} from {fromLabel}
          </span>
          <span className="pl-location__sep">·</span>
          <Icon aria-hidden />
          <span>
            {mins(how.minutes)} {how.walk ? "walk" : "by transit"}
          </span>
        </>
      ) : null}
    </p>
  );
}

const mapsLink = (p: Point) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lon}`)}`;

/** A small map for a sheet: the place's pin, the location line, and "Open in Maps". */
export function MiniMap({ name, near, stay, heading }: { name: string; near?: string; stay?: string; heading?: string }) {
  const names = stay ? [name, stay] : [name];
  const points = useGeocode(names, near);
  const point = points?.find((p) => p.name === name);
  const from = stay ? points?.find((p) => p.name === stay) : undefined;
  if (points && !point) return null;
  return (
    <section className="pl-minimap">
      {heading ? <h2>{heading}</h2> : null}
      <TileMap points={point ? [point] : []} finding={!points} maxZoom={15} pad={24} />
      <div className="pl-minimap__foot">
        <LocationLine point={point} from={from} />
        {point ? (
          <a className="pl-minimap__open" href={mapsLink(point)} target="_blank" rel="noopener noreferrer">
            Open in Maps
          </a>
        ) : null}
      </div>
    </section>
  );
}

/** The journal's Map spread: a day's stops in order on the map, and the list beside it with the
 *  walk or ride between each. */
export function MapSpread({ title, places, near }: { title?: string; places: string[]; near?: string }) {
  const points = useGeocode(places, near);
  const shown = points ?? [];
  // Every stop the agent named is listed; one the map couldn't find in this city keeps its place
  // in the list without a number, rather than a pin somewhere wrong.
  let n = 0;
  let last: Point | undefined;
  return (
    <section className="hj-page hj-spread hj-map">
      <div className="hj-map__words">
        <header className="hj-map__head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/icons-3d/${iconFor(near ?? title)}-pixar.webp`} alt="" draggable={false} />
          <h2>{title}</h2>
        </header>
        <ol className="hj-map__stops">
          {places.map((name, i) => {
            const p = shown.find((q) => q.name === name);
            const leg = p && last ? travel(last, p) : null;
            if (p) {
              n += 1;
              last = p;
            }
            return (
              <li key={`${name}-${i}`}>
                {leg ? (
                  <span className="hj-map__leg">
                    {leg.walk ? <Footprints aria-hidden /> : <TramFront aria-hidden />}
                    {mins(leg.minutes)} {leg.walk ? "walk" : "by transit"}
                  </span>
                ) : null}
                <span className={`hj-map__stop${p || !points ? "" : " is-unplaced"}`}>
                  <span className="hj-map__num">{p ? n : ""}</span>
                  <span className="hj-map__name">
                    {name}
                    {p?.area && p.area !== name ? <span className="hj-map__area">{p.area}</span> : null}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <TileMap points={shown} finding={!points} route className="hj-map__map" />
    </section>
  );
}

/** The Map spread as the journal's library renders it: the trip's place keeps lookups local. */
export function MapStep({ props }: { props: { title?: string; places?: string[]; near?: string } }) {
  const bridge = useContext(TripBridge);
  const places = (props.places ?? []).filter((p): p is string => typeof p === "string" && !!p.trim()).slice(0, 8);
  return <MapSpread title={props.title} places={places} near={props.near ?? bridge?.place} />;
}

/** The mini map in a place's or a hotel's sheet: near the trip, measured from the stay the
 *  traveller saved (the recommended one first), unless the place is that stay. */
export function SheetMiniMap({ name, heading }: { name: string; heading?: string }) {
  const bridge = useContext(TripBridge);
  const stays = (useItinerary()?.items ?? []).filter((i) => i.kind === "stay").sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));
  const stay = stays.find((s) => s.name !== name)?.name;
  return <MiniMap name={name} near={bridge?.place} stay={stay} heading={heading} />;
}
