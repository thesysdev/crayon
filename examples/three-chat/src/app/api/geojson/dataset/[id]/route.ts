import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const GEO_SPATIALIST_ROOT = "/Users/jason/workspace/geo_spatialist/data";

const DATASETS: Record<string, string> = {
  "south-america-rivers": "south_america_rivers.geojson",
  "south-america-lakes": "south_america_lakes.geojson",
  "yosemite-waterways": "yosemite_waterways.geojson",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const relativePath = DATASETS[id];

  if (!relativePath) {
    return Response.json(
      {
        error: "Unknown GeoJSON dataset",
        available: Object.keys(DATASETS),
      },
      { status: 404 },
    );
  }

  const path = join(GEO_SPATIALIST_ROOT, relativePath);
  const info = await stat(path).catch(() => null);

  if (!info?.isFile()) {
    return Response.json({ error: `Dataset file not found: ${id}` }, { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(path));

  return new Response(stream as ReadableStream, {
    headers: {
      "Content-Type": "application/geo+json; charset=utf-8",
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=60",
    },
  });
}
