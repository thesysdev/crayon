import { defineConfig } from "tsdown";

// Four entries: the shared kit blocks (client), one per kit (client), and the
// server-safe kit definitions, tool contracts, and prompt assembly. Styles are
// compiled separately by `build:scss` into dist/styles.css.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    ecommerce: "src/ecommerce.ts",
    analytics: "src/analytics.ts",
    server: "src/server.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/, /\.scss$/, /\.css$/],
  },
});
