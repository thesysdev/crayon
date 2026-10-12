---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

A `$state` value that streams in no longer sticks at its half-written value: an untouched default is replaced when the full declaration arrives, a partly typed `$name` no longer becomes state, and setting up declared defaults no longer fires `onStateUpdate`. User edits are kept. `StreamParser.push`, `set` and `getResult` take a `complete` flag: pass `true` once the stream has ended, or a `$name` that is the last token is not declared.
