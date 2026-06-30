/**
 * Shared line iterator for streamed HTTP responses.
 *
 * Buffers the leftover partial line between network chunks so an SSE event (or
 * NDJSON record) split across two `reader.read()` results is reassembled rather
 * than silently dropped. The reference implementation lived in
 * `openai-readable-stream.ts`; this extracts it so `ag-ui.ts` and
 * `openai-completions.ts` share the same correct buffering.
 *
 * Yields each complete line verbatim (caller strips any `data: ` SSE prefix);
 * blank lines are skipped. The trailing buffered line is flushed on stream end.
 *
 * @internal
 */
export async function* sseLineIterator(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the straddling partial line (everything after the last "\n") for the
    // next chunk; it may be completed by the bytes that follow.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }

  // Flush the tail — a stream that ends without a trailing newline still has a
  // complete final line sitting in the buffer.
  if (buffer.trim()) yield buffer;
}
