import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@assistant-ui/react", "@assistant-ui/react-ai-sdk"],
};

export default nextConfig;
