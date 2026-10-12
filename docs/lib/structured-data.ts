import { type OgImage, ogImageUrl } from "./og/images";
import { BASE_URL } from "./source";

const THESYS_LOGO_URL = "https://www.thesys.dev/thesys-logo-bw.png";

export const THESYS_ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://www.thesys.dev/#organization",
  name: "Thesys",
  url: "https://www.thesys.dev",
  logo: {
    "@type": "ImageObject",
    url: THESYS_LOGO_URL,
    width: 360,
    height: 360,
  },
} as const;

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, BASE_URL).toString(),
    })),
  };
}

export function jsonLdHtml(data: object): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function articleAuthor(name: string) {
  if (name === "Thesys Engineering Team") {
    return { "@type": "Organization", name: "Thesys", url: "https://www.thesys.dev" };
  }
  return { "@type": "Person", name };
}

/** Absolute URL of the OG image a page already serves (same hash as the metadata). */
export function absoluteOgImageUrl(image: OgImage): string {
  return new URL(ogImageUrl(image), BASE_URL).toString();
}
