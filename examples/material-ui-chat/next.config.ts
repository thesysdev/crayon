import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openuidev/react-lang", "@openuidev/react-headless"],
};

export default nextConfig;
