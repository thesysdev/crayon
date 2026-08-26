import { BASE_URL, blog, source } from "@/lib/source";

const STATIC_PATHS = [
  "/",
  "/cloud",
  "/demos",
  "/compare",
  "/lab",
  "/chat",
  "/blog",
  "/benchmarks",
  "/benchmarks/methodology",
  "/benchmarks/agent.md",
  "/benchmarks/data.json",
  "/benchmarks/data.schema.json",
  "/benchmarks/data.csv",
];

export default async function sitemap() {
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  const docsRoutes = source.getPages().map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: page.data.lastModified,
    changeFrequency: "weekly" as const,
  }));

  const blogRoutes = blog.getPages().map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...docsRoutes, ...blogRoutes];
}
