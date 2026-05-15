# @openuidev/asm-runtime

This package is the assembly track for OpenUI. It does not replace the React,
Vue, Svelte, TypeScript, DOM, package-manager, or third-party dependency
surfaces. Those layers are intentionally high-level and cannot be converted to
portable handwritten assembly while preserving the current public API.

What this package does provide:

- Real handwritten assembly sources for native OpenUI primitives.
- A C ABI header for smoke tests and future native bindings.
- A buildable executable that verifies the assembly on supported platforms.
- A package-by-package porting inventory in `PORTING_INVENTORY.md`.

Supported targets:

- Darwin arm64
- Linux x86_64

Current primitives:

- `openui_strlen`
- `openui_fnv1a64`
- `openui_find_byte`

These primitives are deliberately small because they are the sensible edge of an
assembly port: byte scanning, hashing, tokenization helpers, and other hot
parser/runtime loops. UI rendering, framework adapters, and schema composition
belong in the existing TypeScript packages unless the product target changes
from browser packages to a native application/runtime.

Run:

```sh
pnpm --filter @openuidev/asm-runtime test
```
