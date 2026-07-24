import { createLlmsIndex, LLM_TEXT_CONTENT_TYPE } from "@/lib/geo/llm-output";
import { BASE_URL, source } from "@/lib/source";

export const revalidate = false;

const SITE_DESCRIPTION =
  "Full-stack, renderer-agnostic Generative UI with a streaming-first language, official React support, community integrations, and up to 67% fewer tokens than JSON.";

export async function GET() {
  const index = createLlmsIndex({
    siteName: "OpenUI",
    siteDescription: SITE_DESCRIPTION,
    siteUrl: new URL("/", BASE_URL).toString(),
    repositoryUrl: "https://github.com/thesysdev/openui",
    fullDocumentationUrl: new URL("/llms-full.txt", BASE_URL).toString(),
    pages: source.getPages().map((page) => ({
      title: page.data.title,
      description: page.data.description,
      canonicalUrl: new URL(page.url, BASE_URL).toString(),
      markdownUrl: new URL(`${page.url}.mdx`, BASE_URL).toString(),
    })),
  });

  return new Response(index, {
    headers: {
      "Content-Type": LLM_TEXT_CONTENT_TYPE,
    },
  });
}
