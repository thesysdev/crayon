"use client";

import { useIsStreaming } from "@openuidev/react-lang";
import { createContext, type CSSProperties, Fragment, type KeyboardEvent, type ReactNode, useContext, useEffect, useId, useState } from "react";
import { DrawablyCircle, DrawablyHighlight, DrawablyUnderline } from "./drawably/react.js";
import { type arrowDirs, type arrowStyles, buildLibrary, type colors } from "./schema";
import "./drawably/style.css";
import "./spreads.css";

// The journal's spreads, rebuilt from /design/pairings for full pages. Their schemas live in
// schema.ts. Every size is in container units of the page, so a spread scales to any box.

type Hue = (typeof colors)[number];
type ArrowStyle = (typeof arrowStyles)[number];
type ArrowDir = (typeof arrowDirs)[number];

const ink = "#000";
const white = "#fff";
const coral = "#ff5364";
const amber = "#feb600";
const hues: Record<Hue, string> = { coral, cobalt: "#004ab0", emerald: "#10b980", magenta: "#e5359e", amber, ink };
const hex = (c: Hue | undefined, fallback: Hue) => hues[c ?? fallback] ?? hues[fallback];
/** Pen on the canvas: the spread's hue, but amber is too pale there and ink too quiet. */
const penOnCanvas = (c: Hue | undefined, fallback: Hue = "coral") =>
  c === "amber" ? ink : c === "ink" ? coral : hex(c, fallback);
/** Words on a block of colour. */
const onBlock = (c: Hue | undefined) => (c === "amber" ? ink : white);

/* ---------- Photos ---------- */

type Found = { url: string; title: string } | null;
const found = new Map<string, Found>();

