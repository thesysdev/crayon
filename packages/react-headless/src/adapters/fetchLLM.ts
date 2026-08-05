import { observability, ObservabilityLevel, toErrorInfo } from "@openuidev/observability";
import { identityMessageFormat, type MessageFormat } from "../types/messageFormat";
import type { StreamProtocolAdapter } from "../types/stream";
import { getResponseErrorMessage } from "./httpError";
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

function levelForStatus(status: number): ObservabilityLevel {
  return status >= 400 ? "error" : "info";
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
        async (response) => {
          observability(levelForStatus(response.status), {
            kind: response.ok ? "fetchLLM:response" : "fetchLLM:error",
            requestId: runId,
            url,
            status: response.status,
            ok: response.ok,
            threadId,
            ...(!response.ok ? await buildObservabilityErrorDetail(response) : null),
          });
          return response;
        },
        (error: unknown) => {
          observability.error({
            kind: "fetchLLM:error",
            requestId: runId,
            url,
            error: toErrorInfo(error),
            threadId,
          });
          throw error;
        },
      );
    },
    streamProtocol: streamAdapter,
  };
}

async function buildObservabilityErrorDetail(response: Response) {
  const res = await response.clone().json();
  return {
    error: res?.error,
    ...(!res.message
      ? await getResponseErrorMessage(response).then((message) => ({ message }))
      : { message: res.message }),
  };
}
