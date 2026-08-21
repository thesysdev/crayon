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
    return [
      {
        source: "/AGENTS.md",
        destination: "/",
        permanent: true,
      },
      {
        source: "/skills.md",
        destination: "https://github.com/thesysdev/skills/blob/main/skills/openui/SKILL.md",
        permanent: false,
      },
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
        destination: "/docs/overview",
        permanent: false,
      },
      {
        source: "/docs/add-ons",
        destination: "/lab",
        permanent: false,
      },
      {
        source: "/add-ons",
        destination: "/lab",
        permanent: false,
      },
      {
        source: "/ecosystem",
        destination: "/lab",
        permanent: false,
      },
      {
        source: "/registry",
        destination: "/lab",
        permanent: false,
      },
      // Nav rename: Playground -> Demos, Projects -> Lab. Keep the old
      // paths working for external links and search results.
      // Product rename: Paste → Debug. Keep the old path working.
      {
        source: "/paste",
        destination: "/debug",
        permanent: true,
      },
      {
        source: "/playground",
        destination: "/demos",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/lab",
        permanent: true,
      },
      {
        source: "/showcase",
        destination: "/lab",
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
