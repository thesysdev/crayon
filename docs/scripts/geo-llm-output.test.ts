import { describe, expect, it } from "vitest";

import {
  createCanonicalLlmDocumentHeaders,
  createLlmPageDocument,
  createLlmsIndex,
  LLM_AGGREGATE_RESPONSE_HEADERS,
  LLM_MARKDOWN_CONTENT_TYPE,
  LLM_TEXT_CONTENT_TYPE,
} from "../lib/geo/llm-output";

const SITE_URL = "https://www.openui.com/";

function createIndex() {
  return createLlmsIndex({
    siteName: "OpenUI",
    siteDescription: "The open standard for generative UI.",
    siteUrl: SITE_URL,
    repositoryUrl: "https://github.com/thesysdev/openui",
    fullDocumentationUrl: "https://www.openui.com/llms-full.txt",
    pages: [
      {
        title: "Quickstart",
        description: "Install OpenUI and render your first interface.",
        canonicalUrl: "https://www.openui.com/docs/openui-lang/quickstart",
        markdownUrl: "https://www.openui.com/docs/openui-lang/quickstart.mdx",
      },
      {
        title: "OpenUI Lang",
        description: "Learn the streaming language.",
        canonicalUrl: "https://www.openui.com/docs/openui-lang",
        markdownUrl: "https://www.openui.com/docs/openui-lang.mdx",
      },
    ],
  });
}

describe("GEO LLM output", () => {
  it("emits a deterministic project index with absolute machine-readable links", () => {
    const index = createIndex();

    expect(index).toContain("# OpenUI\n\n> The open standard for generative UI.");
    expect(index).toContain("## Project");
    expect(index).toContain("## Documentation");
    expect(index).toContain("## Optional");
    expect(index).toContain("[Quickstart](https://www.openui.com/docs/openui-lang/quickstart.mdx)");
    expect(index).toContain("Canonical source: https://www.openui.com/docs/openui-lang/quickstart");
    expect(index).toContain(
      "[Complete OpenUI documentation](https://www.openui.com/llms-full.txt)",
    );
    expect(index).not.toMatch(/\]\(\/docs/);
    expect(createIndex()).toBe(index);
  });

  it("preserves curated page order and normalizes injected line breaks", () => {
    const index = createLlmsIndex({
      siteName: " OpenUI ",
      siteDescription: "Open\nstandard",
      siteUrl: SITE_URL,
      repositoryUrl: "https://github.com/thesysdev/openui",
      fullDocumentationUrl: "https://www.openui.com/llms-full.txt",
      pages: [
        {
          title: "First\npage",
          description: "First\n description",
          canonicalUrl: "https://www.openui.com/docs/first",
          markdownUrl: "https://www.openui.com/docs/first.mdx",
        },
        {
          title: "Second page",
          description: "Second description",
          canonicalUrl: "https://www.openui.com/docs/second",
          markdownUrl: "https://www.openui.com/docs/second.mdx",
        },
      ],
    });

    expect(index).toContain("# OpenUI\n\n> Open standard");
    expect(index).toContain("[First page]");
    expect(index).toContain("First description");
    expect(index.indexOf("[First page]")).toBeLessThan(index.indexOf("[Second page]"));
  });

  it("uses a factual fallback when a page has no description", () => {
    const document = createLlmPageDocument({
      title: "API Reference",
      canonicalUrl: "https://www.openui.com/docs/api-reference",
      body: "Package exports.",
    });

    expect(document).toContain("> OpenUI documentation for API Reference.");
  });

  it("rejects duplicate or off-origin documentation URLs", () => {
    const page = {
      title: "Quickstart",
      description: "Install OpenUI.",
      canonicalUrl: "https://www.openui.com/docs/quickstart",
      markdownUrl: "https://www.openui.com/docs/quickstart.mdx",
    };
    const baseOptions = {
      siteName: "OpenUI",
      siteDescription: "The open standard for generative UI.",
      siteUrl: SITE_URL,
      repositoryUrl: "https://github.com/thesysdev/openui",
      fullDocumentationUrl: "https://www.openui.com/llms-full.txt",
    };

    expect(() => createLlmsIndex({ ...baseOptions, pages: [page, page] })).toThrow(
      "Duplicate canonical URL",
    );
    expect(() =>
      createLlmsIndex({
        ...baseOptions,
        pages: [{ ...page, markdownUrl: "https://example.com/quickstart" }],
      }),
    ).toThrow("canonical site origin");
  });

  it("adds canonical source provenance to every page document", () => {
    const document = createLlmPageDocument({
      title: " Quickstart ",
      description: "Install\nOpenUI.",
      canonicalUrl: "https://www.openui.com/docs/openui-lang/quickstart",
      body: "\n## Install\n\nRun the CLI.\n",
    });

    expect(document).toBe(`# Quickstart

> Install OpenUI.

Source: https://www.openui.com/docs/openui-lang/quickstart

## Install

Run the CLI.
`);
  });

  it("uses explicit UTF-8 content types for text and Markdown routes", () => {
    expect(LLM_TEXT_CONTENT_TYPE).toBe("text/plain; charset=utf-8");
    expect(LLM_MARKDOWN_CONTENT_TYPE).toBe("text/markdown; charset=utf-8");
    expect(LLM_AGGREGATE_RESPONSE_HEADERS).toEqual({
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
    });
    expect(
      createCanonicalLlmDocumentHeaders("https://www.openui.com/docs/openui-lang/quickstart"),
    ).toEqual({
      "Content-Type": "text/markdown; charset=utf-8",
      Link: '<https://www.openui.com/docs/openui-lang/quickstart>; rel="canonical"',
    });
  });
});
