"use client";

import { Renderer } from "@openuidev/react-lang";
import { X } from "lucide-react";
import { createContext, Fragment, type KeyboardEvent as ReactKeyboardEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { each, type HotelData, HotelsContext, Pen, readReply, useHotels, usePhoto } from "./library";
import { buildSheetLibrary } from "./sheet-schema";
import { SaveButton, SaveHeart } from "./itinerary";
import { HotelSheet, type HotelOpened } from "./hotel-sheet";
import { Breeze } from "./breeze";
import { SheetMiniMap } from "./map";
import { Price } from "./money";
import "./sheet.css";

// The detail sheet: a photo's click opens it in the middle of the screen, and OpenUI writes it
// from /api/planner/sheet, laid out like an Airbnb listing. Sheets are kept per
// photo for the session, so reopening one is instant. A nearby place inside a sheet opens its
// own sheet stacked on top; closing it returns to the one beneath.

const coral = "#ff5364";

function Photo({ subject, className, name, note }: { subject?: string; className?: string; name?: string; note?: string }) {
  const photo = usePhoto(subject);
  return (
    <div className={`hj-img${photo === undefined ? " is-loading" : ""}${className ? ` ${className}` : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt={subject ?? ""} draggable={false} /> : null}
      {subject && photo ? <SaveHeart item={{ subject, name: name ?? subject, photo: photo.url, description: note, kind: "place" }} /> : null}
    </div>
  );
}

/** The sheet's own "Add to itinerary": the place with everything the sheet knows about it. */
function SheetSave({ props, hotel }: { props: SheetProps; hotel?: Partial<HotelData> }) {
  const subject = props.photos?.[0];
  const photo = usePhoto(subject);
  if (!props.title) return null;
  return (
    <SaveButton
      item={{
        subject,
        name: props.title,
        photo: photo?.url,
        place: props.line,
        description: props.about,
        url: hotel?.url,
        price: hotel?.price,
        kind: "place",
      }}
    />
  );
}

type SheetProps = {
  title?: string;
  line?: string;
  photos?: string[];
  highlights?: unknown[];
  about?: string;
  sections?: unknown[];
  tips?: string[];
  hotels?: unknown[];
  note?: string;
};

function Tips({ tips }: { tips?: string[] }) {
  return tips?.length ? (
    <ul className="hj-doc__tips">
      {tips.map((tip, i) => (
        <li key={i}>{tip}</li>
      ))}
    </ul>
  ) : null;
}

/** The booking card: trivago's hotels, each row a link, the first one bookable from the button. */
function Booking({ hotels }: { hotels: Partial<HotelData>[] }) {
  const [first] = hotels;
  return (
    <div className="hj-doc__booking">
      <div className="hj-doc__from">
        <Price price={first.price} suffix="a night" />
      </div>
      <ul>
        {hotels.map((h, i) => (
          <li key={i}>
            <a href={h.url} target="_blank" rel="noopener noreferrer">
              <span className="hj-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {h.photo ? <img src={h.photo} alt="" /> : null}
              </span>
              <span className="hj-doc__hotel">
                <span>{h.name}</span>
                <span className="hj-doc__muted">{[h.rating, h.location].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="hj-doc__price">
                <Price price={h.price} />
              </span>
            </a>
          </li>
        ))}
      </ul>
      <a className="hj-doc__book" href={first.url} target="_blank" rel="noopener noreferrer">
        Book on trivago
      </a>
    </div>
  );
}

type Opened = { subject: string; name?: string; hotel?: HotelOpened };

/** Opens a place from inside a sheet as a new sheet on top. Absent where nothing can stack. */
export const StackOpener = createContext<((what: Opened) => void) | null>(null);

export const sheetLibrary = buildSheetLibrary({
  Highlight: (({ props }: { props: { title?: string; text?: string } }) => (
    <li>
      <span className="hj-doc__strong">{props.title}</span>
      <span className="hj-doc__muted">{props.text}</span>
    </li>
  )) as never,
  Thing: function Thing({ props }: { props: { name?: string; subject?: string; note?: string } }) {
    const stack = useContext(StackOpener);
    const subject = props.subject;
    const go = stack && subject ? () => stack({ subject, name: props.name }) : undefined;
    const open = go
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": props.name ?? subject,
          onClick: go,
          onKeyDown: (e: ReactKeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              go();
            }
          },
        }
      : {};
    return (
      <div className={`hj-doc__thing${go ? " is-open" : ""}`} {...open}>
        <Photo subject={subject} name={props.name} note={props.note} />
        <span className="hj-doc__strong">{props.name}</span>
        <span className="hj-doc__muted">{props.note}</span>
      </div>
    );
  } as never,
  Section: (({ props, renderNode }: { props: { title?: string; things?: unknown[] }; renderNode: (n: unknown) => React.ReactNode }) => (
    <section className="hj-doc__section">
      <h3>{props.title}</h3>
      <div className="hj-doc__things">{each(props.things, renderNode)}</div>
    </section>
  )) as never,
  Hotel: (() => null) as never,
  Sheet: function Sheet({ props, renderNode }: { props: SheetProps; renderNode: (n: unknown) => React.ReactNode }) {
    const hotels = useHotels(props.hotels);
    const photos = (props.photos ?? []).slice(0, 5);
    return (
      <article className="hj-doc">
        <header>
          <h1>{props.title}</h1>
          <p className="hj-doc__muted">{props.line}</p>
          <SheetSave props={props} hotel={hotels[0]} />
        </header>
        <div className="hj-doc__photos">
          {Array.from({ length: 5 }, (_, i) => (
            <Photo key={i} subject={photos[i]} />
          ))}
        </div>
        <div className="hj-doc__body">
          <div className="hj-doc__main">
            <ul className="hj-doc__highlights">{each(props.highlights, renderNode)}</ul>
            {props.about ? <p className="hj-doc__about">{props.about}</p> : null}
            {each(props.sections, renderNode)}
            {hotels.length ? (
              <section className="hj-doc__section">
                <Tips tips={props.tips} />
              </section>
            ) : null}
          </div>
          <aside>
            <div className="hj-doc__card">
              {props.note ? <Pen note={props.note} color={coral} className="hj-doc__pen" /> : null}
              {hotels.length ? <Booking hotels={hotels} /> : <Tips tips={props.tips} />}
            </div>
            {props.title ? <SheetMiniMap name={props.title} /> : null}
          </aside>
        </div>
      </article>
    );
  } as never,
});

const written = new Map<string, string>();

/** The centred sheet over the journal, and any sheets opened from inside it, stacked. Escape, the
 *  backdrop or the close mark dismiss the top one. */
export function DetailSheet({ open, context, onClose }: { open: Opened; context: string; onClose: () => void }) {
  const [above, setAbove] = useState<Opened[]>([]);
  const sheets = [open, ...above];
  const closeTop = useCallback(() => (above.length ? setAbove((list) => list.slice(0, -1)) : onClose()), [above.length, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeTop();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeTop]);

  return (
    <div className="hj-sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeTop()}>
      {sheets.map((sheet, i) => (
        <div
          key={`${i}:${sheet.subject}`}
          className="hj-sheet-layer"
          style={{ ["--depth" as string]: sheets.length - 1 - i }}
          inert={i < sheets.length - 1}
          data-buried={sheets.length - 1 - i > 2 || undefined}
          onMouseDown={(e) => e.target === e.currentTarget && closeTop()}
        >
          <SheetPanel
            open={sheet}
            // A stacked sheet knows where it was opened from, so it reads as part of the same trip.
            context={[context, ...sheets.slice(0, i).map((s) => `from the sheet for ${s.name ?? s.subject}`)].join(" / ")}
            onClose={closeTop}
            onOpen={(next) => setAbove((list) => [...list.slice(0, i), next])}
          />
        </div>
      ))}
    </div>
  );
}

/** One sheet, written by the agent as it streams in. */
function SheetPanel({ open, context, onClose, onOpen }: { open: Opened; context: string; onClose: () => void; onOpen: (what: Opened) => void }) {
  const [code, setCode] = useState(() => written.get(open.subject) ?? "");
  const [streaming, setStreaming] = useState(!written.has(open.subject));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
  }, []);

  useEffect(() => {
    // A hotel's sheet shows what trivago gave us; there's nothing to write.
    if (open.hotel || written.has(open.subject)) return;
    const controller = new AbortController();
    (async () => {
      let text = "";
      try {
        const response = await fetch("/api/planner/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...open, context }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setCode(text);
        }
        written.set(open.subject, text);
      } catch {
        if (controller.signal.aborted) return;
      }
      setStreaming(false);
    })();
    return () => controller.abort();
  }, [open, context]);

  // Until the Sheet's root line is whole (the agent may search trivago first, and a Sheet with
  // missing props renders nothing), the waiting sheet holds its shape so the panel never blanks.
  const reply = readReply(code, streaming);
  const ready = /^\s*root\s*=\s*Sheet\(.*\)\s*$/m.test(reply.program);
  // The sheet appears whole, like a journal spread: the waiting sheet stays until the agent has
  // finished and the photos are in (at most 2.5s more), then the written sheet replaces it at once.
  const done = ready && !streaming;
  const content = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!done || shown) return;
    const started = performance.now();
    let timer = 0;
    const check = () => {
      const frames = [...(content.current?.querySelectorAll(".hj-img") ?? [])];
      const loaded = frames.every((f) => {
        const img = f.querySelector("img");
        return img && img.complete && img.naturalWidth > 0;
      });
      if ((frames.length && loaded) || performance.now() - started > 2500) setShown(true);
      else timer = window.setTimeout(check, 120);
    };
    check();
    return () => window.clearTimeout(timer);
  }, [done, shown]);
  return (
    <div className="hj-sheet-panel" role="dialog" aria-modal="true" aria-label={open.name ?? open.subject} ref={panel} tabIndex={-1}>
      <button type="button" className="hj-sheet-close" onClick={onClose} aria-label="Close">
        <X size={26} strokeWidth={1.5} />
      </button>
      {open.hotel ? (
        <HotelSheet hotel={open.hotel} />
      ) : (
        <section className="hj-sheet-stage">
          {/* Mounted (hidden) from the first whole root line, so the Renderer sees the stream. */}
          {ready ? (
            <div ref={content} className={`hj-sheet-content${shown ? " is-shown" : ""}`} aria-hidden={!shown}>
              <StackOpener.Provider value={onOpen}>
                <HotelsContext.Provider value={reply.hotels}>
                  <Renderer response={reply.program} library={sheetLibrary} isStreaming={streaming} />
                </HotelsContext.Provider>
              </StackOpener.Provider>
            </div>
          ) : null}
          {shown ? null : <WaitingSheet title={open.name ?? open.subject} />}
        </section>
      )}
    </div>
  );
}

/** The sheet's shape while the agent writes it. */
export function WaitingSheet({ title }: { title: string }) {
  return (
    <Fragment>
      {/* The journal's loading state: the title writes itself in pencil, the photo wells shimmer,
          and the light landscapes drift along the foot of the sheet. */}
      <article className="hj-doc is-waiting">
        <Breeze prompt={title} />
        <header>
          <h1 className="hj-doc__writing" aria-label={title}>
            {[...title].map((ch, i) => (
              <span key={i} className="hj-said__letter" style={{ ["--i" as string]: i }} aria-hidden>
                {ch}
              </span>
            ))}
          </h1>
        </header>
        <div className="hj-doc__photos">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="hj-img is-loading is-shimmer" />
          ))}
        </div>
      </article>
    </Fragment>
  );
}
