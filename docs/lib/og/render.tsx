import { ImageResponse } from "@takumi-rs/image-response";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { ogImageFormat } from "./images";
import { OG_SIZE, OgCard, type OgCardData, OgCover, OgHome } from "./templates";

let fonts: Promise<{ name: string; weight: number; data: Buffer }[]> | undefined;

function loadFonts() {
  fonts ??= Promise.all(
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
  return fonts;
}

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Reads a file from `public/` as a data URI. */
async function publicImage(path: string): Promise<string> {
  const data = await readFile(join(process.cwd(), "public", path));
  return `data:${MIME_TYPES[extname(path)]};base64,${data.toString("base64")}`;
}

export async function renderOgCard(card: OgCardData) {
  const logo = await publicImage("/shiro-logo.svg");
  const node =
    card.template === "home" ? (
      <OgHome mascot={logo} grain={await publicImage("/og-grain.png")} title={card.title} />
    ) : card.template === "cover" ? (
      <OgCover
        src={await publicImage(card.cover)}
        logo={logo}
        title={card.title}
        author={card.author}
      />
    ) : (
      <OgCard
        logo={logo}
        eyebrow={card.eyebrow}
        title={card.title}
        description={card.description}
        partnerLogo={card.partnerLogo && (await publicImage(card.partnerLogo))}
      />
    );
  return new ImageResponse(node, {
    ...OG_SIZE,
    format: ogImageFormat(card),
    quality: 85,
    fonts: await loadFonts(),
  });
}
