import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OG_SIZE, type OgCardData, TEMPLATE_VERSION } from "./templates";

/** One prerendered OG image: the page it belongs to and what it shows. */
export type OgImage = { path: string; card: OgCardData };

export function publicPath(path: string) {
  return join(process.cwd(), "public", path);
}

export function publicFileExists(path: string) {
  return existsSync(publicPath(path));
}

function cardAssets(card: OgCardData) {
  const assets = ["/shiro-logo.svg"];
  if (card.template === "cover") assets.push(card.cover);
  else if (card.template === "home") assets.push("/og-grain.png");
  else if (card.template === "card" && card.partnerLogo) assets.push(card.partnerLogo);
  return assets;
}

/**
 * `/og/<page path>.<png|jpg>?v=<hash>`. The hash covers the card content, the artwork bytes, and
 * `TEMPLATE_VERSION`, so link-preview caches refetch whenever the rendered image would change.
 * The route ignores the query string.
 */
export function ogImageUrl({ path, card }: OgImage) {
  const hash = createHash("sha256").update(`${TEMPLATE_VERSION}\n${JSON.stringify(card)}`);
  for (const asset of cardAssets(card)) hash.update(readFileSync(publicPath(asset)));
  return `${ogImagePath({ path, card })}?v=${hash.digest("hex").slice(0, 10)}`;
}

/** `/og/<page path>.<png|jpg>`, so the image URL carries a file extension like a static asset. */
export function ogImagePath({ path, card }: OgImage) {
  return `/og${path}.${ogImageFormat(card) === "jpeg" ? "jpg" : "png"}`;
}

/**
 * Blog covers are photographic and the homepage card is covered in grain, so both ship as JPEG
 * to stay small (WhatsApp drops previews for large images). Text cards stay PNG for crisp type.
 */
export function ogImageFormat(card: OgCardData) {
  return card.template === "cover" || card.template === "home" ? "jpeg" : "png";
}

export function ogImageMetadata(image: OgImage) {
  return {
    url: ogImageUrl(image),
    ...OG_SIZE,
    type: `image/${ogImageFormat(image.card)}`,
    alt: image.card.title,
  };
}
