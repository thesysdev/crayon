import { BASE_URL, getLLMText, source } from "@/lib/source";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const canonicalUrl = new URL(page.url, BASE_URL).toString();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${canonicalUrl}>; rel="canonical"`,
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
