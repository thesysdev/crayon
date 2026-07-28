import { observability, ObservabilityLevel, toErrorInfo } from "@openuidev/observability";

import { identityMessageFormat, type MessageFormat } from "../types/messageFormat";
import type { StreamProtocolAdapter } from "../types/stream";
import type { ChatLLM, Message } from "./types";

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
  /** Receives the run's thread/run ids and the canonical messages; returns 
   *  the JSON-serializable request body. 
   */
  buildBody?: (params: { threadId: string; runId: string; messages: Message[] }) => unknown;
}

// Observability level for a response's HTTP status: a rate limit surfaces as an
// error (it feeds the dev credits notice), server errors are errors, other
// client errors are warnings, and 2xx is info.
function levelForStatus(status: number): ObservabilityLevel {
  return status >= 400 ? "error" : "info";
}

/**
 * Generic HTTP-based LLM adapter. POSTs an AG-UI `RunAgentInput`-shaped body
 * (`{ threadId, runId, messages, tools, context }`, messages in the chosen wire
 * format) to `url` and returns the streaming `Response` for downstream processing.
 *
 * Every send is reported to `@openuidev/observability` — an `llm:request` on
 * start, then an `llm:response`/`llm:error` (level varied by status) on the
 * reply, or an `llm:error` on network failure. The `runId` correlates them.
 */
export function fetchLLM({
  url,
  streamAdapter,
  messageFormat = identityMessageFormat,
  headers,
  fetch: customFetch,
  buildBody,
}: FetchLLMOptions): ChatLLM {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);
  return {
    send: ({ threadId, messages, signal }) => {
      const runId = crypto.randomUUID();
      observability.info({ kind: "fetchLLM:request", requestId: runId, url });

      const body = buildBody
        ? buildBody({ threadId, runId, messages })
        : { threadId, runId, messages: messageFormat.toApi(messages), tools: [], context: [] };
      return fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
        signal,
      }).then(
        (response) => {
          observability(levelForStatus(response.status), {
            kind: response.ok ? "fetchLLM:response" : "fetchLLM:error",
            requestId: runId,
            url,
            status: response.status,
            ok: response.ok,
          });
          return response;
        },
        (error: unknown) => {
          observability.error({
            kind: "fetchLLM:error",
            requestId: runId,
            url,
            error: toErrorInfo(error),
          });
          throw error;
        },
      );
    },
    streamProtocol: streamAdapter,
  };
}
