import { AGUIEvent, StreamProtocolAdapter } from "../../types";

export const agUIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      // Accumulate across reads: a single SSE `data:` line (e.g. a multi-KB
      // artifact function_call_arguments payload) can span several network
      // reads. Splitting each chunk independently tears that line in two and
      // drops it on JSON.parse. Hold the trailing partial line until the next
      // read; on done, flush whatever remains.
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = done ? "" : (lines.pop() ?? "");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const event = JSON.parse(data);
          yield event as AGUIEvent;
        } catch (e) {
          console.error("Failed to parse SSE event", e);
        }
      }

      if (done) break;
    }
  },
});
