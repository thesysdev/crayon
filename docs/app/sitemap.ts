import { getGitLastModified } from "@/lib/git-last-modified";
import { BASE_URL, blog, source } from "@/lib/source";
import { integrations } from "./(home)/integrations/data";

const PAGE_PATHS = ["/", "/openui-vs-json", "/compare", "/lab", "/chat"];

const BENCHMARK_PATHS = [
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

export default async function sitemap() {
  const route = (path: string, lastModified?: Date) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
  });

  const pageRoutes = PAGE_PATHS.map((path) => route(path));

  const benchmarksLastModified = getGitLastModified("app/(home)/benchmarks", "lib/benchmark-*");
  const benchmarkRoutes = BENCHMARK_PATHS.map((path) => route(path, benchmarksLastModified));

  const integrationsLastModified = getGitLastModified(
    "app/(home)/integrations/data.ts",
    "app/(home)/integrations/[slug]/page.tsx",
  );
  const integrationRoutes = [
    route("/integrations", integrationsLastModified),
    ...integrations.map((integration) =>
      route(`/integrations/${integration.slug}`, integrationsLastModified),
    ),
  ];

  const docsRoutes = source.getPages().map((page) => route(page.url, page.data.lastModified));

  const blogRoutes = blog
    .getPages()
    .map((page) => route(page.url, new Date(page.data.updatedAt ?? page.data.date)));
  const latestBlogTime = Math.max(...blogRoutes.map((r) => r.lastModified?.getTime() ?? 0));
  const blogIndexLastModified = latestBlogTime > 0 ? new Date(latestBlogTime) : undefined;

  return [
    ...pageRoutes,
    ...benchmarkRoutes,
    ...integrationRoutes,
    ...docsRoutes,
    route("/blog", blogIndexLastModified),
    ...blogRoutes,
  ];
}
