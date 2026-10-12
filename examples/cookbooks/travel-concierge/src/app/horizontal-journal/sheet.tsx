"use client";

import { Renderer } from "@openuidev/react-lang";
import { X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { each, type HotelData, HotelsContext, Pen, readReply, useHotels, usePhoto } from "./library";
import { buildSheetLibrary } from "./sheet-schema";
import "./sheet.css";

// The detail sheet: a photo's click opens it in the middle of the screen, and OpenUI writes it
// from /api/horizontal-journal/sheet, laid out like an Airbnb listing. Sheets are kept per
// photo for the session, so reopening one is instant.

const coral = "#ff5364";

function Photo({ subject, className }: { subject?: string; className?: string }) {
  const photo = usePhoto(subject);
  return (
    <div className={`hj-img${photo === undefined ? " is-loading" : ""}${className ? ` ${className}` : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt={subject ?? ""} draggable={false} /> : null}
    </div>
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
      <div className="hj-doc__from">{first.price}</div>
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
              <span className="hj-doc__price">{h.price}</span>
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

export const sheetLibrary = buildSheetLibrary({
  Highlight: (({ props }: { props: { title?: string; text?: string } }) => (
    <li>
      <span className="hj-doc__strong">{props.title}</span>
      <span className="hj-doc__muted">{props.text}</span>
    </li>
  )) as never,
  Thing: (({ props }: { props: { name?: string; subject?: string; note?: string } }) => (
    <div className="hj-doc__thing">
      <Photo subject={props.subject} />
      <span className="hj-doc__strong">{props.name}</span>
      <span className="hj-doc__muted">{props.note}</span>
    </div>
  )) as never,
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
          </aside>
        </div>
      </article>
    );
  } as never,
});

type Opened = { subject: string; name?: string };
const written = new Map<string, string>();

/** The centred sheet over the journal. Escape, the backdrop or the close mark dismiss it. */
export function DetailSheet({ open, context, onClose }: { open: Opened; context: string; onClose: () => void }) {
  const [code, setCode] = useState(() => written.get(open.subject) ?? "");
  const [streaming, setStreaming] = useState(!written.has(open.subject));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (written.has(open.subject)) return;
    const controller = new AbortController();
    (async () => {
      let text = "";
      try {
        const response = await fetch("/api/horizontal-journal/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...open, context }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error((await response.json()).error);
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
  return (
    <div className="hj-sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hj-sheet-panel" role="dialog" aria-modal="true" aria-label={open.name ?? open.subject} ref={panel} tabIndex={-1}>
        <button type="button" className="hj-sheet-close" onClick={onClose} aria-label="Close">
          <X size={26} strokeWidth={1.5} />
        </button>
        {ready ? (
          <HotelsContext.Provider value={reply.hotels}>
            <Renderer response={reply.program} library={sheetLibrary} isStreaming={streaming} />
          </HotelsContext.Provider>
        ) : (
          <Fragment>
            <article className="hj-doc is-waiting">
              <header>
                <h1>{open.name ?? open.subject}</h1>
              </header>
              <div className="hj-doc__photos">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="hj-img is-loading" />
                ))}
              </div>
            </article>
          </Fragment>
        )}
      </div>
    </div>
  );
}
