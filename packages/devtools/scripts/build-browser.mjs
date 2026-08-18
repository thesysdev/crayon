import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// Separate from tsdown's build: that one leaves react / react-dom /
// @openuidev/observability / @openuidev/react-lang / lucide-react as bare
// imports for the consumer's bundler to resolve, which is correct for npm
// but unresolvable for a browser fetching this file directly via
// `import(url)`. This build bundles lucide-react in and aliases the rest to
// browser-shims/* — see ../src/browser.ts and devtools-cdn.md.
const shim = (name) => fileURLToPath(new URL(`../src/browser-shims/${name}.ts`, import.meta.url));

await build({
  entryPoints: [fileURLToPath(new URL("../src/browser.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("../dist/devtools.browser.js", import.meta.url)),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
  jsx: "automatic",
  // Pinned, not left to inherit the build shell's NODE_ENV: esbuild folds
  // process.env.NODE_ENV to a build-time constant, and the widget's own
  // isEnabled check (OpenUIDevtools.tsx) short-circuits on it. Left
  // ambient, a `pnpm publish` run from a shell with NODE_ENV=production
  // (common in CI) would silently ship every consumer a permanently
  // disabled widget.
  define: {
    "process.env.NODE_ENV": '"development"',
  },
  alias: {
    react: shim("react"),
    "react-dom": shim("react-dom"),
    "react/jsx-runtime": shim("jsx-runtime"),
    "@openuidev/observability": shim("observability"),
    "@openuidev/react-lang": shim("react-lang"),
  },
});

console.log("wrote dist/devtools.browser.js");
