import { defineConfig } from "tsdown";

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  sourcemap: true,
  target: "es2022",
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: "src/index.ts",
      "index.native": "src/index.native.ts",
    },
    outDir: "dist",
    clean: true,
  },
  {
    ...shared,
    entry: {
      index: "src/observability/index.ts",
    },
    outDir: "dist/observability",
    clean: false,
  },
]);
