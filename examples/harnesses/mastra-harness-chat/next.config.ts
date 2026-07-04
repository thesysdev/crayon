import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "@mastra/core", "@mastra/libsql", "libsql"],
  turbopack: {},
};

export default nextConfig;
