"use client";

import { Renderer } from "@openuidev/react-lang";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type FollowUp, FollowUpCards, PromptForm, WeatherLine } from "../home";
import { useItinerary } from "../itinerary";
import { TripBridge } from "../itinerary-spread";
import { HotelsContext, readReply } from "../library";
import { readTraveller, travellerLine } from "../money";
import { chatLibrary, ChatTurn } from "./chat-library";
import { wholeBlocks } from "./chat-stream";
import "./chat.css";

// The Chat tab: the trip as a conversation with a travel agent, in one centred column on the
// white page. Your messages are written in pencil, letter by letter, like the journal's; while
// the agent works a pencil line keeps drawing under them, and the reply then writes in block by
// block as it streams (chat-stream.ts). Replies are OpenUI programs in the chat library (chat-library.tsx). The chat
// belongs to the trip, so it shares Explore's journal and the Itinerary board.

export type ChatTurnData = { prompt: string; code: string };

/** Why a request failed, in words: the route's JSON error when it sent one. */
async function failure(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const error = (JSON.parse(text) as { error?: string }).error;
    if (error) return error;
  } catch {}
  return response.status >= 500 ? "The planner hit a snag on our side." : "";
}

const sorry = (prompt: string, why: string) =>
  `root = Chat([p, f])\np = Pull(${JSON.stringify(`That reply didn't come through.${why} Nothing was lost, so try again.`)})\nf = FollowUps([Option(${JSON.stringify(prompt)}, null, "schedule")])`;

export function ChatView({ turns, onTurn }: { turns: ChatTurnData[]; onTurn: (turn: ChatTurnData) => void }) {
  const bridge = useContext(TripBridge);
  const itinerary = useItinerary();
  const [pending, setPending] = useState<ChatTurnData | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Whether the reader is at the foot of the conversation: only then does a streaming reply
  // carry the view down with it.
  const atFoot = useRef(true);
  const all = [...turns, ...(pending ? [pending] : [])];

  // Open on the latest exchange, with its message at the top of the column.
  const opened = useRef(false);
  useLayoutEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const last = scroller.current?.querySelector<HTMLElement>(".pl-chat-turn:last-child");
    if (last && scroller.current) scroller.current.scrollTop = last.offsetTop - 88;
  }, []);

  // A sent message glides to the top of the column; the reply then fills the room below it, so
  // nothing on screen moves when it lands.
  const glide = useRef(false);
  useEffect(() => {
    if (!glide.current || !pending) return;
    glide.current = false;
    const last = scroller.current?.querySelector<HTMLElement>(".pl-chat-turn:last-child");
    if (last) scroller.current?.scrollTo({ top: last.offsetTop - 88, behavior: "smooth" });
  }, [pending]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => (atFoot.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && pending?.code && atFoot.current && !glide.current) el.scrollTop = el.scrollHeight;
  }, [pending?.code]);

  async function send(prompt: string) {
    if (pending) return;
    glide.current = true;
    let code = "";
    setPending({ prompt, code });
    try {
      const response = await fetch("/api/planner/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: turns,
          traveller: travellerLine(readTraveller()),
          trip: {
            place: bridge?.place,
            dates: bridge?.dates,
            // Explore's questions: the trip's prompts without this chat's own.
            explored: (bridge?.prompts ?? []).filter((p) => !turns.some((t) => t.prompt === p)),
            itinerary: (itinerary?.items ?? []).map(({ name, day, time, kind, note }) => ({ name, day, time, kind, note })),
          },
        }),
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
      if (!/^\s*root\s*=/m.test(code)) throw new Error("");
      onTurn({ prompt, code });
    } catch (error) {
      const why = error instanceof Error && error.message ? ` ${error.message}` : "";
      onTurn({ prompt, code: sorry(prompt, why) });
    } finally {
      setPending(null);
    }
  }

  const programs = turns.map((t) => readReply(t.code).program);
  return (
    <>
      <div className="pl-chat" ref={scroller}>
        <div className="pl-chat__column">
          {all.length ? null : <ChatWelcome place={bridge?.place} onSend={send} />}
          {all.map((turn, i) => {
            const writing = turn === pending;
            return (
              <article className="pl-chat-turn" key={i}>
                <ChatSaid text={turn.prompt} writing={writing} />
                {/* One ChatAnswer from first chunk to last, so its Renderer sees the stream settle. */}
                <ChatAnswer
                  code={turn.code}
                  turn={String(i)}
                  streaming={writing}
                  send={!pending && i === turns.length - 1 ? send : undefined}
                  answer={all[i + 1]?.prompt}
                  programs={programs.slice(0, i)}
                />
              </article>
            );
          })}
        </div>
      </div>
      <div className="pl-board__dock pl-chat__dock">
        <div className="pl-board__bar">
          <PromptForm
            key={String(!!pending)}
            onSend={pending ? undefined : (p) => void send(p)}
            placeholder={bridge?.place ? `Ask anything about ${bridge.place}…` : "Ask your travel agent anything…"}
            label="Message your travel agent"
          />
        </div>
      </div>
    </>
  );
}

