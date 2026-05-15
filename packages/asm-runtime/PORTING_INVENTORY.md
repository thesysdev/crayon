# Assembly Porting Inventory

This inventory accounts for the current workspace packages and the practical
assembly boundary for each one.

| Package | Assembly status | Reason |
| --- | --- | --- |
| `@openuidev/lang-core` | Candidate for native helpers | Parser and runtime byte-scanning loops can use assembly behind the existing TypeScript API. |
| `@openuidev/react-headless` | Keep TypeScript | React hooks, stores, stream adapters, and protocol objects are runtime/framework integration code. |
| `@openuidev/react-lang` | Keep TypeScript | React renderer and hooks depend on React semantics and browser/server rendering. |
| `@openuidev/vue-lang` | Keep TypeScript/Vue | Vue components and reactivity depend on Vue runtime contracts. |
| `@openuidev/svelte-lang` | Keep TypeScript/Svelte | Svelte components compile through the Svelte toolchain. |
| `@openuidev/react-ui` | Keep TypeScript/SCSS | UI components depend on React, DOM behavior, CSS, Radix, charts, markdown, and icons. |
| `@openuidev/react-email` | Keep TypeScript/React Email | Email rendering depends on React Email component semantics and HTML output. |
| `@openuidev/cli` | Keep TypeScript | CLI scaffolding depends on Node.js APIs, prompts, esbuild, and filesystem behavior. |
| `@openuidev/browser-bundle` | Keep JavaScript bundle | The output target is browser JavaScript, not a native executable. |
| `@openuidev/asm-runtime` | Native assembly | Handwritten Darwin arm64 and Linux x86_64 primitives. |
| `@openuidev/asm-frontend` | WebAssembly text | Browser-facing assembly view model with a small DOM host. |
| Docs, examples, benchmarks | Keep current stack | These are product documentation, sample apps, and measurement tooling. |
| Third-party libraries | Not rewritten here | They are external packages with their own release, license, and runtime contracts. |

The first native integration target should be `@openuidev/lang-core`, using the
assembly primitives in this package for parser/tokenizer work after profiling
shows a real bottleneck.
