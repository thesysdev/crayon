import type { NextConfig } from "next";

import { reportOpenUIProductionCompile } from "./.openui/build-telemetry";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    runAfterProductionCompile: reportOpenUIProductionCompile,
  },
};

export default nextConfig;
