import { createMDX } from "fumadocs-mdx/next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ["@takumi-rs/image-response"],
  turbopack: {
    root: dirname(dirname(__dirname)),
  },

  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/components/blocks/accordian",
        destination: "/components/blocks/accordion",
        permanent: true,
      },
      {
        source: "/docs/design-system/blocks/accordian",
        destination: "/docs/design-system/blocks/accordion",
        permanent: true,
      },
      {
        source: "/docs",
        destination: "/docs/openui-lang",
        permanent: false,
      },
      {
        source: "/docs/add-ons",
        destination: "/showcase",
        permanent: false,
      },
      {
        source: "/add-ons",
        destination: "/showcase",
        permanent: false,
      },
      {
        source: "/ecosystem",
        destination: "/showcase",
        permanent: false,
      },
      {
        source: "/registry",
        destination: "/showcase",
        permanent: false,
      },
      // Nav rename: Playground -> Demos, Projects -> Showcase. Keep the old
      // paths working for external links and search results.
      {
        source: "/playground",
        destination: "/demos",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/showcase",
        permanent: true,
      },
      {
        source: "/blog/should-chat-be-the-new-homepage-for-saas",
        destination: "/blog/beyond-the-chatbar",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
};

export default withMDX(config);
