"use client";

import { Renderer } from "@openuidev/react-lang";
import { History, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HotelsContext, journalLibrary, type Opened, readReply, SheetOpener } from "./library";
import { GridOverlay, useGridOverlay } from "./grid-overlay";
import dynamic from "next/dynamic";
import { PlannerHome, PlannerNext } from "./home";
import { ItineraryProvider } from "./itinerary";
import { ChatView, type ChatTurnData } from "./chat/chat";
import { placeOf } from "./chat/chat-library";
import { iconFor } from "./place-icon";
import { type PlannerMode, PlannerChatTabs } from "./chat/chat-tabs";
import { Breeze } from "./breeze";
import { wholeSlides } from "./slides";
import { LatestArrow } from "./latest-arrow";
import { TripBridge } from "./itinerary-spread";
import { Mascot } from "./mascot";
import { readTraveller, travellerLine } from "./money";
import { DetailSheet } from "./sheet";
import { bookingOf, followUps, Reply } from "./steps";
import "./journal.css";

// A journal you read sideways, left to right: your message on its own page, the entry's
// spreads (photos, big type, pen notes) to its right, then a whole-page prompt for the next
// one. What you type stays on the page you typed it on; new pages are added after it. Journals live in this browser's storage.

type Turn = { prompt: string; code: string };
// A trip's chat (the Chat tab) is kept with its journal, so the two share one trip.
type Journal = {
  id: string;
  title: string;
  turns: Turn[];
  chat?: ChatTurnData[];
  updated: number;
  /** How much of the chat Explore has picked up. */
  resumed?: number;
  /** The trip's dates, from whichever tab picked them last. */
  dates?: string;
};
const hasAny = (j: Journal) => j.turns.length > 0 || !!j.chat?.length;
const modes: PlannerMode[] = ["explore", "chat", "itinerary"];
/** The tab and trip the address names: /planner/<tab>?trip=<id>. */
const fromUrl = () => {
  const tab = location.pathname.match(/^\/planner\/(\w+)/)?.[1] as PlannerMode | undefined;
  return { mode: tab && modes.includes(tab) ? tab : ("explore" as PlannerMode), trip: new URLSearchParams(location.search).get("trip") ?? undefined };
};

const KEY = "planner:v1";

// The Itinerary tab's canvas (tldraw) reads the window, so it loads only in the browser.
const ItineraryBoard = dynamic(() => import("./board"), { ssr: false });
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
/** The dates a turn settles, in Explore or Chat: a booking's or a hotel search's check-in and
 *  check-out, else dates the traveller gave or picked ("6 November to 10 November 2026"). */
function datesIn(turn: Turn) {
  const program = readReply(turn.code).program;
  const booked = bookingOf(program);
  if (booked?.checkIn && booked.checkOut) return `${booked.checkIn} to ${booked.checkOut}`;
  const searched = program.match(/\bHotels\(\s*\[[^\]]*\]\s*,\s*"(\d{4}-\d{2}-\d{2})"\s*,\s*"(\d{4}-\d{2}-\d{2})"/);
  if (searched) return `${searched[1]} to ${searched[2]}`;
  return turn.prompt.match(/\d{1,2} \w+ to \d{1,2} \w+ \d{4}/)?.[0];
}
const titleOf = (turns: Turn[]) => bleed(turns)?.[1] ?? turns[0]?.prompt.slice(0, 40) ?? "New journal";

