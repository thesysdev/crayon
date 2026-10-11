import { renderPageOgImage } from "@/lib/og/templates";
import { integrationBySlug } from "../data";
import { generateMetadata } from "./page";

export { generateStaticParams } from "./page";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = integrationBySlug.get(slug)?.logo;
  return renderPageOgImage(
    await generateMetadata({ params }),
    logo?.startsWith("/") ? logo : undefined,
  );
}
