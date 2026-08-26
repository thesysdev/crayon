import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-headless"],
};

export default nextConfig;