/** Your message, in pencil. While the reply is on its way it's written out letter by letter. */
export function ChatSaid({ text, writing }: { text: string; writing?: boolean }) {
  const [animate] = useState(!!writing);
  return (
    <p className="pl-chat-said" aria-label={text}>
      {animate
        ? [...text].map((ch, i) => (
            <span key={i} className="hj-said__letter" style={{ ["--i" as string]: i }} aria-hidden>
              {ch}
            </span>
          ))
        : text}
    </p>
  );
}

/** While the agent works: a pencil line that keeps drawing itself, and a quiet word. */
export function ChatThinking() {
  return (
    <div className="pl-chat-thinking" role="status" aria-live="polite">
      <svg viewBox="0 0 240 24" aria-hidden>
        <path d="M4 14 C 30 4, 52 22, 80 12 S 132 4, 160 14 S 210 20, 236 10" pathLength={1} />
      </svg>
      <span className="hj-pen__text">writing back…</span>
    </div>
  );
}

/** One reply. While it streams it writes in block by block (chat-stream.ts); once whole, a fresh
 *  one waits (at most 2.5s) for its photos, then rises in. */
export function ChatAnswer({
  code,
  turn,
  fresh,
  streaming = false,
  send,
  answer,
  programs,
}: {
  code: string;
  turn: string;
  fresh?: boolean;
  /** The reply is still arriving: show its whole blocks so far. */
  streaming?: boolean;
  send?: (text: string) => void;
  /** The message that followed this reply. */
  answer?: string;
  programs?: string[];
}) {
  const reply = readReply(code, streaming);
  const program = streaming ? wholeBlocks(reply.program).program : reply.program;
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(!fresh);
  useEffect(() => {
    if (shown) return;
    const started = performance.now();
    let timer = 0;
    const check = () => {
      const frames = [...(box.current?.querySelectorAll(".pl-chat-photo:not(.pl-chat-hotel__photo), .pl-chat-inline") ?? [])];
      const loaded = frames.every((f) => {
        const img = f.querySelector("img");
        return img && img.complete && img.naturalWidth > 0;
      });
      if (loaded || performance.now() - started > 2500) setShown(true);
      else timer = window.setTimeout(check, 120);
    };
    timer = window.setTimeout(check, 120);
    return () => window.clearTimeout(timer);
  }, [shown]);
  return (
    <div className={`pl-chat-reply${streaming ? " is-streaming" : shown ? (fresh ? " is-arriving" : "") : " is-holding"}`} ref={box}>
      {/* The pencil line until the first block is in, or while a fresh reply waits for photos. */}
      {(streaming ? program : shown) ? null : <ChatThinking />}
      {program || !streaming ? (
        <div className="pl-chat-reply__body">
          <HotelsContext.Provider value={reply.hotels}>
            <ChatTurn.Provider value={{ send, turn, programs, answer }}>
              <Renderer response={program} library={chatLibrary} isStreaming={streaming} />
            </ChatTurn.Provider>
          </HotelsContext.Provider>
        </div>
      ) : null}
    </div>
  );
}

/** A new chat: the weather where you are, the question, and a few ways in. */
export function ChatWelcome({ place, onSend }: { place?: string; onSend?: (text: string) => void }) {
  const starters: FollowUp[] = place
    ? [
        { label: "Show me my itinerary", kind: "schedule" },
        { label: `Where should we stay in ${place}?`, kind: "stay" },
        { label: `What should I eat in ${place}?`, kind: "food" },
        { label: "Plan a slow first day", kind: "museum" },
      ]
    : [
        { label: "Four days in Kyoto", icon: "kyoto", kind: "place" },
        { label: "A long weekend in Lisbon", icon: "lisbon", kind: "place" },
        { label: "Somewhere warm in December", icon: "beach", kind: "landscape" },
        { label: "A cheap week in Europe", kind: "budget" },
      ];
  return (
    <section className="pl-chat-welcome">
      <WeatherLine />
      <h1 className="pl-chat-headline">{place ? `Ask me anything about ${place}.` : "Where shall we go?"}</h1>
      <p className="pl-chat-text">I can find places, stays and the best hour for each, and change your itinerary as we talk.</p>
      <div className="pl-chat-followups">
        <FollowUpCards items={starters} onPick={onSend} />
      </div>
    </section>
  );
}
