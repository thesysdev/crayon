import type { Metadata } from "next";
import { type OgImage, ogImageMetadata } from "./og/images";

export const SITE_NAME = "OpenUI - The Open Standard for Generative UI";

/** Site-wide card, used by the homepage and the blog index. */
export const SITE_OG_IMAGE: OgImage = {
  path: "/home",
  card: { template: "home", title: "OpenUI, the open standard for Generative UI" },
};

export const SITE_OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  images: [ogImageMetadata(SITE_OG_IMAGE)],
} satisfies Metadata["openGraph"];

/**
 * A page's title, description, and OG artwork, declared once. Static routes keep this in a
 * colocated `metadata.ts` (picked up by `scripts/generate-og-map.mjs`); dynamic routes build it
 * from their content and register it in `lib/og/entries.ts`.
 */
export type PageMetadataInput = {
  pathname: string;
  title: string | { absolute: string };
  description: string;
  /** Link-preview title and description, when they differ from the page's. */
  openGraph?: { title?: string; description?: string };
  ogImage?: { eyebrow?: string; partnerLogo?: string };
};

export function pageOgImage(page: PageMetadataInput): OgImage {
  return {
    path: page.pathname,
    card: {
      template: "card",
      title:
        page.openGraph?.title ??
        (typeof page.title === "string" ? page.title : page.title.absolute),
      description: page.openGraph?.description ?? page.description,
      ...page.ogImage,
    },
  };
}

/** Builds Next metadata with the page's OG image. `extra` adds fields such as `alternates.types`. */
export function createPageMetadata(page: PageMetadataInput, extra: Metadata = {}): Metadata {
  const image = pageOgImage(page);
  return withOgImage(
    {
      ...extra,
      title: page.title,
      description: page.description,
      alternates: { canonical: page.pathname, ...extra.alternates },
      openGraph: { url: page.pathname, ...extra.openGraph } as Metadata["openGraph"],
    },
    image,
    { title: image.card.title, description: page.openGraph?.description ?? page.description },
  );
}

/** For layouts whose child pages inherit the metadata: no canonical or `og:url`. */
export function createLayoutMetadata(page: PageMetadataInput): Metadata {
  const image = pageOgImage(page);
  return withOgImage({ title: page.title, description: page.description }, image, {
    title: image.card.title,
    description: page.openGraph?.description ?? page.description,
  });
}

/**
 * Sets the same OG image on Open Graph and Twitter. `preview` is the link-preview title and
 * description; when omitted, Next falls back to the page's `title` and `description`.
 */
export function withOgImage(
  metadata: Metadata,
  image: OgImage,
  preview: PageMetadataInput["openGraph"] = {},
): Metadata {
  const images = [ogImageMetadata(image)];
  return {
    ...metadata,
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      url: metadata.alternates?.canonical ?? image.path,
      ...metadata.openGraph,
      ...preview,
      images,
    } as Metadata["openGraph"],
    twitter: { card: "summary_large_image", ...metadata.twitter, ...preview, images },
  };
}
