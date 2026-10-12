"use client";

import { useThreadList } from "@openuidev/react-headless";
import { useEffect, useMemo, useState } from "react";
import { ChatStarters, ChatWelcome, type ChatStarter } from "../../components/chat";
import { messageText } from "./messages";

/*
 * RadioWelcome: the empty state for a new chat. The welcome and the starting grid,
 * set above the Radio bar. Both settle in once on load; nothing moves after that.
 * Picking a starter radios it in, and the thread takes over from the first send.
 */

// Shown with no history, while suggestions load, and if they fail.
const DEFAULT_QUESTIONS = [
  "Who won the last race?",
  "How does the drivers' championship look?",
  "Compare Norris and Piastri's lap times in Baku",
];
const CACHE_KEY = "f1-radio:starters";

// Asked as written, so the question reads the same in the thread as on the grid.
const toStarters = (questions: string[]): ChatStarter[] => questions.map((q) => ({ displayText: q, prompt: q }));

// Three questions the model suggests from the reader's recent ones, cached for the session
// against those questions so a new chat only asks again once there's something new.
function useSuggestedQuestions() {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  // Each thread's title is its first question, so the newest threads give the latest ones.
  const threads = useThreadList((s) => s.threads);
  const recent = useMemo(
    () => [...new Set(threads.map((t) => messageText(t.title).trim().slice(0, 600)).filter(Boolean))].slice(0, 8),
    [threads],
  );
  const key = recent.join("\n");
  useEffect(() => {
    if (!recent.length) return;
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
      if (cached?.key === key) return setQuestions(cached.questions);
    } catch {}
    const controller = new AbortController();
    fetch("/api/starters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recent }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { questions?: string[] } | null) => {
        if (!data?.questions?.length) return;
        setQuestions(data.questions);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, questions: data.questions }));
        } catch {}
      })
      .catch(() => {});
    return () => controller.abort();
    // recent changes only when key does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return questions;
}

export function RadioWelcome({ onPick }: { onPick: (prompt: string) => void }) {
  const questions = useSuggestedQuestions();
  return (
    <div className="radio-welcome" style={{ display: "grid", gap: 40 }}>
      <style>{`
        .radio-welcome > * { animation: radio-welcome-in 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .radio-welcome > :nth-child(3) { animation-delay: 90ms; }
        @keyframes radio-welcome-in { from { opacity: 0; transform: translateY(8px); } }
        /* The grid lines up with the welcome: P numbers flush with its left edge, the hover slash
           hanging in the margin, questions close to their numbers, rows close together. */
        .radio-welcome .f1c-starters { gap: 0; margin-left: -20px; }
        .radio-welcome .f1c-starters .f1c-row { gap: 8px; padding-top: 6px; padding-bottom: 6px; }
        .radio-welcome .f1c-starters .f1c-grid-slot { width: 1.6em; }
        .radio-welcome .f1c-starters .f1c-row::before { top: 8px; bottom: 8px; }
        /* A suggestion arriving after load fades in where the default stood. */
        .radio-welcome .f1c-row { animation: radio-welcome-swap 240ms ease both; }
        @keyframes radio-welcome-swap { from { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .radio-welcome > *, .radio-welcome .f1c-row { animation: none; } }
      `}</style>
      <ChatWelcome description="Ask about any race, driver or team this season, live from OpenF1. Follow up to explore a different angle." />
      <ChatStarters starters={toStarters(questions)} onPick={onPick} />
    </div>
  );
}
