import type { Context, Tool } from "@ag-ui/core";
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
  /** Frontend tool definitions advertised to the agent (AG-UI `RunAgentInput.tools`). Defaults to `[]`. */
  tools?: Tool[];
  /** Contextual data passed to the agent (AG-UI `RunAgentInput.context`). Defaults to `[]`. */
  context?: Context[];
  /** Extra headers merged into the request. */
  headers?: Record<string, string>;
  /** Override fetch implementation (for tests, custom auth wrappers, etc.). */
  fetch?: typeof fetch;
}

/**
 * Generic HTTP-based LLM adapter. POSTs an AG-UI `RunAgentInput`-shaped body
 * (`{ threadId, runId, messages, tools, context }`, messages in the chosen wire
 * format) to `url` and returns the streaming `Response` for downstream processing.
 *
 * The fields the {@link ChatLLM} `send` contract doesn't carry are defaulted
 * here so the body satisfies a spec-compliant AG-UI agent: a fresh `runId` is
 * generated per send, and `tools`/`context` default to `[]` (override via options).
 */
export function fetchLLM({
  url,
  streamAdapter,
  messageFormat = identityMessageFormat,
  tools = [],
  context = [],
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
        body: JSON.stringify({
          threadId,
          runId: crypto.randomUUID(),
          messages: wire,
          tools,
          context,
        }),
        signal,
      });
    },
    streamProtocol: streamAdapter,
  };
}
