# @openuidev/a2ui

## 0.5.0

### Minor Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0.

  - Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
  - react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
  - browser-bundle 0.2 bundles react-lang 1.0 and react-ui 0.18.
  - server 0.3 uses lang-core 1.0 for autofix (parser and system prompt); stay on server 0.2 with a 0.x client. Autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.
  - vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render.
  - A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
  - A cut-off output that never reached its `root` statement, or any statement calling the root component, now renders blank instead of a partial tree.

### Patch Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI 1.0 review fixes:

  - lang-core: the built-in functions prompt no longer uses react-ui's `Col` in its `@Each` example, and names Query only when tool calls are on.
  - lang-core: `JSONSchemaDef` adds `type` and `anyOf`, so the CLI's spec for a library that uses `action()` passes to `generateSystemPrompt` without a cast.
  - react-ui: the chat prompt's button rules name `@ToAssistant` and `@OpenUrl`.
  - react-ui, a2ui, assistant-ui, devtools, react-email: the `@openuidev/react-lang` peer window now covers the version this release publishes.

- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/lang-core@1.0.0
  - @openuidev/react-lang@1.0.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`05c1b25`](https://github.com/thesysdev/openui/commit/05c1b2500275711155625d1056f46a8222b954e2)]:
  - @openuidev/react-lang@0.4.1
  - @openuidev/lang-core@0.4.1

## 0.4.0

### Minor Changes

- [#1268](https://github.com/thesysdev/openui/pull/1268) [`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add optional Renderer slots for content, query loading, errors, and retry controls. Keep `queryLoader` supported on `Renderer` and `A2UIRenderer`. Preserve the default loading spinner; error/retry views render nothing unless supplied by the application.

  Preserve the existing query lifecycle while waiting for generation to finish. Keep mounted input state through retries and refresh query results when generated scripts change.

### Patch Changes

- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01)]:
  - @openuidev/react-lang@0.4.0
  - @openuidev/lang-core@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`7c8f5e9`](https://github.com/thesysdev/openui/commit/7c8f5e9ae2e914063f7b47fc131fd46a7e178985)]:
  - @openuidev/lang-core@0.3.2
  - @openuidev/react-lang@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [[`55df79c`](https://github.com/thesysdev/openui/commit/55df79c2ff645b4c24b03be9c798f57cdf36dd99)]:
  - @openuidev/lang-core@0.3.1
  - @openuidev/react-lang@0.3.1
