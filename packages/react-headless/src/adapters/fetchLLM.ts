import { observability } from "@openuidev/observability";
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
  /** Extra fields merged into the request body (e.g. `model`) */
  body?: Record<string, unknown>;
}

/**
 * Generic HTTP-based LLM adapter. POSTs an AG-UI `RunAgentInput`-shaped body
 * (`{ threadId, runId, messages, tools, context }`, messages in the chosen wire
 * format) to `url` and returns the streaming `Response` for downstream processing.
 *
 * Every send is reported to `@openuidev/observability` — The `runId` correlates them.
 */
export function fetchLLM({
  url,
  streamAdapter,
  messageFormat = identityMessageFormat,
  headers,
  fetch: customFetch,
  body,
}: FetchLLMOptions): ChatLLM {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);
  return {
    send: ({ threadId, messages, signal }) => {
      const runId = crypto.randomUUID();
      observability.info({ kind: "fetchLLM:request", requestId: runId, url, threadId });

      return fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          ...body,
          tools: [],
          context: [],
          threadId,
          runId,
          messages: messageFormat.toApi(messages),
        }),
        signal,
      }).then(
        async (response) => response,
        (error: unknown) => {
          throw error;
        },
      );
    },
    streamProtocol: streamAdapter,
  };
}
