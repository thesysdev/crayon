---
"@openuidev/lang-core": minor
"@openuidev/react-lang": patch
"@openuidev/vue-lang": patch
"@openuidev/angular-lang": patch
"@openuidev/server": patch
---

OpenUI Lang 1.0 entry rule: the entry is the `root` statement, else the first statement that calls the library root component, wherever it is (`no-root` with `severity: "warning"`), else a `no-root` error. With no entry, statements are not also reported as orphaned. `root = $t ? A : B` is a valid entry, exposed as `ParseResult.rootExpression` and evaluated with the new `evaluateRoot()`. An `@Name(...)` call that is not a built-in or action step reports `unknown-function` and evaluates to null; its statement is kept.
React: renders ternary entries and reports `no-root` instead of `parse-failed` when statements parsed but no entry rendered.
`ValidationError` and `OpenUIError` gain an optional `severity: "warning"`; React, Vue and Angular pass it through to `onError`. Server autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.

Breaking:

- A program without `root` in which no statement calls the library root component no longer renders its first component statement.
- `@Name(...)` for a non-built-in, including `@Card(...)`, now evaluates to null with `unknown-function` instead of acting as a component call.
- Vue, Svelte and Angular get the new entry rule and errors but do not render ternary entries yet.
