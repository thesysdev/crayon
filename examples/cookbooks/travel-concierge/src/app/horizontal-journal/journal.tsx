"use client";

import { Renderer } from "@openuidev/react-lang";
import { ArrowUp, History, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HotelsContext, journalLibrary, type Opened, readReply, SheetOpener } from "./library";
import { DetailSheet } from "./sheet";
import "./journal.css";

// A journal you read sideways, left to right: your message on its own page, the entry's
// spreads (photos, big type, pen notes) to its right, then a whole-page prompt for the next
// one. What you type stays on the page you typed it on; new pages are added after it. Journals live in this browser's storage.

type Turn = { prompt: string; code: string };
type Journal = { id: string; title: string; turns: Turn[]; updated: number };

const KEY = "horizontal-journal:v1";
const fresh = (): Journal => ({ id: crypto.randomUUID(), title: "New journal", turns: [], updated: Date.now() });

function load(): Journal[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}


// A journal is named after its opening Bleed, and its history thumbnail is that Bleed's photo.
const bleed = (turns: Turn[]) => turns[0]?.code.match(/Bleed\(\s*"([^"]+)"\s*,\s*"([^"]+)"/);
const titleOf = (turns: Turn[]) => bleed(turns)?.[1] ?? turns[0]?.prompt.slice(0, 40) ?? "New journal";

export default function HorizontalJournal() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [pending, setPending] = useState<Turn | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sheet, setSheet] = useState<Opened | null>(null);
  const sheetOpen = useRef(false);
  sheetOpen.current = !!sheet;
  const closeSheet = useCallback(() => setSheet(null), []);
  const strip = useRef<HTMLDivElement>(null);
  const landing = useRef<number | null>(null);

  // Start on a blank journal; earlier ones wait in history.
  useEffect(() => {
    const first = fresh();
    setJournals([first, ...load().filter((j) => j.turns.length)]);
    setActiveId(first.id);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(journals.filter((j) => j.turns.length)));
    } catch {}
  }, [journals]);

  const active = journals.find((j) => j.id === activeId);
  const turns = [...(active?.turns ?? []), ...(pending ? [pending] : [])];

  const pages = () => [...(strip.current?.querySelectorAll<HTMLElement>(".hj-page") ?? [])];
  const goTo = useCallback((index: number, smooth = true) => {
    const list = pages();
    const page = list[Math.max(0, Math.min(index, list.length - 1))];
    strip.current?.scrollTo({ left: page?.offsetLeft ?? 0, behavior: smooth ? "smooth" : "auto" });
  }, []);
  const current = () => Math.round((strip.current?.scrollLeft ?? 0) / window.innerWidth);

  // Once the new entry's first page exists, glide to it.
  useEffect(() => {
    if (landing.current === null) return;
    const page = pages()[landing.current];
    if (page) {
      goTo(landing.current);
      landing.current = null;
    }
  });

  // A vertical wheel turns one page at a time, so a mouse reads the journal like a trackpad.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (locked || Math.abs(e.deltaY) < 8) return;
      locked = true;
      goTo(current() + Math.sign(e.deltaY));
      setTimeout(() => (locked = false), 650);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || sheetOpen.current) return;
      if (e.key === "ArrowRight") goTo(current() + 1);
      if (e.key === "ArrowLeft") goTo(current() - 1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [goTo]);

  const update = (id: string, change: (j: Journal) => Journal) =>
    setJournals((list) => list.map((j) => (j.id === id ? change(j) : j)));

  async function send(prompt: string) {
    if (!active || pending) return;
    const id = active.id;
    const history = active.turns;
    // The prompt page becomes this message's page, so the entry starts one page to its right.
    landing.current = pages().length;
    let code = "";
    setPending({ prompt, code });
    try {
      const response = await fetch("/api/horizontal-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, history }),
      });
      if (!response.ok || !response.body) throw new Error((await response.json()).error);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        code += decoder.decode(value, { stream: true });
        setPending({ prompt, code });
      }
      update(id, (j) => {
        const next = [...j.turns, { prompt, code }];
        return { ...j, turns: next, title: titleOf(next), updated: Date.now() };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      update(id, (j) => ({
        ...j,
        turns: [...j.turns, { prompt, code: `root = Journal([n])\nn = Sentence(${JSON.stringify(`That didn't work. ${message}`)})` }],
      }));
    } finally {
      setPending(null);
    }
  }

  function newJournal() {
    setHistoryOpen(false);
    if (active && !active.turns.length) return goTo(0);
    const j = fresh();
    setJournals((list) => [j, ...list]);
    setActiveId(j.id);
    requestAnimationFrame(() => goTo(0, false));
  }

  return (
    <>
      <SheetOpener.Provider value={setSheet}>
      <div className="hj-strip" ref={strip}>
        {turns.map((turn, i) => {
          const reply = readReply(turn.code, turn === pending);
          return (
            <div className="hj-entry" key={`${activeId}:${i}`}>
              <Said text={turn.prompt} writing={turn === pending} />
              <HotelsContext.Provider value={reply.hotels}>
                <Renderer response={reply.program} library={journalLibrary} isStreaming={turn === pending} />
              </HotelsContext.Provider>
            </div>
          );
        })}
        {pending ? null : <Ask key={`${activeId}:${turns.length}`} onSend={send} followUp={turns.length > 0} />}
      </div>
      </SheetOpener.Provider>

      {sheet ? (
        <DetailSheet
          key={sheet.subject}
          open={sheet}
          context={turns.map((t) => t.prompt).join(" / ")}
          onClose={closeSheet}
        />
      ) : null}

      <nav className="hj-pill" aria-label="Journal">
        <button type="button" onClick={newJournal} title="New journal" aria-label="New journal">
          <Plus size={20} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => setHistoryOpen((open) => !open)}
          title="History"
          aria-label="History"
          aria-expanded={historyOpen}
          className={historyOpen ? "is-on" : undefined}
        >
          <History size={19} strokeWidth={1.6} />
        </button>
      </nav>

      {historyOpen ? (
        <aside className="hj-history" aria-label="History">
          <h2>Journals</h2>
          <ul>
            {journals
              .filter((j) => j.turns.length)
              .map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className={j.id === activeId ? "is-active" : undefined}
                    disabled={!!pending}
                    onClick={() => {
                      setActiveId(j.id);
                      setHistoryOpen(false);
                      requestAnimationFrame(() => goTo(0, false));
                    }}
                  >
                    <HistoryCover journal={j} />
                    <span className="hj-history__name">{j.title}</span>
                  </button>
                </li>
              ))}
          </ul>
          {journals.every((j) => !j.turns.length) ? <p>Your journals will appear here.</p> : null}
        </aside>
      ) : null}
    </>
  );
}

