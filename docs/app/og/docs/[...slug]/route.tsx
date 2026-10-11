import { publicImage, renderOgImage } from "@/lib/og/render";
import { OgCard } from "@/lib/og/templates";
import { getPageImage, isTopLevelSection, source } from "@/lib/source";
import { notFound } from "next/navigation";

export const revalidate = false;

const FALLBACK_DESCRIPTION = "Documentation for OpenUI, the open standard for Generative UI.";

function getSectionName(slugs: string[]) {
  const folder = source.pageTree.children.find(
    (node) => node.type === "folder" && node.$id === slugs[0],
  );
  return typeof folder?.name === "string" ? folder.name : undefined;
}

export async function GET(_req: Request, { params }: RouteContext<"/og/docs/[...slug]">) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const section = getSectionName(page.slugs);
  const eyebrow =
    isTopLevelSection(page.slugs) && section
      ? section
      : ["Docs", section].filter(Boolean).join(" / ");

  return renderOgImage(
    <OgCard
      logo={(await publicImage("/shiro-logo.svg"))!}
      eyebrow={eyebrow}
      title={page.data.title}
      description={page.data.description ?? FALLBACK_DESCRIPTION}
    />,
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
