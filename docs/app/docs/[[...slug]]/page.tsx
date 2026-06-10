import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { JsonLd } from "@/components/seo/JsonLd";
import { gitConfig } from "@/lib/layout.shared";
import { BASE_URL, getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  const url = `${BASE_URL}${page.url}`;
  const breadcrumbItems = [
    { name: "Docs", url: `${BASE_URL}/docs` },
    ...page.slugs.map((_, i) => {
      const p = source.getPage(page.slugs.slice(0, i + 1));
      return p ? { name: p.data.title, url: `${BASE_URL}${p.url}` } : null;
    }),
  ].filter((item): item is { name: string; url: string } => item !== null);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: page.data.title,
      description: page.data.description,
      image: `${BASE_URL}${getPageImage(page).url}`,
      author: { "@type": "Organization", name: "OpenUI" },
      publisher: {
        "@type": "Organization",
        name: "OpenUI",
        logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
      },
      ...(page.data.lastModified
        ? { dateModified: new Date(page.data.lastModified).toISOString() }
        : {}),
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <JsonLd data={jsonLd} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
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

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      type: "article",
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      images: getPageImage(page).url,
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: page.data.description,
      images: [getPageImage(page).url],
    },
  };
}
