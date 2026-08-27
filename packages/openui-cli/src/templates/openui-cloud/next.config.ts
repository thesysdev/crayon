import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    turbopackMinify: false,
  },
};

export default nextConfig;
