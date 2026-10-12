import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import type { CSSProperties, ReactNode } from "react";
import { dsFontVariables } from "../../design-system/fonts";
import {
  accent,
  color,
  contrast,
  font,
  fontVariation,
  gradient,
  neutral,
  support,
  tokensCss,
  type,
  type ColorRole,
  type TypeStyle,
} from "../../design-system/tokens";
import { Gallery, type GalleryGroup } from "./gallery";
import { landscapes, PlaceIcon, places, tint } from "./icons";
import { JournalSpread } from "./spreads";
import { plannerGroup } from "../planner/components-group";
import "./components.css";

export const metadata: Metadata = {
  title: "Components | Travel planner design system",
  description: "Typography and colors for the travel planner, set in Timeless.",
};

function typeStyle(t: TypeStyle): CSSProperties {
  return {
    fontFamily: font[t.family],
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontWeight: t.weight,
    letterSpacing: t.tracking,
    fontVariationSettings: fontVariation,
    textTransform: t.uppercase ? "uppercase" : undefined,
  };
}

const samples: Record<keyof typeof type, string> = {
  displayXl: "Lisbon",
  displayL: "Ten days in Kyoto",
  displayM: "Where to eat",
  headingL: "Day three, Sintra",
  headingM: "Memmo Alfama",
  headingS: "Sunset at Miradouro da Graça",
  quote: "“Go for the tiles, stay for the light at six.”",
  numeral: "€184",
  title: "Choose your dates",
  bodyL: "A slow week of tram rides, custard tarts and late dinners, with one day set aside for the coast.",
  body: "Check-in from 3 pm. The room looks over the river, and breakfast is served on the roof terrace until eleven.",
  bodyS: "4.8 rating · 1,204 reviews · 2 km from the centre",
  label: "Search stays",
  caption: "Photo: Rua Augusta at dusk",
  overline: "Portugal · Spring",
};

// `on` draws the role as text on that ground instead of as a fill.
const roleGroups: Record<string, { role: ColorRole; on?: ColorRole }[]> = {
  Surfaces: [
    { role: "canvas" },
    { role: "surface" },
    { role: "surfaceRaised" },
    { role: "surfaceSunken" },
    { role: "line" },
    { role: "lineSoft" },
  ],
  Ink: [
    { role: "ink", on: "canvas" },
    { role: "inkSecondary", on: "canvas" },
    { role: "inkTertiary", on: "canvas" },
    { role: "inkDisabled", on: "canvas" },
    { role: "inkInverse", on: "ink" },
  ],
  Accent: [
    { role: "accent", on: "surfaceRaised" },
    { role: "accentHover", on: "canvas" },
    { role: "accentPressed", on: "canvas" },
    { role: "accentSoft" },
    { role: "accentText", on: "canvas" },
    { role: "onAccent", on: "accentHover" },
  ],
};

/** Ink or white, whichever reads better on `bg`. */
const readableOn = (bg: string) => (contrast(bg, color.ink) > contrast(bg, neutral[0]) ? color.ink : neutral[0]);

function Swatch({ name, hex, fill, ink }: { name: string; hex: string; fill: string; ink?: string }) {
  return (
    <div className="ds-swatch">
      <div className="ds-swatch__chip" style={{ background: fill }}>
        {ink ? <span style={{ color: ink }}>Aa</span> : null}
      </div>
      <div className="ds-swatch__meta">
        <span>{name}</span>
        <span>{hex}</span>
      </div>
    </div>
  );
}

function Family() {
  return (
    <div className="ds-family">
      <div className="ds-family__aa">Aa</div>
      <div className="ds-family__glyphs">
        ABCDEFGHIJKLMNOPQRSTUVWXYZ
        <br />
        abcdefghijklmnopqrstuvwxyz
        <br />
        0123456789 €$£ &amp; ·,.:;!?“”
      </div>
    </div>
  );
}

