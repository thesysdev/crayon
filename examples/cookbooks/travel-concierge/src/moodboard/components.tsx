"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

// Moodboard building blocks the model can place inside a piece, next to the standard OpenUI
// components. Each one renders a design artifact that the stock library has no direct match for.

const hex = z.string().describe("A CSS hex color such as #c2410c");

// Readable text on any swatch: dark ink on light colors, white on dark ones.
function ink(color: string) {
  const value = color.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value.padEnd(6, "0");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#1c1917" : "#ffffff";
}

export const Swatch = defineComponent({
  name: "Swatch",
  props: z.object({
    hex,
    name: z.string().describe("An evocative color name, e.g. 'Kiln clay'"),
    role: z.string().optional().describe("How the color is used, e.g. 'Primary', 'Accent', 'Ink'"),
  }),
  description: "One color chip with its name, hex value, and role. Use inside Palette.",
  component: ({ props }) => (
    <div className="mb-swatch" style={{ background: props.hex, color: ink(props.hex) }}>
      <span className="mb-swatch__role">{props.role}</span>
      <span className="mb-swatch__name">{props.name}</span>
      <span className="mb-swatch__hex">{props.hex.toUpperCase()}</span>
    </div>
  ),
});

export const Palette = defineComponent({
  name: "Palette",
  props: z.object({
    swatches: z.array(Swatch.ref),
    ratio: z
      .array(z.number())
      .optional()
      .describe("Relative share of each swatch in the design, e.g. [60, 25, 10, 5]"),
  }),
  description:
    "A row of 4-6 Swatch chips, sized by how much of the design each color covers (the 60/30/10 rule).",
  component: ({ props, renderNode }) => {
    const ratio = props.ratio ?? [];
    return (
      <div className="mb-palette">
        {(props.swatches as unknown[]).map((swatch, i) => (
          <div key={i} style={{ flexGrow: ratio[i] ?? 1, flexBasis: 0 }}>
            {renderNode(swatch)}
          </div>
        ))}
      </div>
    );
  },
});

export const Gradient = defineComponent({
  name: "Gradient",
  props: z.object({
    stops: z.array(hex).describe("2-4 hex colors"),
    angle: z.number().optional().describe("Degrees, default 135"),
    label: z.string().optional(),
  }),
  description:
    "A wide gradient strip blending palette colors; good for light, sky, or glaze moods.",
  component: ({ props }) => (
    <div
      className="mb-gradient"
      style={{ background: `linear-gradient(${props.angle ?? 135}deg, ${props.stops.join(", ")})` }}
    >
      {props.label ? <span>{props.label}</span> : null}
    </div>
  ),
});

// Load a Google Font family once per page so a type pairing previews in its real typeface.
const loadedFonts = new Set<string>();
function useGoogleFont(family: string) {
  useEffect(() => {
    if (!family || loadedFonts.has(family)) return;
    loadedFonts.add(family);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }, [family]);
}

export const TypePair = defineComponent({
  name: "TypePair",
  props: z.object({
    display: z.string().describe("A Google Fonts family for headlines, e.g. 'Fraunces'"),
    body: z.string().describe("A Google Fonts family for body text, e.g. 'Inter'"),
    headline: z.string().describe("A short headline set in the display face"),
    sample: z.string().describe("One or two sentences set in the body face"),
  }),
  description:
    "A live type specimen: a headline in the display face over body copy in the body face.",
  component: ({ props }) => {
    useGoogleFont(props.display);
    useGoogleFont(props.body);
    return (
      <div className="mb-type">
        <div className="mb-type__headline" style={{ fontFamily: `'${props.display}', serif` }}>
          {props.headline}
        </div>
        <p className="mb-type__sample" style={{ fontFamily: `'${props.body}', sans-serif` }}>
          {props.sample}
        </p>
        <div className="mb-type__meta">
          {props.display} / {props.body}
        </div>
      </div>
    );
  },
});

