import { createMDX } from "fumadocs-mdx/next";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { redirects } from "./redirects.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

// Demos deployed as their own Vercel projects, served under openui.com/demo/<path>. Each app sets
// NEXT_PUBLIC_BASE_PATH to the same path, so its pages, assets and API routes all live under it.
const proxiedDemos = {
  "f1-dashboard": "https://openui-f1-dashboard.vercel.app",
  "trip-planner": "https://openui-trip-planner.vercel.app",
  "intelligent-ui": "https://open-intelligent-ui.vercel.app",
};

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ["@takumi-rs/image-response"],
  // OG metadata and images read artwork from public/ by path, so tracing would otherwise
  // bundle every video into each function. Media is served from the CDN, never read at runtime.
  outputFileTracingExcludes: {
    "/**": ["./public/**/*.{mp4,webm,mov,gif}"],
  },
  images: {
    /* Dense product screenshots contain small UI text and one-pixel rules.
       Keep the default for general imagery, but allow the illustration pair
       components to request a sharper responsive derivative. */
    qualities: [75, 95],
  },
  turbopack: {
    root: dirname(dirname(__dirname)),
  },

  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return redirects;
  },
  async rewrites() {
    return [
      ...Object.entries(proxiedDemos).flatMap(([path, origin]) => [
        { source: `/demo/${path}`, destination: `${origin}/demo/${path}` },
        { source: `/demo/${path}/:rest*`, destination: `${origin}/demo/${path}/:rest*` },
      ]),
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
      {
        source: "/:section(cookbooks|demos)/:path*.mdx",
        destination: "/llms.mdx/docs/:section/:path*",
      },
      {
        source: "/demos.mdx",
        destination: "/llms.mdx/docs/demos",
      },
    ];
  },
};

export default withMDX(config);
