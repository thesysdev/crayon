import { ogPages } from "@/generated/og-pages";
import { BASE_URL, blog, source } from "@/lib/source";
import type { MetadataRoute } from "next";
import { integrations } from "./(home)/integrations/data";

// Listed without a `lastmod` until their `metadata.ts` sets `updatedAt`.
const STATIC_PATHS = [
  "/",
  "/openui-vs-json",
  "/compare",
  "/lab",
  "/chat",
  "/demo/f1-dashboard",
  "/demo/trip-planner",
  "/demo/github",
  "/pricing",
  "/cloud/gateway",
  "/cloud/gateway/models",
  "/cloud/observability",
  "/openclaw-os",
  "/components",
  "/benchmarks",
  "/benchmarks/language",
  "/benchmarks/language/agent.md",
  "/benchmarks/language/data.json",
  "/benchmarks/language/data.csv",
  "/benchmarks/framework",
  "/benchmarks/framework/agent.md",
  "/benchmarks/framework/data.json",
  "/benchmarks/framework/data.csv",
  "/benchmarks/methodology",
  "/benchmarks/agent.md",
  "/benchmarks/data.json",
  "/benchmarks/data.schema.json",
  "/benchmarks/data.csv",
];

/** The page's `updatedAt`; data files like `agent.md` and `data.json` share their page's. */
function staticPageDate(path: string) {
  return (ogPages[path] ?? ogPages[path.replace(/\/[^/]+\.\w+$/, "")])?.updatedAt;
}

/**
 * Every `lastmod` is the date a page's content last changed, set by hand next to the content
 * (frontmatter, `metadata.ts`, integration data), never the build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const route = (path: string, updatedAt?: string | Date) => ({
    url: `${BASE_URL}${path}`,
    lastModified:
      updatedAt === undefined ? undefined : new Date(updatedAt).toISOString().slice(0, 10),
    changeFrequency: "weekly" as const,
  });
  const latest = (routes: { lastModified?: string }[]) =>
    routes
      .map((r) => r.lastModified)
      .filter((date) => date !== undefined)
      .sort()
      .at(-1);

  const integrationRoutes = integrations.map((integration) =>
    route(`/integrations/${integration.slug}`, integration.updatedAt),
  );
  const blogRoutes = blog
    .getPages()
    .map((page) => route(page.url, page.data.updatedAt ?? page.data.date));

  return [
    ...STATIC_PATHS.map((path) => route(path, staticPageDate(path))),
    route("/integrations", latest(integrationRoutes)),
    ...integrationRoutes,
    ...source.getPages().map((page) => route(page.url, page.data.updatedAt)),
    route("/blog", latest(blogRoutes)),
    ...blogRoutes,
  ];
}
