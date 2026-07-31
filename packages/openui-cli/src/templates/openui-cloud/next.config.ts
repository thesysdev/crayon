import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
