# grammar

These cases protect a client from reading the source text differently from other clients: where fences open and close, what counts as a comment, how strings, numbers, and minus signs lex, where a statement ends, and how expressions group. They cover [language.md section 1](../../../language.md#1-grammar) and the round trip of [section 9.2](../../../language.md#92-serialization).

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-fence-line-start | Three backticks in the middle of a prose line do not open a fence; only the fence at the start of a line is read. (known failing: a fence opens at any triple backtick) | [1.2](../../../language.md#12-source-text) |
| 002-fence-prose-quote | An unclosed double quote in prose does not hide the fence that follows. (known failing: the quote hides the fence opener) | [1.2](../../../language.md#12-source-text) |
| 003-fence-multiple-joined | Two fences are joined, the second runs to the end of the text with no closing fence, and three backticks inside a double-quoted string do not close the first. | [1.2](../../../language.md#12-source-text) |
| 004-comment-strip | `//` and `#` comments are removed, and comment markers inside strings, including a multi-line string, are kept. | [1.2](../../../language.md#12-source-text) |
| 005-lex-escapes | JSON escapes in double-quoted strings (`\"`, `\\`, `\t`, `\u0041`), and `\'` and `\n` in single-quoted strings. | [1.3](../../../language.md#13-lexical-elements) |
| 006-lex-minus-and-skip | `1 -2` after a value is subtraction, `-5` after a comma is a number, and an unknown character (`;`) is skipped. | [1.3](../../../language.md#13-lexical-elements) |
| 007-statement-multiline-ternary | Ternaries split across lines, with `?` or `:` at a line start or `:` at a line end, stay one statement. (known failing: `a ? b :` then a newline ends the statement) | [1.4](../../../language.md#14-statements) |
| 008-expr-precedence-and-keys | Operator precedence and associativity, optional and trailing commas, and object keys written as names, strings, numbers, `$` names (the `$` is dropped), and component names. | [1.5](../../../language.md#15-expressions) |
| 009-member-digits-field | `m[1][0]` indexes, `o.0` reads the key "0", and `m.0` on an array plucks. | [1.5](../../../language.md#15-expressions), [3.3](../../../language.md#33-member-access-and-pluck) |
| 010-roundtrip-tree | The rendered tree serializes to text and parses back to the same `root`. | [9.2](../../../language.md#92-serialization) |