function TypeScale() {
  return (
    <div className="ds-scale">
      {(Object.entries(type) as [keyof typeof type, TypeStyle][]).map(([name, t]) => (
        <div key={name} className="ds-scale__row">
          <div className="ds-scale__meta">
            <span>{name}</span>
            <span>
              {t.size}/{Math.round(t.size * t.lineHeight)}
            </span>
          </div>
          <div style={typeStyle(t)}>{samples[name]}</div>
        </div>
      ))}
    </div>
  );
}

function InUse() {
  return (
    <div className="ds-stage">
      <div className="ds-inuse">
        <div className="ds-inuse__card">
          <div style={typeStyle(type.overline)} className="ds-accent-text">
            {samples.overline}
          </div>
          <div style={typeStyle(type.displayL)}>Three nights in Lisbon</div>
          <p style={{ ...typeStyle(type.bodyL), color: color.inkSecondary, maxWidth: 520 }}>{samples.bodyL}</p>
          <div className="ds-inuse__price">
            <span style={typeStyle(type.numeral)}>€184</span>
            <span style={{ ...typeStyle(type.bodyS), color: color.inkTertiary }}>per night · taxes included</span>
          </div>
          <div className="ds-inuse__actions">
            <span className="ds-btn ds-btn--primary">Search stays</span>
            <span className="ds-btn">Save to trip</span>
          </div>
          <div className="ds-prompt">
            <span>Plan three slow days in Lisbon</span>
            <span className="ds-prompt__send" aria-hidden>
              ↑
            </span>
          </div>
        </div>
        <blockquote className="ds-inuse__quote" style={typeStyle(type.quote)}>
          {samples.quote}
          <footer style={{ ...typeStyle(type.caption), color: color.inkTertiary }}>Your travel planner</footer>
        </blockquote>
      </div>
    </div>
  );
}

function Roles({ roles }: { roles: { role: ColorRole; on?: ColorRole }[] }) {
  return (
    <div className="ds-grid">
      {roles.map(({ role, on }) => (
        <Swatch
          key={role}
          name={role}
          hex={color[role]}
          fill={on ? color[on] : color[role]}
          ink={on ? color[role] : undefined}
        />
      ))}
    </div>
  );
}

