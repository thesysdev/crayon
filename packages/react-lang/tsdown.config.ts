import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "index.native": "src/index.native.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
});
