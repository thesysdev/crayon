import { defineConfig } from "tsdown";

// Externalize every bare-specifier import (node_modules deps + peers); only
// bundle relative source. Mirrors the react-ui build setup.
const shared = {
  dts: false,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: false,
  deps: {
    neverBundle: [/^[^./]/],
  },
} satisfies Parameters<typeof defineConfig>[0];

export default defineConfig([
  { ...shared, format: ["cjs"], dts: true, entry: { index: "src/index.ts" } },
  { ...shared, format: ["esm"], dts: true, entry: { index: "src/index.ts" } },
]);
