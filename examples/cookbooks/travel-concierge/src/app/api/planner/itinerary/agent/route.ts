import OpenAI from "openai";
import { doodleNames, doodlePlaces } from "../../../../planner/doodle-names";
import { type ItineraryItem, list, tripKey } from "../store";

// The itinerary board's agent. It reads the trip's saved items and one request ("group these by
// day", "remove the museums", "add a note to the castle") and answers with the whole plan as
// JSON: every item kept, in order, with its day, time and note; items to remove; places to add.
// The route applies that to the store and returns the new items, so the board just redraws.

export const runtime = "nodejs";

type Plan = {
  items?: { id: string; day?: string | null; time?: string | null; note?: string | null; recommended?: boolean | null; stickers?: { doodle: string; at?: string }[] | null }[];
  remove?: string[];
  add?: { name: string; subject?: string; place?: string; day?: string; time?: string; note?: string; kind?: ItineraryItem["kind"] }[];
  message?: string;
};

const system = (dates: string, days?: number) => `You arrange a traveller's saved places into a clear trip plan on a board.
You get the saved items as JSON and one request. Reply with JSON only, no prose and no code fences:
{"items":[{"id":"…","day":"…","time":"…","note":"…","recommended":false,"stickers":[{"doodle":"star","at":"corner"}]}],"remove":["id"],"add":[{"name":"…","subject":"…","place":"…","day":"…","time":"…","note":"…","kind":"place"}],"message":"…"}
Rules:
- "items" lists every item you keep, in the order they should be visited. Keep each id exactly.
- A day is a short heading like "Day 1 · Fri 6 Nov" (or "Day 1" when there are no dates). Group nearby places on the same day, two to four places a day, stays on the first day. ${dates ? `The trip runs ${dates}; use those dates in the day headings.` : "There are no dates yet."}${days ? ` The trip is ${days} day${days === 1 ? "" : "s"}: use exactly Day 1 to Day ${days}, never more. Places that don't fit (more than four a day) get no day, so they wait in Favourites.` : ""}
- Stays (kind "stay") are not on a day: the board keeps them in their own "Planned hotels" column, cheapest first. Give stays no day and no time. Recommend one or two of them with "recommended": true and a note saying why in a few words (best value, closest to the centre, fits the dates); other stays get no note and "recommended": false.
- stickers are hand-drawn doodles on a card: ${doodleNames.join(", ")}. Each sits at one of ${doodlePlaces.join(", ")}. Use them sparingly, where they mean something, at most one per card and a handful on the board: a heart on a favourite, a star on a must-do or a recommended hotel, a check on something booked, an exclamation on something to book ahead, a sun on an outdoor day, a plane on a travel day. Keep existing stickers unless asked; [] removes them. Never draw outlines or rings.
- time is optional: "Morning", "Afternoon", "Evening" or "Night".
- note is a short handwritten aside, 2 to 7 words, lower case, written on the board beside the card. Give one only when it adds something real: a tip, a reason to go, a timing hint ("go before 9, it fills up"). Most items get none. Never write filler that repeats the card ("arrival hotel option", "nice view"); set such notes to null. Keep good existing notes unless asked to change them.
- Only remove items the request asks to remove. Only add places the request asks for; "subject" is the place's exact English Wikipedia title, so its photo can be found.
- "message" is one short friendly line saying what you changed.
- If the request is only "make a plan" or similar, group everything by day with sensible times.`;

export async function POST(request: Request) {
  const trip = tripKey(new URL(request.url).searchParams.get("trip"));
  const { prompt, dates, context, traveller, seed, days: asked, items: board } = (await request.json()) as {
    prompt?: string;
    dates?: string;
    context?: string;
    traveller?: string;
    /** Places from the Explore journal to put on the board before planning (from its Itinerary spread). */
    seed?: Partial<ItineraryItem>[];
    /** The trip's length in days, from the conversation or the chosen dates. */
    days?: number;
    /** The board as the browser has it (boards live there); older callers fall back to the store. */
    items?: ItineraryItem[];
  };
  if (!trip || !prompt?.trim()) return Response.json({ error: "Send a trip and a request." }, { status: 400 });
  const days = Number.isFinite(asked) && asked! > 0 ? Math.min(30, Math.round(asked!)) : undefined;
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) return Response.json({ error: "Set THESYS_API_KEY in .env.local." }, { status: 500 });

  // Explore's places join the saved ones (a place already saved stays as it is), with their photos.
  const origin = new URL(request.url).origin;
  const photoOf = async (subject?: string) => {
    if (!subject) return undefined;
    try {
      const r = await fetch(`${origin}/api/moodboard/images?kind=named&q=${encodeURIComponent(subject)}`, { signal: request.signal });
      return r.ok ? ((await r.json()) as { url?: string } | null)?.url : undefined;
    } catch {
      return undefined;
    }
  };
  // The board comes with the request, so nothing is written on the server: the answer is the new
  // board, which the browser saves.
  let items: ItineraryItem[] = Array.isArray(board) ? board.filter((i) => i?.id && i.name) : await list(trip).catch(() => []);
  if (Array.isArray(seed) && seed.length) {
    const known = (s: Partial<ItineraryItem>) =>
      items.some((i) => (!!s.subject && i.subject === s.subject) || i.name.toLowerCase() === s.name?.toLowerCase());
    const fresh = seed.filter((s) => s?.name && !known(s)).slice(0, 16);
    const withPhotos = await Promise.all(fresh.map(async (s) => ({ ...s, photo: s.photo ?? (await photoOf(s.subject ?? s.name)) })));
    items = [
      ...items,
      ...withPhotos.map((s) => ({ ...s, name: s.name!, kind: s.kind ?? "place", id: crypto.randomUUID(), addedAt: Date.now() }) as ItineraryItem),
    ];
  }
  const brief = items.map(({ id, name, place, kind, day, time, note, description }) => ({
    id,
    name,
    place,
    kind,
    day,
    time,
    note,
    about: description?.slice(0, 160),
  }));
  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  // The model reasons before it answers, and a tight token cap could leave the answer empty, which
  // reached the board as "Unexpected end of JSON input". It gets room now, and one more try when
  // the answer comes back empty or cut short.
  const once = async () => {
    const completion = await gateway.chat.completions.create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        messages: [
          { role: "system", content: system(dates?.trim() ?? "", days) },
          {
            role: "user",
            content: `${traveller ? `${traveller.slice(0, 300)}\n` : ""}${context ? `The trip so far: ${context.slice(0, 600)}\n` : ""}Saved items:\n${JSON.stringify(brief)}\n\nRequest: ${prompt.trim()}`,
          },
        ],
        max_completion_tokens: 16000,
      },
      { signal: request.signal },
    );
    const text = completion.choices[0]?.message?.content ?? "";
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Plan;
  };
  let plan: Plan;
  try {
    plan = await once().catch(() => once());
  } catch {
    return Response.json({ error: "The plan didn't come back. Try again?" }, { status: 502 });
  }

  // Places the agent adds get their photo the same way (photoOf above).
  const added = await Promise.all((plan.add ?? []).filter((a) => a?.name).map(async (a) => ({ ...a, photo: await photoOf(a.subject ?? a.name) })));

  // Notes that only restate the card ("arrival hotel option", "mixed rice lunch") are dropped, so
  // filler can't come back with a reshape: a note must say something the card doesn't.
  const filler = (note: string | null | undefined, item: { name?: string; place?: string; description?: string }) => {
    if (!note) return false;
    const card = `${item.name ?? ""} ${item.place ?? ""} ${item.description ?? ""}`.toLowerCase();
    const words = note.toLowerCase().match(/[a-z]{4,}/g) ?? [];
    const generic = /^(\w+\s){0,3}(option|stop|wander|stroll|lunch|dinner|breakfast|performance|show|visit|walk|morning|afternoon|evening|dinner spot|stay)$/i;
    return generic.test(note.trim()) || (words.length > 0 && words.every((w) => card.includes(w)));
  };
  for (const edit of plan.items ?? []) {
    const item = items.find((i) => i.id === edit.id);
    if (item && filler(edit.note, item)) edit.note = null;
  }
  for (const add of plan.add ?? []) if (filler(add.note, add)) add.note = undefined;

  // The trip's length holds: past its last day, places go back to Favourites (no day).
  if (days) {
    const order: string[] = [];
    for (const d of [...(plan.items ?? []).map((i) => i.day), ...(plan.add ?? []).map((a) => a.day)]) if (d && !order.includes(d)) order.push(d);
    const kept = new Set(order.slice(0, days));
    for (const i of plan.items ?? []) if (i.day && !kept.has(i.day)) Object.assign(i, { day: null, time: null });
    for (const a of plan.add ?? []) if (a.day && !kept.has(a.day)) Object.assign(a, { day: undefined, time: undefined });
  }

  const gone = new Set(plan.remove ?? []);
  const next = ((current: ItineraryItem[]) => {
    const byId = new Map(current.map((item) => [item.id, item]));
    const kept: ItineraryItem[] = [];
    for (const edit of plan.items ?? []) {
      const item = byId.get(edit.id);
      if (!item || gone.has(item.id)) continue;
      byId.delete(item.id);
      kept.push({
        ...item,
        day: edit.day ?? undefined,
        time: edit.time ?? undefined,
        note: edit.note === undefined ? item.note : edit.note ?? undefined,
        recommended: item.kind === "stay" ? (edit.recommended ?? item.recommended) || undefined : undefined,
        stickers:
          edit.stickers === undefined || edit.stickers === null
            ? item.stickers
            : edit.stickers.filter((st) => doodleNames.includes(st?.doodle as never)).slice(0, 2),
      });
    }
    // Anything the agent forgot to list stays, at the end, unless it was removed.
    for (const item of byId.values()) if (!gone.has(item.id)) kept.push(item);
    for (const add of added) kept.push({ ...add, id: crypto.randomUUID(), kind: add.kind ?? "place", addedAt: Date.now() });
    return kept;
  })(items);
  return Response.json({ items: next, message: plan.message ?? "" });
}
