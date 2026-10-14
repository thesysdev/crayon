import { getOgImages } from "@/lib/og/entries";
import { ogImagePath } from "@/lib/og/images";
import { renderOgCard } from "@/lib/og/render";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

/** Every OG image keyed by its file path, e.g. `/og/compare.png`. */
function imagesByFile() {
  return new Map([...getOgImages().values()].map((image) => [ogImagePath(image), image]));
}

export function generateStaticParams() {
  return [...imagesByFile().keys()].map((file) => ({ path: file.slice("/og/".length).split("/") }));
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[...path]">) {
  const { path } = await params;
  const image = imagesByFile().get(`/og/${path.join("/")}`);
  if (!image) notFound();
  return renderOgCard(image.card);
}
