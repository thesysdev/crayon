import { renderPageOgImage } from "@/lib/og/templates";
import { generateMetadata } from "./page";

export { generateStaticParams } from "./page";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ demoSlug: string }> }) {
  return renderPageOgImage(await generateMetadata({ params }));
}
