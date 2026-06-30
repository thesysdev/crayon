import { AGUIEvent, StreamProtocolAdapter } from "../../types";
import { sseLineIterator } from "./_shared/sseLines";

export const agUIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    for await (const line of sseLineIterator(response)) {
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
  },
});
