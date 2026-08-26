import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externalizeOpenUI = (
        { request }: { request?: string },
        callback: (error?: null, result?: string) => void,
      ) => {
        if (request === "@openuidev/react-ui/genui-lib") {
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
