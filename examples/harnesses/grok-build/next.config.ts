import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externalizeOpenUI = (
        { request }: { request?: string },
        callback: (error?: null, result?: string) => void,
      ) => {
        if (request === "@openuidev/thesys") {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      };
      config.externals = Array.isArray(config.externals)
        ? [externalizeOpenUI, ...config.externals]
        : [externalizeOpenUI];
    }
    return config;
  },
};

export default nextConfig;