type Found = { url: string; title: string; creator?: string; license: string; landing: string };

// Photos found this session, by kind and subject.
const found = new Map<string, Found | null>();

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" width="24" height="24">
      <path
        d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
        fill={filled ? "#FF385C" : "rgb(0 0 0 / 0.5)"}
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}

// A photo card in the style of a Pinterest pin or an Airbnb listing: the photo first, with a
// save heart and an optional badge on it, then a bold title and one grey line below.
export const Photo = defineComponent({
  name: "Photo",
  props: z.object({
    subject: z
      .string()
      .describe(
        "For a place, dish, or stay: its exact English Wikipedia article title, e.g. 'Fushimi Inari-taisha', 'Kaiseki', 'Gion'. For a scene: 2-4 plain words, e.g. 'rainy alley lanterns'.",
      ),
    caption: z.string().optional().describe("The name of the place or dish, shown in bold"),
    kind: z.enum(["place", "food", "stay", "scene"]).optional(),
    shape: z.enum(["landscape", "portrait", "square", "wide"]).optional(),
    detail: z.string().optional().describe("One short grey line: area, when to go, or why"),
    badge: z
      .string()
      .optional()
      .describe("A 1-3 word pill on the photo, e.g. 'Must see', 'Local favourite'"),
  }),
  description:
    "A real photo of a named landmark, neighbourhood, dish, or stay (from Wikipedia and Wikimedia Commons), or an atmosphere scene, as a pin or listing card. Never write image URLs.",
  component: ({ props }) => {
    const kind = props.kind === "scene" ? "scene" : "named";
    const key = `${kind}:${props.subject}`;
    // A piece scrolled back into view re-renders at once from the cache, at the same height.
    const [photo, setPhoto] = useState<Found | null | undefined>(() => found.get(key));
    const [saved, setSaved] = useState(false);
    // Search once the subject has finished streaming, not for every partial subject.
    const streaming = useIsStreaming();
    useEffect(() => {
      if (!props.subject || streaming) return;
      if (found.has(key)) return setPhoto(found.get(key));
      const controller = new AbortController();
      fetch(`/api/moodboard/images?kind=${kind}&q=${encodeURIComponent(props.subject)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((result: Found | null) => {
          found.set(key, result);
          setPhoto(result);
        })
        .catch(() => {});
      return () => controller.abort();
    }, [key, kind, props.subject, streaming]);
    // A fixed aspect ratio keeps the card's height the same before and after the photo loads.
    const aspect = { landscape: "4 / 3", portrait: "3 / 4", square: "20 / 19", wide: "2 / 1" }[
      props.shape ?? "landscape"
    ];
    return (
      <figure className="mb-photo">
        <div className="mb-photo__frame" style={{ aspectRatio: aspect }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt={props.caption ?? photo.title} draggable={false} />
          ) : (
            <span className={`mb-photo__placeholder${photo === undefined ? " is-loading" : ""}`}>
              {photo === null ? props.subject : ""}
            </span>
          )}
          {props.badge ? <span className="mb-photo__badge">{props.badge}</span> : null}
          <span className="mb-photo__save">Save</span>
          <button
            type="button"
            className="mb-photo__heart"
            aria-label={saved ? "Remove from saved" : "Save"}
            onClick={() => setSaved((value) => !value)}
          >
            <Heart filled={saved} />
          </button>
        </div>
        {props.caption || props.detail ? (
          <figcaption>
            {props.caption ? <strong>{props.caption}</strong> : null}
            {props.detail ? <span>{props.detail}</span> : null}
          </figcaption>
        ) : null}
        {photo ? (
          <a className="mb-photo__credit" href={photo.landing} target="_blank" rel="noreferrer">
            {photo.creator ? `${photo.creator} · ` : ""}
            {photo.license}
          </a>
        ) : null}
      </figure>
    );
  },
});

// Older boards used other layout names; they map to the current grids.
const layouts: Record<string, string> = {
  feature: "bento",
  gallery: "bento",
  listings: "strip",
};

export const Collage = defineComponent({
  name: "Collage",
  props: z.object({
    photos: z.array(Photo.ref).describe("3-8 Photos"),
    layout: z
      .enum(["bento", "masonry", "strip", "grid", "feature", "gallery", "listings"])
      .optional()
      .describe(
        "bento: one large photo and four small; masonry: Pinterest columns of varied heights; strip: a contact-sheet row; grid: even tiles",
      ),
  }),
  description:
    "A tight photo grid, edge to edge with thin gutters: places to visit, dishes, stays, or scenes.",
  component: ({ props, renderNode }) => {
    const layout = layouts[props.layout ?? ""] ?? props.layout ?? "masonry";
    return (
      <div className={`mb-collage mb-collage--${layout}`}>
        {(props.photos as unknown[]).map((photo, i) => (
          <div key={i} className="mb-collage__cell">
            {renderNode(photo)}
          </div>
        ))}
      </div>
    );
  },
});

// Editorial type set directly on the canvas, without a card around it.

export const Display = defineComponent({
  name: "Display",
  props: z.object({
    text: z.string().describe("The destination or a 1-4 word headline, e.g. 'Kyoto'"),
    standfirst: z.string().optional().describe("One sentence below, in a lighter weight"),
  }),
  description: "A huge serif display headline with one sentence below it.",
  component: ({ props }) => (
    <header className="mb-display">
      <h1>{props.text}</h1>
      {props.standfirst ? <p>{props.standfirst}</p> : null}
    </header>
  ),
});

export const Quote = defineComponent({
  name: "Quote",
  props: z.object({
    text: z.string().describe("One evocative sentence about the trip's feeling"),
    by: z
      .string()
      .optional()
      .describe("Attribution, e.g. a proverb or 'On the Philosopher's Path'"),
  }),
  description: "A big serif pull-quote for the trip's vibe.",
  component: ({ props }) => (
    <blockquote className="mb-quote">
      <p>{props.text}</p>
      {props.by ? <cite className="mb-smallcaps">{props.by}</cite> : null}
    </blockquote>
  ),
});

export const Day = defineComponent({
  name: "Day",
  props: z.object({
    title: z.string().describe("The day's theme, e.g. 'Higashiyama on foot'"),
    plan: z.string().describe("One or two sentences: morning, afternoon, evening"),
  }),
  description: "One day of an Itinerary.",
  component: () => null,
});

export const Itinerary = defineComponent({
  name: "Itinerary",
  props: z.object({
    days: z.array(Day.ref).describe("3-6 days"),
  }),
  description: "Day-by-day plan set as type: large numerals, a bold theme, and a short plan.",
  component: ({ props }) => (
    <ol className="mb-itinerary">
      {(props.days as { props?: { title?: string; plan?: string } }[]).map((day, i) => (
        <li key={i}>
          <span className="mb-itinerary__n">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>{day.props?.title}</strong>
            <p>{day.props?.plan}</p>
          </div>
        </li>
      ))}
    </ol>
  ),
});

export const Note = defineComponent({
  name: "Note",
  props: z.object({
    label: z.string().describe("A small-caps label, e.g. 'Best time', 'Pack', 'Budget'"),
    text: z.string().describe("One or two short sentences"),
  }),
  description:
    "A small-caps label over a short line of text; set several side by side in a row Stack.",
  component: ({ props }) => (
    <div className="mb-note">
      <span className="mb-smallcaps">{props.label}</span>
      <p>{props.text}</p>
    </div>
  ),
});

export const Words = defineComponent({
  name: "Words",
  props: z.object({
    words: z.array(z.string()).describe("4-8 vibe words"),
  }),
  description: "Vibe words set as a large, light typographic line separated by slashes.",
  component: ({ props }) => (
    <p className="mb-words">
      {props.words.map((word, i) => (
        <span key={i}>{word}</span>
      ))}
    </p>
  ),
});
