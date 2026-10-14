# @openuidev/react-email

## 0.4.0

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

- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/react-lang@1.0.0

## 0.3.1

### Patch Changes

- [#1343](https://github.com/thesysdev/openui/pull/1343) [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Widen the internal `react-lang` peer windows to include the 0.4.x line that the
  Renderer slots release (a minor bump of the lang family) publishes.
- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01)]:
  - @openuidev/react-lang@0.4.0

## 0.3.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - `@openuidev/react-lang` peer dependency now declares a bounded
  tested-compatibility range (`">=0.3.0 <0.4.0"`) instead of an exact pin.
  Minor (breaking) because the new floor excludes react-lang 0.2.x: upgrade
  react-lang together with react-email.

### Patch Changes

- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
