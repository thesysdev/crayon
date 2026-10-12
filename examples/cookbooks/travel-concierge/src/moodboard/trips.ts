import { useSyncExternalStore } from "react";

// Trips: each one is its own tldraw board (kept in IndexedDB under its persistence key) plus its
// own planner conversation (in localStorage). This file keeps the list of trips and which one is
// open, for this browser.

export type Trip = {
  id: string;
  name: string;
  // A photo from the board, shown until the place's own photo is known.
  cover?: string;
  // The place the trip is about, where that is, and the place's photo, once the board says.
  place?: string;
  location?: string;
  photo?: string;
  pieces: number;
  updated: number;
};

type State = { active: string; trips: Trip[] };

export const UNTITLED = "New trip";

// The board made before trips existed keeps its old storage, so it opens as the first trip.
export const FIRST = "first";
export const boardKey = (id: string) =>
  id === FIRST ? "openui-moodboard" : `openui-moodboard:${id}`;
const conversationKey = (id: string) =>
  id === FIRST ? "openui-moodboard-agent-v2" : `openui-moodboard-agent-v2:${id}`;

const KEY = "openui-moodboard-trips";
const listeners = new Set<() => void>();
let state: State | undefined;

function read(): State {
  if (state) return state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as State | null;
    if (saved?.trips?.length) return (state = saved);
  } catch {}
  return (state = {
    active: FIRST,
    trips: [{ id: FIRST, name: UNTITLED, pieces: 0, updated: Date.now() }],
  });
}

function write(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage is full or blocked; the list lasts until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

// Another tab added or renamed a trip.
if (typeof window !== "undefined")
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    state = undefined;
    listeners.forEach((listener) => listener());
  });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useTrips = () => useSyncExternalStore(subscribe, read, read);

export const trips = {
  select(id: string) {
    const current = read();
    if (current.active !== id && current.trips.some((trip) => trip.id === id))
      write({ ...current, active: id });
  },
  // Opens an empty canvas. An untouched trip is reused, so New trip never piles up blanks.
  create() {
    const current = read();
    const blank = current.trips.find((trip) => !trip.pieces && trip.name === UNTITLED);
    if (blank) return trips.select(blank.id);
    const trip: Trip = { id: `t${Date.now()}`, name: UNTITLED, pieces: 0, updated: Date.now() };
    write({ active: trip.id, trips: [trip, ...current.trips] });
  },
  // Names an untitled trip after the traveller's first request.
  name(id: string, prompt: string) {
    const trip = read().trips.find((item) => item.id === id);
    if (trip?.name === UNTITLED && prompt.trim())
      trips.update(id, { name: nameFromPrompt(prompt) });
  },
  update(id: string, patch: Partial<Omit<Trip, "id">>) {
    const current = read();
    const trip = current.trips.find((item) => item.id === id);
    if (!trip) return;
    const changed = (Object.keys(patch) as (keyof typeof patch)[]).some(
      (key) => patch[key] !== trip[key],
    );
    if (!changed) return;
    write({
      ...current,
      trips: current.trips.map((item) =>
        item.id === id ? { ...item, ...patch, updated: Date.now() } : item,
      ),
    });
  },
};

// A short name from the traveller's first request: "A slow week in Kyoto in autumn, temples…"
// becomes "Slow week in Kyoto in autumn".
export function nameFromPrompt(prompt: string) {
  const clause = prompt
    .trim()
    .split(/[,.;!?\n]/)[0]
    .replace(/^(an?|the|plan|plan me|i want)\s+/i, "")
    .trim();
  const name = clause.length > 40 ? `${clause.slice(0, 38).replace(/\s+\S*$/, "")}…` : clause;
  return name ? name[0].toUpperCase() + name.slice(1) : UNTITLED;
}

// What the traveller said in a conversation: requests and answers to the planner's questions.
export function saidIn(messages: unknown[]) {
  return (messages as { role?: string; content?: unknown }[]).flatMap((message) => {
    if (typeof message?.content !== "string") return [];
    if (message.role === "user")
      return [(/Request:\s*([^\n]+)/.exec(message.content)?.[1] ?? message.content).trim()];
    return message.role === "tool" && !message.content.includes('"skipped"')
      ? [message.content]
      : [];
  });
}

// Asks the trip route what place a board is about, once per board size, and keeps the answer.
const asked = new Set<string>();
export function locate(id: string, said: string[], pieces: string[]) {
  const trip = read().trips.find((item) => item.id === id);
  const key = `${id}:${pieces.length}`;
  if (!trip || trip.place || !pieces.length || asked.has(key)) return;
  asked.add(key);
  fetch("/api/moodboard/trip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ said, pieces }),
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((found: { place?: string; location?: string; photo?: string } | null) => {
      if (found?.place)
        trips.update(id, {
          place: found.place,
          location: found.location ?? undefined,
          photo: found.photo ?? undefined,
        });
    })
    .catch(() => {});
}

// The first request in a saved conversation, which the route sends as "…Request: <prompt>".
export function firstRequest(messages: unknown[]) {
  for (const message of messages as { role?: string; content?: unknown }[]) {
    if (message?.role !== "user" || typeof message.content !== "string") continue;
    const match = /Request:\s*(.+)/.exec(message.content);
    if (match) return match[1].trim();
  }
}

// The planner conversation for one trip, with the same shape as client.ts's conversation.
export function tripConversation(id: string) {
  const key = conversationKey(id);
  return {
    load(): unknown[] {
      try {
        return JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {
        return [];
      }
    },
    save(messages: unknown[]) {
      try {
        localStorage.setItem(key, JSON.stringify(messages));
      } catch {
        // Storage is full or blocked; the conversation lasts until the page reloads.
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
  };
}
