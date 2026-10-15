# entry

These cases protect a client from rendering the wrong statement, or rendering nothing, when it picks the entry. The entry is the `root` statement, or else the first value statement that calls the library's root component (`Stack` in the test library), with a non-fatal `no-root`. They cover [language.md section 2.2](../../../language.md#22-entry) and the `no-root` row of [section 8.2](../../../language.md#82-error-codes).

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-root-statement | `root = Stack([t])` renders with no errors. | [2.2](../../../language.md#22-entry) |
| 002-first-calls-root-component | No `root` statement: `page`, the first statement that calls `Stack`, renders with a non-fatal `no-root`. | [2.2](../../../language.md#22-entry) |
| 003-root-component-later | The same, with the `Stack` statement after a Text statement: the fallback entry is found wherever it is. | [2.2](../../../language.md#22-entry) |
| 004-root-not-a-component | `root = "hello"`: a fatal `no-root`, and nothing renders. | [2.2](../../../language.md#22-entry) |
| 005-first-is-state-declaration | A state declaration comes first and is never the entry: `page` renders with a non-fatal `no-root`, and `$tab` gets its default. | [2.2](../../../language.md#22-entry) |
| 006-ternary-root-multiline | `root` is a ternary over two component statements, written over three lines: with `$dark` false, `lightPage` renders with no errors. | [2.2](../../../language.md#22-entry), [1.4](../../../language.md#14-statements) |
| 007-no-root-component-call | The only statement calls Text, not `Stack`: a fatal `no-root`, nothing renders, and there are no orphans. | [2.2](../../../language.md#22-entry), [2.3](../../../language.md#23-references-and-hoisting) |
