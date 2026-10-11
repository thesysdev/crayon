import { ImageResponse } from "@takumi-rs/image-response";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

const fonts = Promise.all(
  [400, 500, 600].map(async (weight) => ({
    name: "Inter",
    weight,
    data: await readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/inter/files",
        `inter-latin-${weight}-normal.woff2`,
      ),
    ),
  })),
);

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Reads a file from `public/` as a data URI, or returns `undefined` when it does not exist. */
export async function publicImage(path: string): Promise<string | undefined> {
  const data = await readFile(join(process.cwd(), "public", path)).catch(() => undefined);
  if (!data) return undefined;
  return `data:${MIME_TYPES[extname(path)]};base64,${data.toString("base64")}`;
}

export async function renderOgImage(node: ReactNode) {
  return new ImageResponse(node, { ...OG_SIZE, format: "png", fonts: await fonts });
}
