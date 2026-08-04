import { BASE_URL, blog, source } from "@/lib/source";
import type { MetadataRoute } from "next";

const STATIC_PATHS = ["/", "/cloud", "/demos", "/compare", "/lab", "/chat", "/blog"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
  }));

  const docsRoutes = source.getPages().map((page) => ({
    url: `${BASE_URL}${page.url}`,
  }));

  const blogRoutes = blog.getPages().map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: page.data.date,
  }));

  return [...staticRoutes, ...docsRoutes, ...blogRoutes];
}
