import { BASE_URL, source } from "@/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

const SITE_DESCRIPTION =
  "Full-stack, renderer-agnostic Generative UI with a streaming-first language, official React support, community integrations, and up to 67% fewer tokens than JSON.";

export async function GET() {
  const pages = source.getPages().map((page) => {
    const canonicalUrl = new URL(page.url, BASE_URL);
    const markdownUrl = new URL(`${page.url}.mdx`, BASE_URL);
    const description = page.data.description || `OpenUI documentation for ${page.data.title}.`;

    return `- [${page.data.title}](${markdownUrl}): ${description} Canonical source: ${canonicalUrl}`;
  });

  const index = [
    "# OpenUI",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Project",
    "",
    `- [OpenUI website](${new URL("/", BASE_URL)}): Canonical OpenUI website.`,
    "- [OpenUI source repository](https://github.com/thesysdev/openui): Source code and releases.",
    "",
    "## Documentation",
    "",
    ...pages,
    "",
    "## Optional",
    "",
    `- [Complete OpenUI documentation](${new URL("/llms-full.txt", BASE_URL)}): Full documentation in one plain-text response; it may exceed an LLM context window.`,
    "",
  ].join("\n");

  return new Response(index, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
