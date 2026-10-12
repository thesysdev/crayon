"use client";

import { useEffect, useState } from "react";
import { landscapes } from "../components/icons";
import "./breeze.css";

// Light line landscapes (the /components set: beach, island, lake, forest, and the rest) and a
// pencil plane draw themselves along the bottom of the page, drift on a breeze and dissolve, one
// after another: ambient, on the home page and while a reply loads. Outlines are a soft cool grey
// and each fill a pale tint of its own colour, washed in once the outline is drawn. They never
// sit over words or catch clicks.

const sketches = {
  plane: "M20 50 L 92 26 L 72 82 L 54 62 Z M54 62 L 92 26 M54 62 L 48 78 L 62 70",
} as const;

type Sketch = keyof typeof sketches;
type Landscape = (typeof landscapes)[number]["name"];
type Item = Sketch | Landscape;
const landscapeOf = (name: string) => landscapes.find((l) => l.name === name);

/** A landscape icon, lighter: a pale tint fill under a soft grey outline that draws itself in. */
function LandscapeArt({ name, still }: { name: string; still?: boolean }) {
  const l = landscapeOf(name);
  if (!l) return null;
  return (
    <>
      {l.fills.map((d, i) => (
        <path key={`f${i}`} className="pl-breeze__fill" d={d} fill={`color-mix(in srgb, ${l.color} 24%, white)`} fillRule="evenodd" />
      ))}
      {l.strokes.map((d, i) => (
        <path key={`s${i}`} className="pl-breeze__line" d={d} pathLength={still ? undefined : 1} />
      ))}
    </>
  );
}

// The plane's trail: an even row of small pencil dots curving away from its tail, revealed one
// by one (a dashed stroke can't be drawn on with the stroke trick without breaking up).
const trails: Partial<Record<Sketch, [number, number][]>> = {
  plane: [
    [14, 54],
    [8, 59],
    [3, 65],
    [0, 72],
    [-1, 79],
  ],
};

function Trail({ name, still }: { name: Sketch; still?: boolean }) {
  return (
    <>
      {trails[name]?.map(([x, y], i) => (
        <circle key={i} className={still ? undefined : "pl-breeze__dot"} cx={x} cy={y} r={1.7} style={{ ["--d" as string]: i }} />
      ))}
    </>
  );
}

/** Which landscapes suit the trip: a beach trip gets beaches and islands, a city break cities. */
function setFor(prompt: string): Item[] {
  const p = prompt.toLowerCase();
  if (/beach|island|coast|sea|bali|goa|maldives|chill|surf|sun/.test(p)) return ["Beach", "Island", "plane", "Beach", "Lake"];
  if (/mountain|hike|trek|alps|himalaya|snow|ski|swiss|nepal|patagonia/.test(p)) return ["Mountains", "Snow peak", "plane", "Lake", "Forest"];
  if (/forest|nature|waterfall|jungle|national park|lake/.test(p)) return ["Forest", "Waterfall", "plane", "Lake", "Hills"];
  if (/desert|sahara|dubai|petra|marrakech|wadi/.test(p)) return ["Desert", "City", "plane", "Desert", "Village"];
  if (/village|countryside|tuscany|cotswold|wine|vineyard|slow/.test(p)) return ["Countryside", "Village", "plane", "Hills", "Lake"];
  if (/city|museum|food|eat|tokyo|paris|london|new york|kyoto|lisbon|porto|stay|hotel/.test(p)) return ["City", "plane", "Village", "City", "Countryside"];
  return ["Beach", "plane", "Mountains", "City", "Island", "Forest"];
}

// Spots along the bottom band of the page, taken in turn so sketches never stack: below the
// message while a reply loads, and along the foot of the home page.
const spots = [
  { bottom: "4%", left: "14%" },
  { bottom: "9%", left: "46%" },
  { bottom: "3%", left: "72%" },
  { bottom: "8%", left: "28%" },
  { bottom: "5%", left: "60%" },
];

export function Breeze({ prompt = "" }: { prompt?: string }) {
  const [step, setStep] = useState(0);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(still);
    if (still) return;
    const t = window.setInterval(() => setStep((n) => n + 1), 2800);
    return () => window.clearInterval(t);
  }, []);
  const set = setFor(prompt);
  // Two sketches are in the air at once: the newest drawing in, the one before drifting off.
  const shown = reduce ? [0] : [step - 1, step].filter((n) => n >= 0);
  return (
    <div className="pl-breeze" aria-hidden>
      {shown.map((n) => {
        const name = set[n % set.length];
        return (
          <svg key={n} className="pl-breeze__sketch" viewBox={name === "plane" ? "0 0 120 110" : "0 0 100 100"} style={spots[n % spots.length]}>
            {name === "plane" ? (
              <>
                <path className="pl-breeze__line" d={sketches.plane} pathLength={1} />
                <Trail name="plane" still={reduce} />
              </>
            ) : (
              <LandscapeArt name={name} still={reduce} />
            )}
          </svg>
        );
      })}
    </div>
  );
}

/** Every sketch, still, for /components. */
export function BreezeSheet() {
  return (
    <div className="pl-breeze-sheet">
      {["plane", ...landscapes.map((l) => l.name)].map((name) => (
        <figure key={name}>
          <svg viewBox={name === "plane" ? "0 0 120 110" : "0 0 100 100"} className="pl-breeze__still">
            {name === "plane" ? (
              <>
                <path className="pl-breeze__line" d={sketches.plane} />
                <Trail name="plane" still />
              </>
            ) : (
              <LandscapeArt name={name} still />
            )}
          </svg>
          <figcaption>{name.toLowerCase()}</figcaption>
        </figure>
      ))}
    </div>
  );
}
