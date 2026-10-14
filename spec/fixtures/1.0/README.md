# OpenUI 1.0 conformance fixtures

The layout and main file formats are in [language.md](../../language.md), Appendix B. This file lists the details Appendix B leaves open. Every expected result was written from the spec text. The suite holds only cases the reference implementation passes. A new case arrives with the fix that makes it pass.

```text
spec/fixtures/1.0/
  library.json          the test library, used by every case
  <area>/<NNN-short-name>/
```

Each area folder has a `README.md` that says what the area protects and lists every case with what it checks.

## The test library

`library.json` is a LibrarySpec ([prompt.md](../../prompt.md), section 2) with `root: "Stack"`, twelve components, one custom function, `@Upper(text)`, which returns the text in upper case, and one custom action, `@CopyToClipboard(text)`. The function has no implementation in the file, so a runner supplies it.

Positional order is the key order of each component's `properties` in `$defs`, and of each function's and action's `params` in `schema.functions` and `schema.actions`. Bindable props are the ones whose signature prints `$binding<string>` (`Input.value`, `Select.value`); the schema has no marker for them. Component slots are `$ref`s to `$defs` entries: the children of `Stack`, `Card`, and `Form` take any component, `Table` columns take `Col`, and `Select` items take `SelectItem`. `Button.action` is `{ "$ref": "#/$defs/ActionExpression" }`, and `Button.share` takes only `@CopyToClipboard` or `@OpenUrl`.

## Program cases

Files: `input.oui` (streaming cases: `chunks.json`) and `expected.json`.

`expected.json` has the keys of Appendix B: `root`, `errors`, `unresolved`, `orphans`, `incomplete`. It may also have:

- `state`: the state defaults after the stream ends, `{ "$name": value }`. When present it must match exactly.
- `statements` (editing cases): the statement names of the merged program, in order.
- `errorObjects`: the structural fields of the error object (language.md, section 8.3): `source`, `code`, `statementId`, `component`, `path`. Only the listed keys are compared. `message` and `hint` are text for the model and are never compared.

How the tree is summarized:

- A component is `{ "type", "props" }`. A prop that is null or absent is left out. Array elements are kept as they are, including `null`.
- Actions are `{ "actions": [{ "action", "args" }] }`. Action names drop the `@`: `ToAssistant`, `OpenUrl`, `Set`, `Reset`, `Run`. `ToAssistant` args are the message, plus the context when there is one. `Set` args are the target and its value, evaluated with the state at stream end. `Reset` args are the targets, and `Run` args are the statement id. A custom action uses its name, and its args are the arguments in the key order of the action's `params`. Every action call is an `Action` of one action (language.md, section 6.3), so a lone action is summarized as a list of one, and a plain list of actions as a list of such lists.
- A binding is `{ "$binding": "$name" }`.
- Values come from evaluating the tree when the stream ends. No query has returned yet, so a reference to a query reads its defaults, and a reference to a mutation reads `{ "status": "idle", "data": null, "error": null }`.

Comparison:

- `errors` is compared as a multiset. An entry without `statementId` matches any statement, which is how `no-root` is written.
- `unresolved` and `orphans` are compared as sets.
- Streaming cases must match both after the last chunk plus the end of the stream, and as a batch parse of the joined chunks (language.md, section 4: streaming equals parsing).
- `*-roundtrip-*` cases also serialize the rendered tree, parse it again, and expect the same `root`.

## Testing your implementation

The cases work like [toml-test](https://github.com/toml-lang/toml-test): your implementation reads text and prints JSON, and a small harness diffs it.

There are two kinds of check, and a client can claim either level:

| Level | Files | Needs | Checks |
| --- | --- | --- | --- |
| 1. Program | `input.oui` or `chunks.json`, `patch.oui`, `validation.json`, `expected.json` | A parser and evaluator, no UI | Syntax, streaming, entry, references, evaluation, editing, errors, validation rules |
| 2. Interaction | `interactions.json` | A renderer that runs actions | What a click or typing does: the events the host receives and the final state |

Every case has a level 1 check. A case is also a level 2 check when its folder has `interactions.json`. The area READMEs mark these cases with "+ interactions". A parser, validator, or server-side checker can stop at level 1.

A case is a folder with `input.oui` (or `chunks.json`) and `expected.json`, plus `patch.oui` for editing cases, `interactions.json` for action and form cases, and `validation.json` for validation cases. To test a client:

1. Write an adapter that loads `library.json`, parses `input.oui` with it (or pushes each chunk of `chunks.json`, then ends the stream), evaluates the tree at stream end, and prints the canonical JSON: `root`, `errors` as `{ code, statementId }`, `unresolved`, `orphans`, `incomplete`, `state`, and `statements` for editing cases.
2. Run it on every case and diff its output with `expected.json` using the comparison rules above: `errors` as a multiset, `unresolved` and `orphans` as sets, everything else exactly, and for streaming cases the streamed result and a batch parse of the joined chunks must both match.
3. For `interactions.json`, mount the program with test renderers for `Form`, `Input`, and `Button`, replay the interactions, and compare the host events and the state.

The canonical form holds only spec concepts: component types and props, resolved values, error codes, unresolved names, orphans, `incomplete`, state, and statements. It never holds parser internals or message text.

The reference runners are `packages/lang-core/src/__tests__/conformance.test.ts` (program and validation cases) and `packages/react-lang/src/__tests__/conformance.interactions.test.tsx` (`interactions.json`). They run with each package's tests and fail on any case that does not pass. `OPENUI_FIXTURES` points them at another fixture folder.

## Editing cases

Files: `input.oui` (the current program), `patch.oui` (the model's reply), and `expected.json`. The runner merges the patch into the program (language.md, section 7), then parses the result as a program case. `statements` is read from the merged text: each line that starts with `name =` at column 0 starts a statement.

## Action and form cases

These cases add `interactions.json` as in Appendix B. An interaction is `{ "click": id }`, `{ "type": [id, text] }`, or `{ "tool": name, "result": json }`, where `id` is the statement name of a Button or Input.

- A `tool` interaction sets what that tool returns from then on. Tool interactions before the first user interaction apply before the program mounts.
- `expected.events` lists the host events in order. Each entry is compared on the keys it lists only. `"formName": null` means the key is absent or null.
- `expected.state` is compared key by key against the state store.
- `expected.toolCalls` is optional: `[{ "tool", "args" }]`, the tool calls in order. Consecutive identical calls count once. Appendix B has no way to check tool arguments, so this key extends it.

The test library's Input writes a form field as `{ "value", "componentType": "input" }`. `componentType` is up to each platform's components, so fixtures only use it with this library.

State cases with user input (`state/*-binding-*`, `state/*-form-*`) use `interactions.json` too.

## Validation cases

`state/*-validation-*` cases hold `validation.json` instead of a program: `{ "cases": [{ "rules", "value", "valid" }] }`. `rules` is the validation rules object (language.md, section 5.4). The runner checks each value against the rules and compares only pass or fail, not the message.
