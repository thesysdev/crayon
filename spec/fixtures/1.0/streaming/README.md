# streaming

These cases protect a client from giving a different result when text arrives in chunks than when it arrives at once. Each case gives `chunks.json`; the result after the last chunk and the end of the stream must match `expected.json` and a batch parse of the joined chunks. They cover [language.md section 4](../../../language.md#4-streaming) and [Appendix A](../../../language.md#appendix-a-a-worked-streamed-example). Numbers 002 and 004 are not used.

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-worked-example | The Appendix A example with `Stack` as the root: chunks split names and calls mid-token, and the final page shows the heading and two Metrics with no errors. | [4](../../../language.md#4-streaming), [Appendix A](../../../language.md#appendix-a-a-worked-streamed-example) |
| 003-multiline-ternary-across-chunks | A ternary whose `?` and `:` lines arrive in later chunks: the statement does not complete early, and the Text shows "none". | [4](../../../language.md#4-streaming), [1.4](../../../language.md#14-statements) |
| 005-fence-arrives-late | Prose arrives first, then a fence: the client parses again from the start, and only the fenced program renders. | [4](../../../language.md#4-streaming), [1.2](../../../language.md#12-source-text) |
| 006-truncated-string-escape | The stream ends right after a `\` inside a string: a `\` is added before the string is closed, the Text shows `a\`, and `incomplete` is true. | [4](../../../language.md#4-streaming), [1.3](../../../language.md#13-lexical-elements) |
