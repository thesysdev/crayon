import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Real coordinates for place names, so maps never show a point the model guessed. Names are
// looked up on OpenStreetMap's Nominatim (one request a second, as its policy asks), only within
// about 30 km of the trip's place when one is given, and cached on disk so a place is only ever
// looked up once. A name that can't be found there is left off the map rather than guessed.
//   POST { names: string[], near?: string }  ->  { points: { name, lat, lon, area? }[] }
// Names that can't be found are left out.

export const runtime = "nodejs";

type Point = { name: string; lat: number; lon: number; area?: string };
const file = path.join(process.cwd(), "data", "planner-geocode.json");
let cache: Record<string, Point | null> | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(file, "utf8"));
  } catch {
    cache = {};
  }
  return cache!;
}
async function persist() {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(cache));
}

type Box = { lat: number; lon: number };

async function lookup(query: string, around?: Box): Promise<Point | null> {
  // Around the trip's city, only results inside a box about 60 km across count.
  const box = around ? `&viewbox=${around.lon - 0.6},${around.lat + 0.6},${around.lon + 0.6},${around.lat - 0.6}&bounded=1` : "";
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1${box}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { "User-Agent": "openui-travel-planner/1.0 (design exploration)", "Accept-Language": "en" } });
  if (!response.ok) return null;
  const [hit] = (await response.json()) as { lat: string; lon: string; address?: Record<string, string> }[];
  if (!hit) return null;
  const a = hit.address ?? {};
  return { name: query, lat: Number(hit.lat), lon: Number(hit.lon), area: a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district ?? a.town ?? a.city };
}

/** One lookup at a time, a second apart. */
const politely = <T,>(job: () => Promise<T>) => {
  const run = queue.then(job, job);
  queue = run.then(
    () => new Promise((r) => setTimeout(r, 1100)),
    () => new Promise((r) => setTimeout(r, 1100)),
  );
  return run;
};

export async function POST(request: Request) {
  const { names, near } = (await request.json()) as { names?: string[]; near?: string };
  if (!Array.isArray(names) || !names.length) return Response.json({ points: [] });
  const known = await load();
  const points: Point[] = [];
  let changed = false;
  // The trip's place first: every name is then looked up only around it, so a "Johari Bazaar"
  // in Jaipur can never land on a namesake in Nairobi.
  const city = near?.trim() ? near.trim() : "";
  const cityKey = `v2:city|${city.toLowerCase()}`;
  if (city && !(cityKey in known)) {
    // A trip's name may be "Barcelona in two days": try it whole, then the place before " in ",
    // " for " or a comma, then each capitalised word.
    const tries = [city, city.split(/ in | for | on |:|,| - /)[0], ...(city.match(/\b[A-Z][\p{L}'-]+(?: [A-Z][\p{L}'-]+)*/gu) ?? [])];
    let found: Point | null = null;
    for (const t of [...new Set(tries.map((x) => x.trim()).filter((x) => x.length > 2))]) {
      found = await politely(() => lookup(t));
      if (found) break;
    }
    known[cityKey] = found;
    changed = true;
  }
  const around = city ? known[cityKey] ?? undefined : undefined;
  for (const raw of names.slice(0, 12)) {
    const name = String(raw).trim().slice(0, 120);
    if (!name) continue;
    const key = `v2:${name.toLowerCase()}|${city.toLowerCase()}`;
    if (!(key in known)) {
      let hit: Point | null = null;
      if (around) {
        // The name on its own inside the box, then with the city, then its first part
        // ("Tagus riverside" -> "Tagus") as a last try.
        hit = await politely(() => lookup(name, around));
        if (!hit) hit = await politely(() => lookup(`${name}, ${city.split(",").at(-1)!.trim()}`, around));
        if (!hit && name.includes(" ")) hit = await politely(() => lookup(name.split(/[,(]/)[0].trim(), around));
      } else if (!city) hit = await politely(() => lookup(name));
      known[key] = hit;
      changed = true;
    }
    const point = known[key];
    if (point) points.push({ ...point, name });
  }
  if (changed) await persist().catch(() => {});
  return Response.json({ points });
}
