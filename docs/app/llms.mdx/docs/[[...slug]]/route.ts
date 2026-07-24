import { createCanonicalLlmDocumentHeaders } from "@/lib/geo/llm-output";
import { BASE_URL, getLLMText, source } from "@/lib/source";
import { notFound } from "next/navigation";

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const canonicalUrl = new URL(page.url, BASE_URL).toString();

  return new Response(await getLLMText(page), {
    headers: createCanonicalLlmDocumentHeaders(canonicalUrl),
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
