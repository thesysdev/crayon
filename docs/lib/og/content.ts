import type { InferPageType } from "fumadocs-core/source";
import { type blog, isTopLevelSection, source } from "../source";
import { type OgImage, publicFileExists } from "./images";

const DOCS_FALLBACK_DESCRIPTION = "Documentation for OpenUI, the open standard for Generative UI.";

function getSectionName(slugs: string[]) {
  const folder = source.pageTree.children.find(
    (node) => node.type === "folder" && node.$id === slugs[0],
  );
  return typeof folder?.name === "string" ? folder.name : undefined;
}

export function docsOgImage(page: InferPageType<typeof source>): OgImage {
  const section = getSectionName(page.slugs);
  return {
    path: page.url,
    card: {
      template: "card",
      eyebrow:
        isTopLevelSection(page.slugs) && section
          ? section
          : ["Docs", section].filter(Boolean).join(" / "),
      title: page.data.title,
      description: page.data.description ?? DOCS_FALLBACK_DESCRIPTION,
    },
  };
}

/** `ogImage` frontmatter, else the cover at `public/images/blog/<slug>.png`, else a text card. */
export function blogOgImage(page: InferPageType<typeof blog>): OgImage {
  const cover = page.data.ogImage ?? `/images/blog/${page.slugs[0]}.png`;
  const { title, author, description } = page.data;
  return {
    path: page.url,
    card: publicFileExists(cover)
      ? { template: "cover", cover, title, author }
      : { template: "card", eyebrow: `Blog · ${author}`, title, description },
  };
}
