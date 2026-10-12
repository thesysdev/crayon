import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { gitConfig } from "@/lib/layout.shared";
import { docsOgImage } from "@/lib/og/content";
import { withOgImage } from "@/lib/page-metadata";
import { BASE_URL, source } from "@/lib/source";
import {
  absoluteOgImageUrl,
  breadcrumbList,
  jsonLdHtml,
  THESYS_ORGANIZATION,
} from "@/lib/structured-data";
import { getMDXComponents } from "@/mdx-components";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";

type DocsSourcePage = NonNullable<ReturnType<typeof source.getPage>>;

/** Renders a docs content page. Shared by `/docs` and the top-level sections like `/cookbooks`. */
export function DocsPageView({ page }: { page: DocsSourcePage }) {
  const MDX = page.data.body;

  const image = docsOgImage(page);
  const description = image.card.template === "card" ? image.card.description : undefined;
  const canonical = new URL(page.url, BASE_URL).toString();

  const isCookbooks = page.url.startsWith("/cookbooks");
  const section = isCookbooks
    ? { name: "Cookbooks", path: "/cookbooks" }
    : { name: "Docs", path: "/docs" };
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    section,
    ...(page.url === section.path ? [] : [{ name: page.data.title, path: page.url }]),
  ];

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: page.data.title,
        ...(description && { description }),
        image: [absoluteOgImageUrl(image)],
        ...(page.data.lastModified && {
          dateModified: new Date(page.data.lastModified).toISOString(),
        }),
        author: THESYS_ORGANIZATION,
        publisher: THESYS_ORGANIZATION,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      breadcrumbList(breadcrumbItems),
    ],
  };

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      footer={{ enabled: !page.data.hideFooter }}
      tableOfContent={{ style: "clerk" }}
      tableOfContentPopover={{ style: "clerk" }}
      // Without a sidebar there is room for the `full` page width next to the TOC (see global.css).
      data-no-sidebar={!page.data.sidebar || undefined}
    >
      {!page.data.customHeader && (
        <>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
          {page.data.pageActions && (
            <div className="flex flex-row gap-2 items-center border-b pb-6">
              <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
              <ViewOptions
                markdownUrl={page.url}
                githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
              />
            </div>
          )}
        </>
      )}
      <DocsBody>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdGraph) }}
        />
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function getDocsPageMetadata(page: DocsSourcePage): Metadata {
  const image = docsOgImage(page);
  const description = image.card.template === "card" ? image.card.description : undefined;
  return withOgImage({ ...docsMetadata(page), description }, image, { description });
}

function docsMetadata(page: DocsSourcePage): Metadata {
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
    },
  };
}
