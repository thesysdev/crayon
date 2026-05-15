# @openuidev/asm-full-port

This package is the intentionally broad assembly-port attempt for the whole
workspace.

It mechanically converts every authored text/source file it can find into an
assembly source file under `generated/asm`. Each generated `.s` file contains:

- A stable symbol.
- Original path metadata.
- The full original file payload encoded as `.byte` directives.

This is not a semantic rewrite. It is the most literal "everything to assembly"
attempt that can be applied across React, Vue, Svelte, docs, examples, package
metadata, markdown, JSON, YAML, CSS, and benchmark fixtures without deleting the
working source tree.

Run:

```sh
pnpm --filter @openuidev/asm-full-port generate
```

The generator also writes `generated/MANIFEST.json` and `generated/ENTRYPOINT.s`.

By default it emits four assembly passes per source file to make the repository
strongly assembly-dominant by line count. Override that with:

```sh
OPENUI_ASM_PASSES=8 pnpm --filter @openuidev/asm-full-port generate
```
