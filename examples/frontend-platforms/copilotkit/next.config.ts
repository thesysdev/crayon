import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd(), "../../..") },
  transpilePackages: ["@openuidev/copilotkit"],
};

export default nextConfig;