// Wikipedia and Wikimedia lead images through the moodboard's keyless image route.
export function usePhoto(subject: string | undefined) {
  const [photo, setPhoto] = useState<Found | undefined>(() => (subject ? found.get(subject) : undefined));
  const streaming = useIsStreaming();
  useEffect(() => {
    if (!subject || streaming) return;
    if (found.has(subject)) return setPhoto(found.get(subject));
    const controller = new AbortController();
    fetch(`/api/moodboard/images?kind=named&q=${encodeURIComponent(subject)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((result: Found) => {
        found.set(subject, result);
        setPhoto(result);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [subject, streaming]);
  return photo;
}

/** What a photo opens when clicked: the journal's detail sheet. Absent in /components. */
export type Opened = { subject: string; name?: string };
export const SheetOpener = createContext<((what: Opened) => void) | null>(null);

/** Click and Enter props that open the sheet for `subject`, when the journal provides one. */
function useOpen(subject?: string, name?: string) {
  const open = useContext(SheetOpener);
  if (!open || !subject) return {};
  const go = () => open({ subject, name });
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": name ?? subject,
    onClick: go,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    },
  };
}

function Img({ subject, name, still, className, children }: { subject?: string; name?: string; still?: boolean; className?: string; children?: ReactNode }) {
  const photo = usePhoto(subject);
  const open = useOpen(still ? undefined : subject, name);
  return (
    <div
      className={`hj-img${photo === undefined ? " is-loading" : ""}${"onClick" in open ? " hj-card" : ""}${className ? ` ${className}` : ""}`}
      {...open}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt={subject ?? ""} draggable={false} /> : null}
      {children}
    </div>
  );
}

/* ---------- Pen, arrows and marks ---------- */

// Each arrow is drawn pointing right in a 120 x 60 box; `dir` turns it, `end` is the tip's tangent.
const ARROWS: Record<ArrowStyle, { d: string; end: number }> = {
  line: { d: "M6 34 Q 60 24 110 30", end: 6 },
  swoop: { d: "M6 54 C 30 6, 80 2, 110 28", end: 41 },
  loop: { d: "M4 46 C 26 48, 48 30, 42 16 C 36 4, 20 12, 28 26 C 38 42, 80 40, 110 30", end: -18 },
  hook: { d: "M10 6 C 8 30, 14 48, 40 48 L 110 44", end: -3 },
  squiggle: { d: "M4 30 C 14 12, 24 12, 32 30 S 50 48, 60 30 S 78 12, 88 30 S 100 40, 110 34", end: -31 },
  bounce: { d: "M4 50 Q 26 2, 48 44 Q 72 8, 110 36", end: 33 },
  dash: { d: "M6 32 Q 58 26 110 30", end: 4 },
};
const TURN: Record<ArrowDir, { deg: number; mirror: boolean }> = {
  right: { deg: 0, mirror: false },
  left: { deg: 180, mirror: true },
  down: { deg: 90, mirror: false },
  up: { deg: -90, mirror: true },
  "down-right": { deg: 40, mirror: false },
  "down-left": { deg: 140, mirror: true },
  "up-right": { deg: -40, mirror: true },
  "up-left": { deg: -140, mirror: false },
};

/** A hand-drawn arrow, `size` em long. It boils like ink and draws itself in once. */
export function HandArrow({ style = "line", dir = "right", size = 3, color = ink }: { style?: ArrowStyle; dir?: ArrowDir; size?: number; color?: string }) {
  const id = useId().replace(/:/g, "");
  const shape = ARROWS[style] ?? ARROWS.line;
  const turn = TURN[dir] ?? TURN.right;
  const tip = shape.d.trim().split(/[ ,]+/).slice(-2).map(Number) as [number, number];
  const back = (shape.end + 180) * (Math.PI / 180);
  const wing = (da: number) => `M${tip[0]} ${tip[1]} L${tip[0] + 15 * Math.cos(back + da)} ${tip[1] + 15 * Math.sin(back + da)}`;
  const vertical = dir === "up" || dir === "down";
  const diagonal = dir.includes("-");
  const w = vertical ? size / 2 : diagonal ? size * 0.85 : size;
  const h = vertical ? size : diagonal ? size * 0.7 : size / 2;
  return (
    <span aria-hidden="true" className="hj-arrow" style={{ width: `${w}em`, height: `${h}em` }}>
      <svg
        viewBox="0 0 120 60"
        style={{ width: `${size}em`, height: `${size / 2}em`, transform: `translate(-50%, -50%) rotate(${turn.deg}deg) scaleY(${turn.mirror ? -1 : 1})` }}
      >
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="1">
            <animate attributeName="seed" values="1;4;8" dur="1.2s" calcMode="discrete" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
        <g filter={`url(#${id})`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path className={style === "dash" ? undefined : "hj-arrow-draw"} d={shape.d} pathLength={1} strokeDasharray={style === "dash" ? "0.05 0.06" : undefined} />
          <path d={`${wing(0.5)} ${wing(-0.5)}`} />
        </g>
      </svg>
    </span>
  );
}

type PenProps = { text?: string; arrow?: ArrowStyle; dir?: ArrowDir };

/** A handwritten note in Drawably Pen with its arrow on the side it points to. */
export function Pen({ note, color, className, style }: { note?: PenProps | string; color: string; className?: string; style?: CSSProperties }) {
  const { text, arrow, dir = "right" } = typeof note === "string" ? { text: note } : (note ?? {});
  if (!text) return null;
  const before = dir === "left" || dir === "up" || dir.startsWith("up-");
  const stacked = dir !== "left" && dir !== "right";
  const mark = arrow ? <HandArrow style={arrow} dir={dir} color={color} /> : null;
  return (
    <span
      className={`hj-pen${stacked ? " is-stacked" : ""} hj-pen--${dir.endsWith("left") ? "start" : dir.endsWith("right") ? "end" : "center"}${className ? ` ${className}` : ""}`}
      style={{ color, ...style }}
    >
      {before ? mark : null}
      <span className="hj-pen__text">{text}</span>
      {before ? null : mark}
    </span>
  );
}

/** Text with one hand mark: _underline_, ==highlight== or ((circle)). */
function Marked({ text, stroke, fill = amber }: { text?: string; stroke: string; fill?: string }) {
  if (!text) return null;
  return (
    <>
      {text.split(/(_[^_]+_|==[^=]+==|\(\([^)]+\)\))/).map((part, i) => {
        if (/^_[^_]+_$/.test(part))
          return <DrawablyUnderline key={i} stroke={stroke} width={3}>{part.slice(1, -1)}</DrawablyUnderline>;
        if (/^==.+==$/.test(part))
          return <DrawablyHighlight key={i} fill={fill}>{part.slice(2, -2)}</DrawablyHighlight>;
        if (/^\(\(.+\)\)$/.test(part))
          return <DrawablyCircle key={i} stroke={stroke} width={3}>{part.slice(2, -2)}</DrawablyCircle>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/* ---------- Spreads ---------- */

export const list = (nodes: unknown) => ((nodes as unknown[] | undefined) ?? []).filter(Boolean);
export const each = (nodes: unknown, renderNode: (node: unknown) => ReactNode) =>
  list(nodes).map((node, i) => <Fragment key={i}>{renderNode(node)}</Fragment>);

/** Child components carry props the spread reads directly, so it can lay them out itself. */
type Node<P> = { props?: Partial<P> } | undefined;
export const propsOf = <P,>(node: unknown) => ((node as Node<P>)?.props ?? {}) as Partial<P>;

type Dish = { name: string; subject: string; price?: string; circled?: boolean };
type Stop = { name: string; subject: string; leg?: string };
type Side = { label: string; subject: string };
type Item = { text: string; subject: string; done?: boolean; aside?: string };
type Tile = { subject: string; note?: string };
export type HotelData = {
  name: string;
  price: string;
  total?: string;
  rating?: string;
  reviews?: string;
  location?: string;
  photo?: string;
  url: string;
  site?: string;
  stars?: number;
};

/** trivago's hotels for one program, by id. The routes append them as a `]]>trivago:{…}` line. */
export const HotelsContext = createContext<Record<string, HotelData>>({});

/** Splits a streamed reply into the OpenUI program and the trivago hotels that came with it.
 *  Cloud prompts wrap each completion in ]]>openui markers, sometimes with a code fence inside.
 *  An agent turn can hold several blocks (a line before a search, the entry, then the gateway's
 *  checked copy of it), so the program is the last block that sets a root. While the reply is
 *  still streaming, a finished block wins over one still arriving, so the page never blanks
 *  while a later copy of the same program is written out. */
export function readReply(text: string, streaming = false) {
  const hotels: Record<string, HotelData> = {};
  for (const [, json] of text.matchAll(/^\]\]>trivago:(.*)$/gm)) {
    try {
      Object.assign(hotels, JSON.parse(json));
    } catch {}
  }
  const blocks = text
    .replace(/^\]\]>trivago:.*$/gm, "")
    .split(/\]\]>openui:[^\n]*/)
    .map((block) => block.replace(/^```[^\n]*$/gm, ""));
  const hasRoot = (block: string) => /^\s*root\s*=/m.test(block);
  const done = streaming ? blocks.slice(0, -1) : blocks;
  const program = done.findLast(hasRoot) ?? blocks.findLast(hasRoot) ?? "";
  return { program, hotels };
}

/** The hotels a list of Hotel("id") nodes names, in order, skipping any trivago didn't return. */
export function useHotels(nodes: unknown) {
  const all = useContext(HotelsContext);
  return list(nodes)
    .map((n) => all[propsOf<{ id: string }>(n).id ?? ""])
    .filter((h): h is HotelData => !!h?.name && !!h.url);
}

/** A trivago hotel: its photo, name and nightly price, the whole card a link to book. */
export function HotelCard({ hotel, circled, color }: { hotel: Partial<HotelData>; circled?: boolean; color: string }) {
  const price = <span className="hj-hotel__price">{hotel.price}</span>;
  return (
    <a className="hj-hotel" href={hotel.url} target="_blank" rel="noopener noreferrer">
      <span className="hj-img hj-hotel__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hotel.photo ? <img src={hotel.photo} alt={hotel.name ?? ""} draggable={false} /> : null}
      </span>
      <span className="hj-hotel__name">{hotel.name}</span>
      <span className="hj-hotel__line">
        {circled ? (
          <DrawablyCircle stroke={color} width={2.5}>
            {price}
          </DrawablyCircle>
        ) : (
          price
        )}
        {hotel.rating ? <span className="hj-hotel__rating">{hotel.rating}</span> : null}
      </span>
      {hotel.location ? <span className="hj-hotel__where">{hotel.location}</span> : null}
    </a>
  );
}

const spread = (name: string, extra = "") => `hj-page hj-spread hj-${name}${extra ? ` ${extra}` : ""}`;

export const journalLibrary = buildLibrary({
  // The parts render nothing on their own; each spread places them.
  Pen: () => null,
  Dish: () => null,
  Stop: () => null,
  Side: () => null,
  Item: () => null,
  Tile: () => null,
  Hotel: () => null,

  Bleed: ({ props }: { props: { title?: string; subject?: string; note?: unknown; color?: Hue } }) => (
    <section className={spread("bleed")}>
      {/* The opening page is a cover to read, not a card to open. */}
      <Img subject={props.subject} still />
      <h2>{props.title}</h2>
      <Pen note={propsOf<PenProps>(props.note)} color={props.color && props.color !== "ink" ? hex(props.color, "coral") : white} className="hj-bleed__pen" />
    </section>
  ),

  Split: ({ props }: { props: { title?: string; text?: string; subject?: string; note?: unknown; color?: Hue; photo?: "left" | "right" } }) => {
    const fg = onBlock(props.color ?? "cobalt");
    return (
      <section className={spread("split", props.photo === "left" ? "is-flipped" : "")}>
        <div className="hj-split__block" style={{ background: hex(props.color, "cobalt"), color: fg }}>
          <h2>
            <Marked text={props.title} stroke={fg} fill={props.color === "amber" ? white : amber} />
          </h2>
          <p>{props.text}</p>
          <Pen note={propsOf<PenProps>(props.note)} color={fg} className="hj-split__pen" />
        </div>
        <Img subject={props.subject} />
      </section>
    );
  },

  Trio: ({ props }: { props: { title?: string; dishes?: unknown[]; note?: unknown; color?: Hue } }) => {
    const pen = penOnCanvas(props.color);
    return (
      <section className={spread("trio")}>
        <header>
          <h2>
            <Marked text={props.title} stroke={pen} />
          </h2>
          <Pen note={propsOf<PenProps>(props.note)} color={pen} />
        </header>
        <div className="hj-trio__row">
          {list(props.dishes).slice(0, 3).map((node, i) => {
            const d = propsOf<Dish>(node);
            return (
              <figure key={i}>
                <Img subject={d.subject} name={d.name} />
                <figcaption>
                  <span>{d.name}</span>
                  {d.price ? (
                    d.circled ? (
                      <DrawablyCircle stroke={pen} width={2.5}>
                        <span className="hj-trio__price">{d.price}</span>
                      </DrawablyCircle>
                    ) : (
                      <span className="hj-trio__price">{d.price}</span>
                    )
                  ) : null}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>
    );
  },

  Sentence: ({ props }: { props: { text?: string; note?: unknown; color?: Hue } }) => {
    const pen = penOnCanvas(props.color);
    return (
      <section className={spread("sentence")}>
        <h2>
          {(props.text ?? "").split(/(\[[^\]]+\])/).map((part, i) =>
            /^\[.+\]$/.test(part) ? (
              <InlinePhoto key={i} subject={part.slice(1, -1)} wide={i % 4 === 3} />
            ) : (
              <Marked key={i} text={part.replace(/\[[^\]]*$/, "")} stroke={pen} />
            ),
          )}
        </h2>
        <Pen note={propsOf<PenProps>(props.note)} color={pen} className="hj-sentence__pen" />
      </section>
    );
  },

  Route: ({ props }: { props: { title?: string; stops?: unknown[]; arrow?: ArrowStyle; color?: Hue; dark?: boolean } }) => {
    const pen = props.dark ? hex(props.color, "amber") : penOnCanvas(props.color);
    const stops = list(props.stops).slice(0, 4).map((n) => propsOf<Stop>(n));
    return (
      <section className={spread("route", props.dark ? "is-dark" : "")}>
        <h2>
          <Marked text={props.title} stroke={pen} />
        </h2>
        <div className="hj-route__row">
          {stops.map((s, i) => (
            <Fragment key={i}>
              <figure className={i % 2 ? "is-tall" : undefined}>
                <Img subject={s.subject} name={s.name} />
                <figcaption>{s.name}</figcaption>
              </figure>
              {i < stops.length - 1 ? (
                <div className="hj-route__leg" style={{ color: pen }}>
                  {s.leg ? <span className="hj-pen__text">{s.leg}</span> : null}
                  <HandArrow style={props.arrow ?? "dash"} dir="right" size={4.5} color={pen} />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </section>
    );
  },

  Quote: ({ props }: { props: { quote?: string; subject?: string; reply?: unknown; color?: Hue; photo?: "left" | "right" } }) => (
    <section className={spread("quote", props.photo === "left" ? "is-flipped" : "")}>
      <div className="hj-quote__words">
        <p>{props.quote ? `“${props.quote.replace(/^["“]|["”]$/g, "")}”` : null}</p>
        <Pen note={propsOf<PenProps>(props.reply)} color={penOnCanvas(props.color)} />
      </div>
      <Img subject={props.subject} />
    </section>
  ),

  Versus: ({ props }: { props: { title?: string; a?: unknown; b?: unknown; verdict?: unknown; color?: Hue } }) => (
    <section className={spread("versus")}>
      <div className="hj-versus__pair">
        {[props.a, props.b].map((node, i) => {
          const side = propsOf<Side>(node);
          return (
            <Img key={i} subject={side.subject} name={side.label}>
              <span className="hj-pen__text hj-versus__label" style={{ rotate: `${i ? 4 : -5}deg` }}>
                {side.label}
              </span>
            </Img>
          );
        })}
        {props.title ? (
          <h2 style={{ background: props.color && props.color !== "amber" ? hex(props.color, "ink") : ink }}>{props.title}</h2>
        ) : null}
      </div>
      <Pen note={propsOf<PenProps>(props.verdict)} color={penOnCanvas(props.color)} className="hj-versus__pen" />
    </section>
  ),

  Price: ({ props }: { props: { price?: string; item?: string; subject?: string; note?: string; color?: Hue } }) => {
    const fg = onBlock(props.color ?? "coral");
    return (
      <section className={spread("price")} style={{ background: hex(props.color, "coral"), color: fg }}>
        <Img subject={props.subject} name={props.item} />
        <div className="hj-price__words">
          <div>
            {props.price ? (
              <DrawablyCircle stroke={fg} width={3}>
                <span className="hj-price__amount">{props.price}</span>
              </DrawablyCircle>
            ) : null}
            <p>{props.item}</p>
          </div>
          <Pen note={props.note} color={fg} />
        </div>
      </section>
    );
  },

  Checklist: ({ props }: { props: { title?: string; items?: unknown[]; color?: Hue } }) => {
    const pen = penOnCanvas(props.color);
    return (
      <section className={spread("checklist")}>
        <h2>
          <Marked text={props.title} stroke={pen} />
        </h2>
        <ul>
          {list(props.items).slice(0, 6).map((node, i) => {
            const it = propsOf<Item>(node);
            return (
              <li key={i}>
                <Img subject={it.subject} name={it.text} />
                <span className="hj-checklist__text">
                  {it.done && it.text ? <DrawablyHighlight fill={amber}>{it.text}</DrawablyHighlight> : it.text}
                </span>
                <span className="hj-pen__text" style={{ color: pen }}>
                  {it.aside ?? ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );
  },

  Mosaic: ({ props }: { props: { title?: string; tiles?: unknown[]; color?: Hue } }) => (
    <section className={spread("mosaic")}>
      <div className="hj-mosaic__grid">
        {list(props.tiles).slice(0, 5).map((node, i) => {
          const t = propsOf<Tile>(node);
          return (
            <Img key={i} subject={t.subject}>
              {t.note ? <span className="hj-pen__text hj-mosaic__note">{t.note}</span> : null}
            </Img>
          );
        })}
      </div>
      {props.title ? (
        <h2 style={{ background: hex(props.color, "magenta"), color: onBlock(props.color ?? "magenta") }}>{props.title}</h2>
      ) : null}
    </section>
  ),

  Stays: function Stays({ props }: { props: { title?: string; hotels?: unknown[]; note?: unknown; color?: Hue } }) {
    const pen = penOnCanvas(props.color);
    const hotels = useHotels(props.hotels).slice(0, 4);
    return (
      <section className={spread("stays")} style={{ ["--n" as string]: Math.max(hotels.length, 2) }}>
        <header>
          <h2>
            <Marked text={props.title} stroke={pen} />
          </h2>
          <Pen note={propsOf<PenProps>(props.note)} color={pen} />
        </header>
        <div className="hj-stays__row">
          {hotels.map((h, i) => (
            <HotelCard key={i} hotel={h} circled={i === 0} color={pen} />
          ))}
        </div>
      </section>
    );
  },

  Journal: ({ props, renderNode }: { props: { pages?: unknown[] }; renderNode: (node: unknown) => ReactNode }) => <>{each(props.pages, renderNode)}</>,
} as never);

/** A photo set into a line of type like a word. */
function InlinePhoto({ subject, wide }: { subject: string; wide?: boolean }) {
  const photo = usePhoto(subject);
  const open = useOpen(subject);
  return (
    <span className={`hj-inline${wide ? " is-wide" : ""}${photo === undefined ? " is-loading" : ""}${"onClick" in open ? " hj-card" : ""}`} {...open}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt={subject} draggable={false} /> : null}
    </span>
  );
}
