"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Photo } from "./components";

// Small, general building blocks the planner composes into canvas pieces: type, media, lists,
// layout, and accents. None of them is a fixed section; a piece is whatever the model builds
// from them, so boards for different trips can take very different shapes.

/* ── Type ───────────────────────────────────────────────────────── */

export const Heading = defineComponent({
  name: "Heading",
  props: z.object({
    text: z.string(),
    size: z
      .enum(["xl", "l", "m", "s"])
      .optional()
      .describe("xl: a destination-sized display line; l and m: serif headings; s: a sans label"),
    align: z.enum(["start", "center"]).optional(),
  }),
  description: "A heading set in the serif display face (or a plain sans label at size s).",
  component: ({ props }) => (
    <h3
      className={`mb-heading mb-heading--${props.size ?? "l"}`}
      style={{ textAlign: props.align }}
    >
      {props.text}
    </h3>
  ),
});

export const Paragraph = defineComponent({
  name: "Paragraph",
  props: z.object({
    text: z.string(),
    size: z.enum(["l", "m", "s"]).optional(),
    tone: z.enum(["default", "muted"]).optional(),
    serif: z.boolean().optional().describe("Set in the serif face, for an essay-like voice"),
  }),
  description: "A paragraph of running text.",
  component: ({ props }) => (
    <p
      className={`mb-paragraph mb-paragraph--${props.size ?? "m"}${props.tone === "muted" ? " is-muted" : ""}${props.serif ? " is-serif" : ""}`}
    >
      {props.text}
    </p>
  ),
});

export const Numeral = defineComponent({
  name: "Numeral",
  props: z.object({
    value: z.string().describe("A short figure, e.g. '18°C', '€140', '7 days', '1,200 m'"),
    caption: z.string().optional().describe("What the figure means, in a few words"),
  }),
  description: "A big figure with a small caption: a temperature, a budget, a distance, a count.",
  component: ({ props }) => (
    <div className="mb-numeral">
      <span>{props.value}</span>
      {props.caption ? <p>{props.caption}</p> : null}
    </div>
  ),
});

/* ── Media ──────────────────────────────────────────────────────── */

export const PhotoGrid = defineComponent({
  name: "PhotoGrid",
  props: z.object({
    photos: z.array(Photo.ref).describe("2-9 Photos"),
    variant: z
      .enum(["bento", "masonry", "strip", "tiles"])
      .optional()
      .describe(
        "bento: one large photo and smaller ones; masonry: Pinterest columns of varied heights; strip: one row like a contact sheet; tiles: an even grid",
      ),
    columns: z.number().optional().describe("Columns for tiles or masonry, 2-4"),
  }),
  description: "Photos edge to edge with thin gutters, in one of four arrangements.",
  component: ({ props, renderNode }) => {
    const variant = props.variant ?? "tiles";
    const columns = Math.max(2, Math.min(4, Math.round(props.columns ?? 3)));
    const layout = variant === "tiles" ? "grid" : variant;
    return (
      <div
        className={`mb-collage mb-collage--${layout}`}
        style={
          variant === "tiles"
            ? { gridTemplateColumns: `repeat(${columns}, 1fr)` }
            : variant === "masonry"
              ? { columns: `${columns} 120px` }
              : undefined
        }
      >
        {(props.photos as unknown[]).map((photo, i) => (
          <div key={i} className="mb-collage__cell">
            {renderNode(photo)}
          </div>
        ))}
      </div>
    );
  },
});

export const PhotoWithCaption = defineComponent({
  name: "PhotoWithCaption",
  props: z.object({
    photo: Photo.ref,
    title: z.string(),
    text: z.string().optional(),
    side: z
      .enum(["left", "right", "below"])
      .optional()
      .describe("Where the photo sits relative to the text"),
  }),
  description: "One photo paired with a short title and a sentence, side by side or stacked.",
  component: ({ props, renderNode }) => (
    <div className={`mb-pwc mb-pwc--${props.side ?? "left"}`}>
      <div className="mb-pwc__photo">{renderNode(props.photo)}</div>
      <div className="mb-pwc__text">
        <h4>{props.title}</h4>
        {props.text ? <p>{props.text}</p> : null}
      </div>
    </div>
  ),
});

/* ── Lists ──────────────────────────────────────────────────────── */

export const Bullets = defineComponent({
  name: "Bullets",
  props: z.object({ items: z.array(z.string()).describe("2-8 short lines") }),
  description: "A plain list of short lines.",
  component: ({ props }) => (
    <ul className="mb-bullets">
      {props.items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ),
});

export const Step = defineComponent({
  name: "Step",
  props: z.object({ title: z.string(), text: z.string().optional() }),
  description: "One entry of a NumberedList.",
  component: () => null,
});

export const NumberedList = defineComponent({
  name: "NumberedList",
  props: z.object({
    items: z.array(Step.ref).describe("2-8 Steps: days, stops, or ranked picks"),
  }),
  description: "Entries set as type with large numerals: days of a trip, stops on a walk, a top 5.",
  component: ({ props }) => (
    <ol className="mb-itinerary">
      {(props.items as { props?: { title?: string; text?: string } }[]).map((item, i) => (
        <li key={i}>
          <span className="mb-itinerary__n">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.props?.title}</strong>
            {item.props?.text ? <p>{item.props.text}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  ),
});

export const KV = defineComponent({
  name: "KV",
  props: z.object({ label: z.string(), value: z.string() }),
  description: "One row of a KeyValue.",
  component: () => null,
});

export const KeyValue = defineComponent({
  name: "KeyValue",
  props: z.object({ rows: z.array(KV.ref).describe("2-8 rows") }),
  description: "Facts as label and value rows: best time, getting around, visa, currency, budget.",
  component: ({ props }) => (
    <dl className="mb-kv">
      {(props.rows as { props?: { label?: string; value?: string } }[]).map((row, i) => (
        <div key={i}>
          <dt>{row.props?.label}</dt>
          <dd>{row.props?.value}</dd>
        </div>
      ))}
    </dl>
  ),
});

/* ── Layout ─────────────────────────────────────────────────────── */

export const Columns = defineComponent({
  name: "Columns",
  props: z.object({
    children: z.array(z.any()).describe("2-4 blocks, one per column"),
    ratio: z.array(z.number()).optional().describe("Relative widths, e.g. [2, 1]"),
  }),
  description: "Blocks side by side in columns, e.g. a photo beside text, or three Numerals.",
  component: ({ props, renderNode }) => {
    const children = props.children as unknown[];
    const ratio = children.map((_, i) => props.ratio?.[i] ?? 1);
    return (
      <div
        className="mb-columns"
        style={{ gridTemplateColumns: ratio.map((part) => `${part}fr`).join(" ") }}
      >
        {children.map((child, i) => (
          <div key={i}>{renderNode(child)}</div>
        ))}
      </div>
    );
  },
});

export const Spacer = defineComponent({
  name: "Spacer",
  props: z.object({ size: z.enum(["s", "m", "l"]).optional() }),
  description: "Vertical breathing room.",
  component: ({ props }) => <div className={`mb-spacer mb-spacer--${props.size ?? "m"}`} />,
});

export const Rule = defineComponent({
  name: "Rule",
  props: z.object({}),
  description: "A thin horizontal line.",
  component: () => <hr className="mb-rule" />,
});

export const blocks = {
  type: [Heading, Paragraph, Numeral],
  media: [PhotoGrid, PhotoWithCaption],
  lists: [Bullets, Step, NumberedList, KV, KeyValue],
  layout: [Columns, Spacer, Rule],
};