/** A history row's thumbnail: the photo on the journal's cover page. */
function HistoryCover({ journal }: { journal: Journal }) {
  const subject = bleed(journal.turns)?.[2];
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    if (!subject) return;
    fetch(`/api/moodboard/images?kind=named&q=${encodeURIComponent(subject)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((photo: { url: string } | null) => setSrc(photo?.url))
      .catch(() => {});
  }, [subject]);
  return (
    <span className="hj-history__cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : null}
    </span>
  );
}

/** Your message, kept on the page where you wrote it, in the same place and type as the prompt. */
function Said({ text, writing }: { text: string; writing: boolean }) {
  return (
    <section className="hj-page hj-ask hj-said">
      <div className="hj-ask__form">
        <p className="hj-ask__text">{text}</p>
        <div className={`hj-ask__foot${writing ? " is-writing" : ""}`} />
      </div>
    </section>
  );
}

/** The whole-page prompt: first page of a new journal, last page after every entry. */
function Ask({ onSend, followUp }: { onSend: (prompt: string) => void; followUp: boolean }) {
  const [value, setValue] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!followUp) area.current?.focus();
  }, [followUp]);
  const submit = () => {
    const prompt = value.trim();
    if (prompt) onSend(prompt);
  };
  return (
    <section className="hj-page hj-ask">
      <form
        className="hj-ask__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={area}
          className="hj-ask__text"
          value={value}
          rows={3}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={followUp ? "Where next?" : "Where to?"}
          aria-label="Write a destination or ask about a place"
        />
        <div className="hj-ask__foot">
          <button type="submit" className="hj-ask__send" disabled={!value.trim()} aria-label="Write entry">
            <ArrowUp size={40} strokeWidth={1.5} />
          </button>
        </div>
      </form>
    </section>
  );
}
