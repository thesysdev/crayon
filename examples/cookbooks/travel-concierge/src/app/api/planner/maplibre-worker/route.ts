import { readFile } from "node:fs/promises";
import path from "node:path";

// MapLibre's web worker, served as a plain module script. Its ESM build finds the worker next to
// itself, which the bundler doesn't copy, so the maps point setWorkerUrl here instead.

export const runtime = "nodejs";

let worker: Promise<string> | null = null;

export async function GET() {
  worker ??= readFile(path.join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"), "utf8");
  return new Response(await worker, {
    headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