function Supporting() {
  return (
    <div className="ds-grid">
      {(Object.entries(support) as [string, string][]).map(([name, hex]) => (
        <Swatch key={name} name={name} hex={hex} fill={hex} ink={readableOn(hex)} />
      ))}
      {Object.entries(gradient).map(([name, value]) => (
        <div key={name} className="ds-swatch ds-swatch--wide">
          <div className="ds-swatch__chip" style={{ background: value }}>
            <span style={{ color: neutral[0] }}>Future Perfect</span>
          </div>
          <div className="ds-swatch__meta">
            <span>{name}</span>
            <span>gradient</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Ramp({ name, scale }: { name: string; scale: Record<string | number, string> }) {
  return (
    <div className="ds-ramp">
      <div className="ds-ramp__name">{name}</div>
      <div className="ds-ramp__row">
        {Object.entries(scale).map(([step, hex]) => (
          <div key={step} className="ds-ramp__chip" style={{ background: hex, color: readableOn(hex) }}>
            <span>{step}</span>
            <span>{hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ramps() {
  return (
    <>
      <Ramp name="Neutral" scale={neutral} />
      <Ramp name="Accent" scale={accent} />
    </>
  );
}

function Landmarks({ list = places }: { list?: typeof places }) {
  return (
    <div className="ds-grid">
      {list.map((p) => (
        <div key={p.name} className="ds-swatch">
          <div className="ds-icon-tile">
            <PlaceIcon place={p} />
          </div>
          <div className="ds-swatch__meta">
            <span>{p.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// The same icons at list size, with a heavier line, on a tile tinted with the place's colour.
function SmallIcons() {
  return (
    <div className="ds-icon-row">
      {places.map((p) => (
        <div key={p.name} className="ds-icon-tile ds-icon-tile--small" style={{ background: tint(p.color) }}>
          <PlaceIcon place={p} width={3.4} />
        </div>
      ))}
    </div>
  );
}

const placeNamed = (name: string) => places.find((p) => p.name === name)!;

/** An icon beside a word, with no container. `size` is in em: 1.5em makes the drawing (y 6 to 86 of
 *  100) about 1.7 times the cap height, and dropping it 0.14 of its size puts its ground line on the baseline. */
function InlineIcon({ name, size = 1.5, width = 3.4 }: { name: string; size?: number; width?: number }) {
  return (
    <span
      style={{ display: "inline-block", width: `${size}em`, height: `${size}em`, verticalAlign: `${-0.14 * size}em`, margin: "0 0.06em" }}
    >
      <PlaceIcon place={placeNamed(name)} width={width} />
    </span>
  );
}

/** The 3D renders in public/icons-3d: transparent PNGs trimmed to the model, soft shadow kept. The detailed
 *  Pixar-style render ({slug}-pixar.png) is the default; the felt original stands in until one exists. */
const src3d = (name: string) => {
  const slug = name.toLowerCase().replaceAll(" ", "-");
  const pixar = path.join(process.cwd(), "public", "icons-3d", `${slug}-pixar.webp`);
  return existsSync(pixar) ? `/icons-3d/${slug}-pixar.webp` : `/icons-3d/${slug}.webp`;
};

function Img3D({ name, size }: { name: string; size: number | string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src3d(name)} alt={name} style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  );
}

/** A 3D icon beside a word, sized like InlineIcon; the drop puts the model's base on the baseline
 *  and leaves its soft shadow just below it. */
function Inline3D({ name, size = 1.5 }: { name: string; size?: number }) {
  return (
    <span
      style={{ display: "inline-block", width: `${size}em`, height: `${size}em`, verticalAlign: `${-0.16 * size}em`, margin: "0 0.04em" }}
    >
      <Img3D name={name} size="100%" />
    </span>
  );
}

/** A place in running text: the icon and its name, kept together on one line. */
function Placed({ name, three }: { name: string; three?: boolean }) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      {three ? <Inline3D name={name} /> : <InlineIcon name={name} width={4.4} />} {name}
    </span>
  );
}

type Stop = { name: string; meta: string };

const itinerary: Stop[] = [
  { name: "Lisbon", meta: "Days 1–3 · tram 28 and the miradouros" },
  { name: "Paris", meta: "Days 4–6 · a slow morning on the Seine" },
  { name: "Venice", meta: "Days 7–8 · the last gondola at dusk" },
  { name: "Santorini", meta: "Days 9–10 · sunset over the caldera" },
];

const itinerary3d: Stop[] = [
  { name: "Paris", meta: "Days 1–3 · a slow morning on the Seine" },
  { name: "Agra", meta: "Days 4–5 · the Taj Mahal at first light" },
  { name: "Kyoto", meta: "Days 6–9 · through the torii of Fushimi Inari" },
  { name: "Sydney", meta: "Days 10–12 · an evening at the Opera House" },
];

/** The list-marker treatment: a 72px icon straight on the card, then the name and a short note. */
function Itinerary({ stops, marker }: { stops: Stop[]; marker: (name: string) => ReactNode }) {
  return (
    <div className="ds-inuse__card" style={{ gap: 0, padding: "24px 32px" }}>
      <div style={{ ...typeStyle(type.overline), color: color.inkTertiary, marginBottom: 8 }}>Your itinerary</div>
      {stops.map(({ name, meta }, i) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 0",
            borderTop: i ? `1px solid ${color.lineSoft}` : undefined,
          }}
        >
          <div style={{ width: 72, height: 72, flex: "none" }}>
            {marker(name)}
          </div>
          <div>
            <div style={typeStyle(type.headingM)}>{name}</div>
            <div style={{ ...typeStyle(type.bodyS), color: color.inkTertiary }}>{meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const pairingLabel: CSSProperties = { ...typeStyle(type.overline), color: color.inkTertiary, margin: "0 0 12px 4px" };

// The icons next to Timeless: inline in a display line, as chips in body text, and as list markers.
// Line icons first, then the 3D renders in the same three treatments.
function Pairing() {
  return (
    <div className="ds-stage" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <section>
        <div style={pairingLabel}>Line icons</div>
        <div className="ds-inuse">
          <div className="ds-inuse__card">
            <div style={typeStyle(type.overline)} className="ds-accent-text">
              Japan · Autumn
            </div>
            <div style={typeStyle(type.displayL)}>
              Ten days in{" "}
              <span style={{ whiteSpace: "nowrap" }}>
                <InlineIcon name="Kyoto" width={2.8} /> Kyoto
              </span>
            </div>
            <p style={{ ...typeStyle(type.bodyL), color: color.inkSecondary, maxWidth: 560 }}>
              Fly into <Placed name="Tokyo" />, take the bullet train past <Placed name="Mount Fuji" />, then spend
              a week among the temples of <Placed name="Kyoto" />.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginTop: 8 }}>
              {["Paris", "Agra", "Sydney"].map((n) => (
                <span key={n} style={{ ...typeStyle(type.headingM), whiteSpace: "nowrap" }}>
                  <InlineIcon name={n} width={3.6} /> {n}
                </span>
              ))}
            </div>
          </div>
          <Itinerary
            stops={itinerary}
            marker={(n) => (
              <PlaceIcon place={placeNamed(n)} width={3} />
            )}
          />
        </div>
      </section>
      <section>
        <div style={pairingLabel}>3D icons</div>
        <div className="ds-inuse">
          <div className="ds-inuse__card">
            <div style={typeStyle(type.overline)} className="ds-accent-text">
              Greece · Summer
            </div>
            <div style={typeStyle(type.displayL)}>
              A week on{" "}
              <span style={{ whiteSpace: "nowrap" }}>
                <Inline3D name="Santorini" /> Santorini
              </span>
            </div>
            <p style={{ ...typeStyle(type.bodyL), color: color.inkSecondary, maxWidth: 560 }}>
              Start in <Placed name="Paris" three />, fly east to <Placed name="Agra" three />, then end the trip by
              the harbour in <Placed name="Sydney" three />.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginTop: 8 }}>
              {["Paris", "Agra", "Kyoto"].map((n) => (
                <span key={n} style={{ ...typeStyle(type.headingM), whiteSpace: "nowrap" }}>
                  <Inline3D name={n} /> {n}
                </span>
              ))}
            </div>
          </div>
          <Itinerary stops={itinerary3d} marker={(n) => <Img3D name={n} size="100%" />} />
        </div>
      </section>
    </div>
  );
}

function Grid3D({ names }: { names: string[] }) {
  return (
    <div className="ds-grid">
      {names.map((n) => (
        <div key={n} className="ds-swatch">
          <div className="ds-icon-tile" style={{ background: color.surfaceRaised, padding: "6%" }}>
            <Img3D name={n} size="100%" />
          </div>
          <div className="ds-swatch__meta">
            <span>{n}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const weather3d = [
  ["weather-sunny", "sunny"],
  ["weather-partly-cloudy", "partly cloudy"],
  ["weather-cloudy", "cloudy"],
  ["weather-rainy", "rainy"],
] as const;

// The 3D weather icons, large on the stage and then inline in the planner's weather sentence.
function Weather3D() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div className="ds-grid">
        {weather3d.map(([f, label]) => (
          <div key={f} className="ds-swatch">
            <div className="ds-icon-tile" style={{ background: color.surfaceRaised, padding: "12%" }}>
              <img src={`/icons-3d/${f}.webp`} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
            <div className="ds-swatch__meta">
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weather3d.map(([f, label], i) => (
          <p key={f} style={{ ...typeStyle(type.bodyL), margin: 0 }}>
            It&rsquo;s {[28, 24, 22, 19][i]}{" "}
            <img src={`/icons-3d/${f}.webp`} alt="" style={{ height: "1.5em", width: "auto", verticalAlign: "-0.42em" }} /> and {label} in
            Bengaluru
          </p>
        ))}
      </div>
    </div>
  );
}

const followups = [
  ["stay", "Find a quiet place to stay"],
  ["food", "Eat where the locals eat"],
  ["museum", "Make it museum-heavy"],
  ["schedule", "Keep the days relaxed"],
  ["budget", "Keep it on a budget"],
  ["dates", "Try different dates"],
  ["transport", "Compare ways to get there"],
  ["nightlife", "Find the best nightlife"],
  ["market", "Wander the local markets"],
  ["work", "Find good spots to work"],
] as const;

// The concept icons for the planner's follow-up cards, on the same white squircle cards.
function FollowupIcons() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
      {followups.map(([kind, label]) => (
        <div
          key={kind}
          style={{ background: color.surfaceRaised, borderRadius: 28, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 2px rgba(20, 22, 26, 0.06)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/icons-3d/followup-${kind}-pixar.webp`} alt="" style={{ width: 120, height: 120, objectFit: "contain", display: "block" }} />
          <span style={{ ...typeStyle(type.bodyS), color: color.ink }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// The 3D renders, large on the white stage: landmarks first, then the generic landscapes.
function Landmarks3D() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <section>
        <div style={pairingLabel}>Places</div>
        <Grid3D names={places.map((p) => p.name)} />
      </section>
      <section>
        <div style={pairingLabel}>Landscapes</div>
        <Grid3D names={landscapes.map((p) => p.name)} />
      </section>
      <section>
        <div style={pairingLabel}>Felt and detailed</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8, maxWidth: 640 }}>
          {["pisa", "cairo", "iceland", "santorini", "rio", "kyoto"].flatMap((n) => [n, `${n}-pixar`]).map((f) => (
            <div key={f} className="ds-icon-tile" style={{ background: color.surfaceRaised, padding: "6%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons-3d/${f}.webp`} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const groups: GalleryGroup[] = [
  {
    title: "Typography",
    items: [
      { id: "family", name: "Family", view: <Family /> },
      { id: "type-scale", name: "Type scale", view: <TypeScale /> },
      { id: "in-use", name: "In use", view: <InUse /> },
    ],
  },
  {
    title: "Colors",
    items: [
      { id: "surfaces", name: "Surfaces", view: <Roles roles={roleGroups.Surfaces} /> },
      { id: "ink", name: "Ink", view: <Roles roles={roleGroups.Ink} /> },
      { id: "accent", name: "Accent", view: <Roles roles={roleGroups.Accent} /> },
      { id: "supporting", name: "Supporting", view: <Supporting /> },
      { id: "ramps", name: "Ramps", view: <Ramps /> },
    ],
  },
  {
    title: "Icons",
    items: [
      { id: "landmarks", name: "Landmarks", view: <Landmarks /> },
      { id: "landmarks-small", name: "Small", view: <SmallIcons /> },
      { id: "landscapes", name: "Landscapes", view: <Landmarks list={landscapes} /> },
      { id: "landmarks-3d", name: "3D", view: <Landmarks3D /> },
      { id: "weather-3d", name: "Weather", view: <Weather3D /> },
      { id: "followup-icons", name: "Follow-up icons", view: <FollowupIcons /> },
      { id: "pairing", name: "Pairing", view: <Pairing /> },
    ],
  },
  {
    title: "Journal spreads",
    items: [
      ...["Bleed", "Split", "Trio", "Sentence", "Route", "Quote", "Versus", "Price", "Checklist", "Mosaic", "Stays"].map((name) => ({
        id: `spread-${name.toLowerCase()}`,
        name,
        view: <JournalSpread id={name.toLowerCase()} />,
      })),
      { id: "spread-sheet", name: "Detail sheet", view: <JournalSpread id="sheet" /> },
      { id: "spread-pen", name: "Pen and arrows", view: <JournalSpread id="pen" /> },
      { id: "spread-marks", name: "Marks", view: <JournalSpread id="marks" /> },
    ],
  },
  plannerGroup,
];

export default function ComponentsPage() {
  return (
    <div className={`ds-page ${dsFontVariables}`}>
      <style dangerouslySetInnerHTML={{ __html: tokensCss(".ds-page") }} />
      <Gallery groups={groups} />
    </div>
  );
}
