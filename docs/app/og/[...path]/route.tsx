import { getOgImages } from "@/lib/og/entries";
import { renderOgCard } from "@/lib/og/render";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return [...getOgImages().keys()].map((path) => ({ path: path.slice(1).split("/") }));
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[...path]">) {
  const { path } = await params;
  const image = getOgImages().get(`/${path.join("/")}`);
  if (!image) notFound();
  return renderOgCard(image.card);
}
