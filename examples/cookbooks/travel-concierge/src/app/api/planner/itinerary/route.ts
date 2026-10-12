import { change, type ItineraryItem, list, tripKey } from "./store";

// The itinerary for one trip (?trip=<id>):
//   GET                         its items
//   POST   { item }             add one (an item with the same subject or name replaces it)
//   PATCH  { items }            replace the whole list, in order (the board's edits)
//   DELETE ?id=<item id>        remove one
// Every response is { items } after the change.

export const runtime = "nodejs";

const bad = (error: string) => Response.json({ error }, { status: 400 });
const same = (a: ItineraryItem, b: Partial<ItineraryItem>) =>
  (!!a.subject && a.subject === b.subject) || a.name.toLowerCase() === b.name?.toLowerCase();

export async function GET(request: Request) {
  const trip = tripKey(new URL(request.url).searchParams.get("trip"));
  if (!trip) return bad("Which trip?");
  return Response.json({ items: await list(trip) });
}

export async function POST(request: Request) {
  const trip = tripKey(new URL(request.url).searchParams.get("trip"));
  const { item } = (await request.json()) as { item?: Partial<ItineraryItem> };
  if (!trip || !item?.name) return bad("Send a trip and an item with a name.");
  const saved: ItineraryItem = { ...item, name: item.name, id: crypto.randomUUID(), addedAt: Date.now() };
  return Response.json({ items: await change(trip, (items) => [...items.filter((i) => !same(i, item)), saved]) });
}

export async function PATCH(request: Request) {
  const trip = tripKey(new URL(request.url).searchParams.get("trip"));
  const { items } = (await request.json()) as { items?: ItineraryItem[] };
  if (!trip || !Array.isArray(items)) return bad("Send a trip and its items.");
  return Response.json({ items: await change(trip, () => items.filter((i) => i?.id && i.name)) });
}

export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  const trip = tripKey(params.get("trip"));
  const id = params.get("id");
  if (!trip || !id) return bad("Send a trip and an id.");
  return Response.json({ items: await change(trip, (items) => items.filter((i) => i.id !== id)) });
}
