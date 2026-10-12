"use client";

import { ArrowRight } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ItineraryItem, Saveable } from "./itinerary";
import { useItinerary } from "./itinerary";
import { readTraveller, travellerLine } from "./money";
import { iconFor } from "./place-icon";
import { Reply } from "./steps";
import "./itinerary-spread.css";

// The Explore agent doesn't write a day-by-day plan itself: it ends its entry with Itinerary, and
// this spread hands the trip's places (every spread's places, plus anything already saved) to the
// itinerary agent, which arranges them into days on the board. The spread then shows that plan in
// brief, day by day, with the Planned hotels, and a card button that opens the board. It always
// reads the board's current plan, so edits made there show here too.

/** What the journal tells its spreads about the trip. */
export const TripBridge = createContext<{ programs: string[]; prompts?: string[]; dates?: string; place?: string; openBoard?: () => void } | null>(null);

const numbers: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** How many days the trip is, from what the traveller said: chosen dates ("6 November to 8
 *  November 2026"), "2 days", "three nights" (a night more than the days), or a weekend. The
 *  latest mention wins. */
export function daysOf(prompts: string[], dates?: string) {
  for (const text of [...prompts].reverse().concat(dates ? [dates] : [])) {
    const t = text.toLowerCase();
    const range = t.match(/(\d{1,2}) (\w+) to (\d{1,2}) (\w+)(?: (\d{4}))?/);
    if (range && MONTHS.includes(range[2]) && MONTHS.includes(range[4])) {
      const year = Number(range[5]) || new Date().getFullYear();
      const from = new Date(year, MONTHS.indexOf(range[2]), Number(range[1]));
      const to = new Date(year + (MONTHS.indexOf(range[4]) < MONTHS.indexOf(range[2]) ? 1 : 0), MONTHS.indexOf(range[4]), Number(range[3]));
      const nights = Math.round((to.getTime() - from.getTime()) / 86_400_000);
      if (nights > 0) return nights + 1;
    }
    const iso = t.match(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
    if (iso) {
      const nights = Math.round((new Date(iso[2]).getTime() - new Date(iso[1]).getTime()) / 86_400_000);
      if (nights > 0) return nights + 1;
    }
    const count = t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)[ -](day|night)s?\b/);
    if (count) {
      const n = Number(count[1]) || numbers[count[1]];
      if (n) return count[2] === "night" ? n + 1 : n;
    }
    if (/long weekend/.test(t)) return 3;
    if (/weekend/.test(t)) return 2;
    if (/\b(a|one) week\b/.test(t)) return 7;
  }
  return undefined;
}

/** The real places an entry's spreads name, in reading order, without repeats. */
export function placesIn(programs: string[]): Saveable[] {
  const found: Saveable[] = [];
  const seen = new Set<string>();
  const push = (name = "", subject = "", kind: Saveable["kind"] = "place") => {
    const key = subject.toLowerCase();
    if (!name || !subject || seen.has(key)) return;
    seen.add(key);
    found.push({ name, subject, kind });
  };
  const str = String.raw`"((?:[^"\\]|\\.)*)"`;
  for (const program of programs) {
    for (const m of program.matchAll(new RegExp(String.raw`\b(Item|Stop|Pick|Side)\(\s*${str}\s*,\s*${str}`, "g")))
      push(m[1] === "Item" ? m[3] : m[2], m[3]);
    for (const m of program.matchAll(new RegExp(String.raw`\bTile\(\s*${str}`, "g"))) push(m[1], m[1]);
    for (const m of program.matchAll(new RegExp(String.raw`\bDish\(\s*${str}\s*,\s*${str}`, "g"))) push(m[1], m[2], "food");
    for (const m of program.matchAll(new RegExp(String.raw`\bSplit\(\s*${str}\s*,\s*${str}\s*,\s*${str}`, "g"))) push(m[3], m[3]);
  }
  // Airports and the traveller's home city aren't stops on the trip.
  return found.filter((p) => !/airport|railway station|international/i.test(p.subject ?? "")).slice(0, 14);
}

/** The board's plan as columns: the Planned hotels first, then each day in order. */
function columns(items: ItineraryItem[]) {
  const stays = items.filter((i) => i.kind === "stay");
  const days = new Map<string, ItineraryItem[]>();
  for (const item of items) if (item.kind !== "stay" && item.day) days.set(item.day, [...(days.get(item.day) ?? []), item]);
  return [...(stays.length ? [{ title: "Planned hotels", items: stays }] : []), ...[...days].map(([title, list]) => ({ title, items: list }))];
}

