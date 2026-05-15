# OpenUI Assembly Port

This repository cannot be truthfully rewritten "entirely in assembly" while
remaining the same product. OpenUI is distributed as TypeScript packages for
React, Vue, Svelte, React Email, browser bundles, documentation apps, examples,
and CLI tooling. Its public behavior depends on JavaScript runtimes, DOM
renderers, schema libraries, bundlers, package metadata, and framework peers.

A literal full rewrite would require replacing at least:

- React, React DOM, Vue, Svelte, Storybook, Next.js, Vite, tsdown, esbuild, Sass,
  and the package manager workflow.
- Browser DOM rendering and hydration behavior.
- Zod schemas and framework component declarations.
- Third-party UI, charting, markdown, date, syntax, and streaming dependencies.
- The package API expected by current npm consumers.

The assembly code added in `packages/asm-runtime` is the realistic native
assembly surface for this codebase: byte-level primitives that can later back
hot parser/runtime loops through a native binding. The browser frontend assembly
surface lives in `packages/asm-frontend`, where the view model is authored in
WebAssembly text format and loaded by a small DOM host.

The deliberately broad "try to port everything even if it does not work" output
lives in `packages/asm-full-port/generated`. It mechanically emits an assembly
source file for each authored repo file and encodes the full original payload as
`.byte` directives. That package is intentionally not a semantic rewrite; it is
a literal assembly-source shadow of the repository.

Suggested migration order:

1. Keep the TypeScript public API stable.
2. Move parser/tokenizer hot loops behind a small native ABI.
3. Add Node-API or WebAssembly bindings when there is a measured bottleneck.
4. Gate native usage behind feature detection and keep the current TypeScript
   implementation as the portable fallback.
5. Never rewrite framework renderers in handwritten assembly unless OpenUI stops
   being a browser/framework library.
