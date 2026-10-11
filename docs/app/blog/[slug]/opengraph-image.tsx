import { publicImage, renderOgImage } from "@/lib/og/render";
import { OgCard, OgCover } from "@/lib/og/templates";
import { blog } from "@/lib/source";
import { notFound } from "next/navigation";

export { generateStaticParams } from "./page";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = blog.getPage([slug]);
  if (!page) notFound();

  const logo = (await publicImage("/shiro-logo.svg"))!;
  const cover = await publicImage(page.data.ogImage ?? `/images/blog/${slug}.png`);
  if (cover) {
    return renderOgImage(
      <OgCover src={cover} logo={logo} title={page.data.title} author={page.data.author} />,
    );
  }

  return renderOgImage(
    <OgCard
      logo={logo}
      eyebrow={`Blog · ${page.data.author}`}
      title={page.data.title}
      description={page.data.description}
    />,
  );
}
