import { identityMessageFormat, type MessageFormat } from "../types/messageFormat";
import type { StreamProtocolAdapter } from "../types/stream";
import type { ChatLLM } from "./types";

export interface FetchLLMOptions {
  /** Endpoint that accepts POST'd messages and returns a streaming Response. */
  url: string;
  /** Stream protocol adapter for parsing the response body (e.g., agUIAdapter, openAIAdapter). */
  streamAdapter: StreamProtocolAdapter;
  /** Wire-format conversion for outgoing messages. Defaults to identity (canonical Message). */
  messageFormat?: MessageFormat;
  /** Extra headers merged into the request. */
  headers?: Record<string, string>;
  /** Override fetch implementation (for tests, custom auth wrappers, etc.). */
  fetch?: typeof fetch;
}

/**
 * Generic HTTP-based LLM adapter. POSTs `{ threadId, messages }` (in the chosen wire format)
 * to `url` and returns the streaming `Response` for downstream processing.
 */
export function fetchLLM({
  url,
  streamAdapter,
  messageFormat = identityMessageFormat,
  headers,
  fetch: customFetch,
}: FetchLLMOptions): ChatLLM {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);
  return {
    send: ({ threadId, messages, signal }) => {
      const wire = messageFormat.toApi(messages);
      return fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ threadId, messages: wire }),
        signal,
      });
    },
    streamProtocol: streamAdapter,
  };
}