export function ItineraryPreview({
  items,
  title,
  place,
  building,
  onOpen,
}: {
  items: ItineraryItem[];
  title?: string;
  place?: string;
  building?: boolean;
  onOpen?: () => void;
}) {
  const cols = columns(items).slice(0, 4);
  return (
    <section className="hj-page hj-spread hj-itin" style={{ ["--n" as string]: Math.max(cols.length, 2) }}>
      <h2>{title || "Your plan, day by day"}</h2>
      <div className="hj-itin__days">
        {cols.length
          ? cols.map((col) => (
              <div key={col.title} className="hj-itin__day">
                <h3>{col.title}</h3>
                <ul>
                  {col.items.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <span className="hj-itin__thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.photo ? <img src={item.photo} alt="" draggable={false} /> : null}
                      </span>
                      <span className="hj-itin__words">
                        <span className="hj-itin__name">{item.name}</span>
                        {item.time || item.price ? <span className="hj-itin__time">{item.time ?? item.price}</span> : null}
                      </span>
                    </li>
                  ))}
                  {col.items.length > 5 ? <li className="hj-itin__more">and {col.items.length - 5} more</li> : null}
                </ul>
              </div>
            ))
          : [0, 1, 2].map((i) => (
              <div key={i} className="hj-itin__day is-waiting" aria-hidden>
                <h3 />
                <ul>
                  {[0, 1, 2].map((j) => (
                    <li key={j}>
                      <span className="hj-itin__thumb" />
                      <span className="hj-itin__words">
                        <span className="hj-itin__bar" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
      </div>
      {/* Open the board: a little stack of the trip's prints fanned behind a card with the place,
          its 3D icon and the words. On hover the prints fan out on a spring. */}
      <button type="button" className="hj-itin__stack" onClick={onOpen} disabled={!onOpen}>
        <span className="hj-itin__fan" aria-hidden>
          {items
            .filter((i) => i.photo)
            .slice(0, 3)
            .map((i, k) => (
              <span key={i.id} className="hj-itin__print" style={{ ["--k" as string]: k }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.photo} alt="" draggable={false} />
              </span>
            ))}
        </span>
        <span className="hj-itin__top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hj-itin__icon" src={`/icons-3d/${iconFor(place)}-pixar.webp`} alt="" draggable={false} />
          <span className="hj-itin__label">
            <span className="hj-itin__place">{place || "Your trip"}</span>
            <span className="hj-itin__action">{building && !cols.length ? "Arranging your days…" : "Open itinerary"}</span>
          </span>
          <span className="hj-itin__go" aria-hidden>
            <ArrowRight strokeWidth={2} />
          </span>
        </span>
      </button>
    </section>
  );
}

/** The Itinerary step in the journal: builds the plan once, then shows the board's plan. */
export function Itinerary({ props }: { props: { title?: string } }) {
  const itinerary = useItinerary();
  const bridge = useContext(TripBridge);
  const { send } = useContext(Reply);
  const [building, setBuilding] = useState(false);
  const started = useRef(false);
  const live = !!send && !!itinerary && !!bridge;
  useEffect(() => {
    if (!live || started.current || !itinerary || !bridge) return;
    // Once per trip and entry, even across reloads: the board keeps the plan after that.
    const key = `planner:itin:${itinerary.trip}:${bridge.programs.length}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    started.current = true;
    setBuilding(true);
    fetch(`/api/planner/itinerary/agent?trip=${encodeURIComponent(itinerary.trip)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: bridge.dates ? `Make these into a day-by-day plan for ${bridge.dates}` : "Make these into a day-by-day plan (Day 1, Day 2…)",
        dates: bridge.dates,
        days: daysOf(bridge.prompts ?? [], bridge.dates),
        context: (bridge.prompts ?? []).join(" / "),
        seed: placesIn(bridge.programs),
        items: itinerary.items,
        traveller: travellerLine(readTraveller()),
      }),
    })
      .then((r) => r.text())
      .then((text) => {
        const body = JSON.parse(text) as { items?: ItineraryItem[] };
        if (body.items) itinerary.set(body.items);
      })
      .catch(() => {
        try {
          localStorage.removeItem(key);
        } catch {}
      })
      .finally(() => setBuilding(false));
  }, [live, itinerary, bridge]);
  return <ItineraryPreview items={itinerary?.items ?? []} title={props.title} place={bridge?.place} building={building} onOpen={bridge?.openBoard} />;
}
