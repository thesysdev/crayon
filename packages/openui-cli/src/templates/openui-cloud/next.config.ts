import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Next 16.3 + Vercel's adapter skips writing next-server.js.nft.json when
  // standalone is set, and onBuildComplete then fails. Keep standalone for
  // Docker / self-host; Vercel sets VERCEL=1 and does not need it.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
