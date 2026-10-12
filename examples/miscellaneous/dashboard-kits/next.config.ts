import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    // Re-minifying the already minified @openuidev/thesys 0.14.0 bundle makes
    // SWC emit a duplicate `let` declaration, which breaks the page in both the
    // server and browser chunks. Remove once the package or SWC is fixed.
    turbopackMinify: false,
  },
};

export default config;
