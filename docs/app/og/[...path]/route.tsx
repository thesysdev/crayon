import { getOgImages } from "@/lib/og/entries";
import { ogImagePath } from "@/lib/og/images";
import { renderOgCard } from "@/lib/og/render";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return [...getOgImages().values()].map((image) => ({
    path: ogImagePath(image).slice("/og/".length).split("/"),
  }));
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[...path]">) {
  const { path } = await params;
  const file = `/og/${path.join("/")}`;
  const image = getOgImages().get(file.slice("/og".length).replace(/\.(png|jpg)$/, ""));
  if (!image || ogImagePath(image) !== file) notFound();
  return renderOgCard(image.card);
}
