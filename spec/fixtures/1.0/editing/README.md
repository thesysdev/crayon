# editing

These cases protect a client from merging an edit-mode reply wrongly: replacing, appending, and deleting statements by name, removing what `root` no longer reaches, and finding statement boundaries the same way the parser does. They cover [language.md section 7](../../../language.md#7-incremental-editing) and [prompt.md section 6.4](../../../prompt.md#64-edit-mode). Each case has `input.oui` (the current program), `patch.oui` (the reply), and the expected merged statements.

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-replace-and-add | The patch replaces `root` and `a` and adds `c`: `b` is kept, `c` is appended at the end, and the page shows A2, B, C. | [7](../../../language.md#7-incremental-editing) |
| 002-delete-and-gc | `b = null` deletes `b`, `c` is removed because `root` no longer reaches it, and the state declaration `$x` is kept. | [7](../../../language.md#7-incremental-editing) |
| 003-state-delete | `$x = null` deletes the state declaration, so the merged program has no `$x` default. | [7](../../../language.md#7-incremental-editing), [5.1](../../../language.md#51-the-state-store-and-what-is-reactive) |
| 004-multiline-ternary-patch | A patch statement whose ternary spans three lines merges as one statement, and the Text shows "Off". (known failing: the merge splits a multi-line ternary at its newlines) | [7](../../../language.md#7-incremental-editing), [1.4](../../../language.md#14-statements) |
| 005-fenced-patch | A reply of prose around an `openui` fence: only the fenced statement is merged, and the prose is ignored. | [7](../../../language.md#7-incremental-editing), [1.2](../../../language.md#12-source-text) |
| 006-no-root-statement-no-gc | With no `root` statement nothing is removed: `x` is replaced and kept, `page` renders as the fallback entry with a non-fatal `no-root`, and `x` is an orphan. | [7](../../../language.md#7-incremental-editing), [2.2](../../../language.md#22-entry) |
| 007-redefinition-in-existing | The current program defines `a` twice: after the merge `a` is written once, with the later value "2". (known failing: `a` is written twice after the merge) | [7](../../../language.md#7-incremental-editing), [2.4](../../../language.md#24-duplicate-names) |
