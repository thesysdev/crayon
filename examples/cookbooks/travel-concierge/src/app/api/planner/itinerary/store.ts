import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// The planner's itinerary, kept locally: one JSON file on disk (data/ is gitignored), holding an
// itinerary per trip. Each saved item keeps what the page knew when it was saved, so the board
// can show it without asking anyone again.

export type ItineraryItem = {
  id: string;
  /** Wikipedia title the photo came from, when it was a place or a dish. */
  subject?: string;
  name: string;
  photo?: string;
  /** Where it is, e.g. "Alfama, Lisbon". */
  place?: string;
  description?: string;
  /** A booking link (trivago) and its price a night, for stays. */
  url?: string;
  price?: string;
  /** For stays, what trivago said about it, so the hotel sheet can open from the board. */
  rating?: string;
  reviews?: string;
  stars?: number;
  amenities?: string;
  site?: string;
  total?: string;
  kind?: "place" | "stay" | "food";
  /** The plan's day this sits in, e.g. "Day 1 · Fri 6 Nov"; absent until the plan is made. */
  day?: string;
  /** A short handwritten note on the board. */
  note?: string;
  /** When in the day, e.g. "Morning". */
  time?: string;
  /** A stay the planner recommends: starred on the board, with a note saying why. */
  recommended?: boolean;
  /** Hand-drawn stickers on the card: a doodle name (see planner/doodles.tsx) and where it sits. */
  stickers?: { doodle: string; at?: string }[];
  addedAt: number;
};

type Store = Record<string, ItineraryItem[]>;

const file = path.join(process.cwd(), "data", "planner-itinerary.json");

async function load(): Promise<Store> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Store;
  } catch {
    return {};
  }
}

// Writes go one after another, and each lands whole (written aside, then renamed into place).
let queue = Promise.resolve();
function save(store: Store) {
  queue = queue.then(async () => {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(store, null, 2));
    await rename(`${file}.tmp`, file);
  });
  return queue;
}

export async function list(trip: string) {
  return (await load())[trip] ?? [];
}

/** Changes one trip's items and saves them; returns the trip's items after the change. */
export async function change(trip: string, edit: (items: ItineraryItem[]) => ItineraryItem[]) {
  await queue;
  const store = await load();
  store[trip] = edit(store[trip] ?? []);
  if (!store[trip].length) delete store[trip];
  await save(store);
  return store[trip] ?? [];
}

export const tripKey = (trip: string | null) => (trip && /^[\w-]{1,80}$/.test(trip) ? trip : null);
