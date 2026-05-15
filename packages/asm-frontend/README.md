# @openuidev/asm-frontend

This is the browser-facing assembly package for OpenUI. The frontend content,
copy, counters, and view model live in `src/openui_frontend.wat`, which is
WebAssembly text format: assembly for the web platform.

The browser still needs a small JavaScript host because raw WebAssembly cannot
call DOM APIs by itself. `src/host.js` only loads the module, reads strings from
WASM memory, and maps exported pointers into DOM nodes.

See `PORTING_INVENTORY.md` for the frontend ownership split.

Run:

```sh
pnpm --filter @openuidev/asm-frontend test
pnpm --filter @openuidev/asm-frontend serve
```

Then open the printed local URL.