export default function HorizontalJournal() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [pending, setPending] = useState<Turn | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // The Swiss grid overlay: Ctrl+G or ?grid (no button in the pill).
  const [grid] = useGridOverlay();
  const [mode, setMode] = useState<PlannerMode>("explore");
  const [sheet, setSheet] = useState<Opened | null>(null);
  const sheetOpen = useRef(false);
  sheetOpen.current = !!sheet;
  const closeSheet = useCallback(() => setSheet(null), []);
  const strip = useRef<HTMLDivElement | null>(null);
  const following = useRef({ on: false, said: 0, step: 0 });
  // The strip's element can be replaced while the journal lives on (a context provider above it
  // is recreated, as on every hot reload of library.tsx or steps.tsx in development). A new strip
  // starts at scrollLeft 0, which threw the reader back to the first page mid-generation, so the
  // journal keeps the reading position and hands it to whichever strip element is mounted.
  const readingAt = useRef(0);
  const [stripEl, setStripEl] = useState<HTMLDivElement | null>(null);
  const stripRef = useCallback((el: HTMLDivElement | null) => {
    strip.current = el;
    if (el) el.scrollLeft = readingAt.current;
    setStripEl(el);
  }, []);
  const started = useRef(false);

  // Start on a blank journal; earlier ones wait in history. Only once: a hot reload re-runs
  // effects, and a second fresh journal would swap the trip being written for a blank one.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const first = fresh();
    const saved = load().filter(hasAny);
    setJournals([first, ...saved]);
    // A link names the tab and the trip (/planner/chat?trip=…): open there when this browser has it.
    const at = fromUrl();
    setActiveId(saved.some((j) => j.id === at.trip) ? at.trip! : first.id);
    setMode(at.mode);
  }, []);

  // The address follows the tab and the trip, so either can be shared, reloaded or gone back to:
  // /planner/chat?trip=…, and plain /planner for a new, empty trip on Explore. Switching tab or
  // trip adds a history entry; a trip getting its first entry only updates the address.
  const shown = useRef({ mode: "", id: "" });
  const popping = useRef(false);
  const activeHasAny = journals.some((j) => j.id === activeId && hasAny(j));
  useEffect(() => {
    if (!activeId) return;
    const url = mode === "explore" && !activeHasAny ? "/planner" : `/planner/${mode}${activeHasAny ? `?trip=${activeId}` : ""}`;
    const moved = shown.current.mode !== mode || shown.current.id !== activeId;
    const first = !shown.current.id;
    shown.current = { mode, id: activeId };
    if (url === location.pathname + location.search) return;
    if (moved && !first && !popping.current) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    popping.current = false;
  }, [mode, activeId, activeHasAny]);
  useEffect(() => {
    const onPop = () => {
      const at = fromUrl();
      popping.current = true;
      setMode(at.mode);
      setJournals((list) => {
        const target = at.trip && list.find((j) => j.id === at.trip);
        // Back to plain /planner: the blank trip, if there is one.
        setActiveId(target ? target.id : (list.find((j) => !hasAny(j))?.id ?? list[0]?.id ?? ""));
        return list;
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(journals.filter(hasAny)));
    } catch {}
  }, [journals]);

  const active = journals.find((j) => j.id === activeId);
  const turns = [...(active?.turns ?? []), ...(pending ? [pending] : [])];

  const pages = () => [...(strip.current?.querySelectorAll<HTMLElement>(".hj-page") ?? [])];
  // Pages are panels in a padded strip, so a page is "at" the left margin when its left edge
  // meets the strip's left padding.
  const margin = () => parseFloat(getComputedStyle(strip.current!).paddingLeft) || 0;
  const goTo = useCallback((index: number, smooth = true) => {
    const list = pages();
    const page = list[Math.max(0, Math.min(index, list.length - 1))];
    strip.current?.scrollTo({ left: (page?.offsetLeft ?? 0) - margin(), behavior: smooth ? "smooth" : "auto" });
  }, []);
  const current = () => {
    const left = (strip.current?.scrollLeft ?? 0) + margin();
    let best = 0;
    pages().forEach((p, i) => {
      if (Math.abs(p.offsetLeft - left) < Math.abs(pages()[best].offsetLeft - left)) best = i;
    });
    return best;
  };

  // The one place the strip moves itself. On send it glides your message to the grid's left
  // edge; when the first spread of the reply lands, it glides that spread to the same edge, and
  // stops. Later spreads arrive off to the right without moving the view; scrolling yourself, or
  // the newest-page arrow, ends it at once. Pages are counted without the closing page and the
  // "writing the next page" placeholder, so the target is always the real first spread.
  const entryPages = () => pages().filter((p) => !p.classList.contains("pl-home") && !p.classList.contains("hj-building"));
  useEffect(() => {
    const follow = following.current;
    const el = strip.current;
    if (!follow.on || !el) return;
    const target = entryPages()[follow.said + follow.step];
    if (!target) return;
    el.scrollTo({ left: target.offsetLeft - margin(), behavior: "smooth" });
    if (follow.step === 1) follow.on = false;
    follow.step += 1;
  });
  useEffect(() => {
    if (!pending) following.current.on = false;
  }, [pending]);

  // Each new spread is held back until its photos have loaded (at most 2.5s), then shown whole
  // with one soft rise.
  useEffect(() => {
    for (const spread of strip.current?.querySelectorAll<HTMLElement>(".hj-spread:not([data-seen])") ?? []) {
      spread.dataset.seen = "1";
      if (!pending) continue;
      spread.classList.add("is-holding");
      const started = performance.now();
      const check = () => {
        const frames = [...spread.querySelectorAll(".hj-img")];
        // A spread without photos (Dates, a Question) has nothing to wait for.
        const loaded = frames.every((f) => {
          const img = f.querySelector("img");
          return img && img.complete && img.naturalWidth > 0;
        });
        if (loaded || performance.now() - started > 2500) {
          spread.classList.remove("is-holding");
          spread.classList.add("is-arriving");
        } else window.setTimeout(check, 120);
      };
      check();
    }
  });

  // Scrolling is free: a vertical wheel scrolls the strip sideways as far as it turns, so a
  // mouse reads the planner like a trackpad. The arrow keys still step panel by panel.
  useEffect(() => {
    const el = stripEl;
    if (!el) return;
    const remember = () => (readingAt.current = el.scrollLeft);
    el.addEventListener("scroll", remember, { passive: true });
    // Scrolling by hand while an entry streams stops the strip following it.
    const stopFollowing = () => (following.current.on = false);
    el.addEventListener("pointerdown", stopFollowing);
    el.addEventListener("touchmove", stopFollowing, { passive: true });
    const onWheel = (e: WheelEvent) => {
      stopFollowing();
      if (sheetOpen.current || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    const onKey = (e: KeyboardEvent) => {
      // An empty input (the "Where next?" box takes focus) shouldn't hold the arrow keys.
      const typing = e.target instanceof HTMLTextAreaElement && e.target.value !== "";
      if (typing || sheetOpen.current) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") stopFollowing();
      if (e.key === "ArrowRight") goTo(current() + 1);
      if (e.key === "ArrowLeft") goTo(current() - 1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("scroll", remember);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", stopFollowing);
      el.removeEventListener("touchmove", stopFollowing);
      window.removeEventListener("keydown", onKey);
    };
  }, [goTo, stripEl]);

  // The history panel closes on a click anywhere outside it (or the pill that opens it), and on Escape.
  useEffect(() => {
    if (!historyOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest(".hj-history, .hj-pill")) setHistoryOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHistoryOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [historyOpen]);


  // The trip's place: the latest cover (Bleed) title, else the place a chat reply named. Only a
  // real destination: never the journal's name, which is "New journal" or the first message.
  const chat = active?.chat ?? [];
  const tripPlace =
    [...turns].reverse().map((t) => t.code.match(/Bleed\(\s*"([^"]+)"/)?.[1]).find(Boolean) ??
    [...chat].reverse().map((t) => placeOf(readReply(t.code).program)).find(Boolean);
  // What the traveller said across the trip, in Explore and in Chat.
  const said = [...turns.map((t) => t.prompt), ...chat.map((t) => t.prompt)];

  // When the agent leaves out its follow-ups (it sometimes ends on Dates and stops), the closing
  // page still offers the usual next steps for this trip.
  const withFallback = (found: ReturnType<typeof followUps>, program: string) => {
    if (found.length || !program || /=\s*(Question|Picks)\(/.test(program)) return found;
    const where = tripPlace ?? "there";
    return [
      { label: `Find a place to stay in ${where}`, kind: "stay" },
      { label: `What should I eat in ${where}?`, kind: "food" },
      { label: "Plan it day by day", kind: "schedule" },
      tripDates ? { label: "Make it cheaper", kind: "budget" } : { label: "Pick my dates", kind: "dates" },
    ];
  };

  // The trip's dates, once known, shared by both tabs: the last ones picked in either (kept on the
  // trip), else the last booking or Dates answer in Explore, then in Chat.
  const tripDates =
    active?.dates ??
    [...turns].reverse().map(datesIn).find(Boolean) ??
    [...chat].reverse().map(datesIn).find(Boolean);

  // The closing page reads the latest entry: its follow-ups, and its trivago stays if it booked any.
  const last = readReply(turns[turns.length - 1]?.code ?? "");
  const booking = bookingOf(last.program);
  const closing = {
    suggestions: withFallback(followUps(last.program), last.program),
    stays: booking ? { ...booking, hotels: booking.ids.map((id) => last.hotels[id]).filter((h) => h?.name && h.url) } : null,
  };

  const update = (id: string, change: (j: Journal) => Journal) =>
    setJournals((list) => list.map((j) => (j.id === id ? change(j) : j)));

  // The chat counts as picked up once that entry is saved (see send).
  const resuming = useRef<{ id: string; upTo: number } | null>(null);
  async function send(prompt: string) {
    if (!active || pending) return;
    const id = active.id;
    const history = active.turns;
    // Follow the new entry in: the message's page replaces the closing page, then spreads arrive.
    following.current = { on: true, said: entryPages().length, step: 0 };
    let code = "";
    setPending({ prompt, code });
    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, history, traveller: travellerLine(readTraveller()) }),
      });
      if (!response.ok || !response.body) throw new Error(await failure(response));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        code += decoder.decode(value, { stream: true });
        setPending({ prompt, code });
      }
      // A stream that closes with nothing in it is a failed reply, not an empty entry.
      if (!/^\s*root\s*=/m.test(code)) throw new Error("");
      update(id, (j) => {
        const next = [...j.turns, { prompt, code }];
        const resumed = resuming.current?.id === id ? resuming.current.upTo : j.resumed;
        return { ...j, turns: next, title: titleOf(next), updated: Date.now(), resumed, dates: datesIn({ prompt, code }) ?? j.dates };
      });
    } catch (error) {
      // A friendly page and the same question as a follow-up, so one tap tries again.
      const why = error instanceof Error && error.message ? ` ${error.message}` : "";
      const sorry = `That reply didn't come through.${why} Nothing was lost, so try again.`;
      update(id, (j) => ({
        ...j,
        turns: [
          ...j.turns,
          { prompt, code: `root = Journal([n, x])\nn = Sentence(${JSON.stringify(sorry)})\nx = Next("Try again?", [Option(${JSON.stringify(prompt)})])` },
        ],
      }));
    } finally {
      setPending(null);
    }
  }

  // Decisions made in Chat carry over: opening Explore after new chat messages writes the next
  // journal entry from them, so Explore picks up where the chat left off.
  useEffect(() => {
    if (mode !== "explore" || !active || pending || resuming.current) return;
    const said = active.chat ?? [];
    const from = active.resumed ?? 0;
    if (said.length <= from) return;
    const where = tripPlace ? ` about ${tripPlace}` : "";
    const asks = said.slice(from).map((t) => t.prompt.trim()).join("; ");
    resuming.current = { id: active.id, upTo: said.length };
    void send(`Carry on from our chat${where}: ${asks}`.slice(0, 320)).finally(() => (resuming.current = null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeId]);

  function newJournal() {
    setHistoryOpen(false);
    if (active && !hasAny(active)) return goTo(0);
    const j = fresh();
    setJournals((list) => [j, ...list]);
    setActiveId(j.id);
    requestAnimationFrame(() => goTo(0, false));
  }

  return (
    <ItineraryProvider trip={activeId}>
      {/* The mascot is always in its corner; the tabs appear once a trip has started. */}
      <Mascot className="pl-mascot--corner" />
      <PlannerChatTabs mode={mode} onChange={setMode} />
      <TripBridge.Provider
        value={{ programs: turns.map((t) => readReply(t.code).program), prompts: said, dates: tripDates, place: tripPlace, openBoard: () => setMode("itinerary") }}
      >
      <SheetOpener.Provider value={setSheet}>
      {mode === "itinerary" ? <ItineraryBoard dates={tripDates} context={said.join(" / ")} place={tripPlace} active /> : null}
      {mode === "chat" && active ? (
        <ChatView
          key={active.id}
          turns={chat}
          onTurn={(turn) =>
            update(active.id, (j) => ({
              ...j,
              chat: [...(j.chat ?? []), turn],
              title: j.turns.length ? j.title : (placeOf(readReply(turn.code).program) ?? (j.chat?.[0] ?? turn).prompt.slice(0, 40)),
              updated: Date.now(),
              dates: datesIn(turn) ?? j.dates,
            }))
          }
        />
      ) : null}
      <div className={`hj-strip${pending ? " is-writing" : ""}`} ref={stripRef} style={mode !== "explore" ? { display: "none" } : undefined}>
        {turns.map((turn, i) => {
          const reply = readReply(turn.code, turn === pending);
          // While it streams, only whole spreads are shown, in order (see slides.ts).
          const slides = wholeSlides(reply.program, turn === pending);
          return (
            <div className="hj-entry" key={`${activeId}:${i}`}>
              <Said text={turn.prompt} writing={turn === pending} />
              <HotelsContext.Provider value={reply.hotels}>
                {/* Only the newest finished entry's steps can be tapped; older ones show what was chosen. */}
                <Reply.Provider value={{ send: !pending && i === turns.length - 1 ? send : undefined, answer: turns[i + 1]?.prompt }}>
                  <Renderer response={slides.program} library={journalLibrary} isStreaming={turn === pending} />
                </Reply.Provider>
              </HotelsContext.Provider>
              {/* The next spread being written: one quiet placeholder rather than half a slide. */}
              {turn === pending && slides.whole > 0 && slides.whole < Math.max(slides.total, slides.whole + 1) ? (
                <section className="hj-page hj-building" aria-label="Writing the next page" />
              ) : null}
            </div>
          );
        })}
        {pending ? null : turns.length ? (
          <PlannerNext key={`${activeId}:${turns.length}`} onSend={send} suggestions={closing.suggestions} stays={closing.stays} />
        ) : (
          <PlannerHome key={activeId} onSend={send} />
        )}
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
      </TripBridge.Provider>

      {mode === "explore" && turns.length ? (
        <LatestArrow strip={stripEl} arriving={!!pending} onGo={() => (following.current.on = false)} />
      ) : null}
      <GridOverlay on={grid} />
      <nav className="hj-pill" aria-label="Journal">
        {/* The trip's place, as its 3D icon, once there is one. */}
        {tripPlace ? (
          <span className="pl-pill-place" title={tripPlace} aria-label={`Trip: ${tripPlace}`} role="img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/icons-3d/${iconFor(tripPlace)}-pixar.webp`} alt="" draggable={false} />
          </span>
        ) : null}
        <button type="button" onClick={newJournal} title={mode === "chat" ? "New chat" : "New journal"} aria-label={mode === "chat" ? "New chat" : "New journal"}>
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
          <h2>{mode === "chat" ? "Chats" : "Journals"}</h2>
          <ul>
            {journals
              .filter(hasAny)
              .map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className={j.id === activeId ? "is-active" : undefined}
                    disabled={!!pending}
                    onClick={() => {
                      setActiveId(j.id);
                      setHistoryOpen(false);
                      // A trip that's only a chat opens on its chat.
                      if (!j.turns.length && j.chat?.length) setMode("chat");
                      requestAnimationFrame(() => goTo(0, false));
                    }}
                  >
                    <HistoryCover journal={j} />
                    <span className="pl-history__words">
                      <span className="hj-history__name">{j.title}</span>
                      {/* In Chat, how each trip's chat began (or that it's a journal), so it's easy to find again. */}
                      {mode === "chat" ? (
                        <span className="pl-history__meta">
                          {j.chat?.[0]?.prompt ?? "Journal"}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          {journals.every((j) => !hasAny(j)) ? <p>{mode === "chat" ? "Your chats will appear here." : "Your journals will appear here."}</p> : null}
        </aside>
      ) : null}
    </ItineraryProvider>
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
  // A trip with no cover photo (one that's only a chat) shows its place's 3D icon instead.
  return (
    <span className={`hj-history__cover${subject ? "" : " pl-history__icon"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : subject ? null : <img src={`/icons-3d/${iconFor(journal.title)}-pixar.webp`} alt="" />}
    </span>
  );
}

/** Your message, kept on the page where you wrote it, in the same place and type as the prompt. */
/** Your message on its own page. While the reply is on its way, it's written out letter by
 *  letter in pen, then a pencil line keeps moving under it until the first spread lands. */
/** Why a request failed, in words: the route's JSON error when it sent one, never a raw parse
 *  error (a crash or a restart mid-request answers with an empty or HTML body). */
export async function failure(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const error = (JSON.parse(text) as { error?: string }).error;
    if (error) return error;
  } catch {}
  return response.status >= 500 ? "The planner hit a snag on our side." : "";
}

function Said({ text, writing }: { text: string; writing: boolean }) {
  const [animate] = useState(writing);
  return (
    <section className="hj-page hj-ask hj-said">
      {writing ? <Breeze prompt={text} /> : null}
      <div className="hj-ask__form">
        <p className={`hj-ask__text${writing ? " is-writing" : ""}`} aria-label={text}>
          {animate
            ? [...text].map((ch, i) => (
                <span key={i} className="hj-said__letter" style={{ ["--i" as string]: i }} aria-hidden>
                  {ch}
                </span>
              ))
            : text}
        </p>
      </div>
    </section>
  );
}
