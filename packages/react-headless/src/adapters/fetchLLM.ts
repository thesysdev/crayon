import { type MessageFormat, identityMessageFormat } from "../types/messageFormat";
import type { StreamProtocolAdapter } from "../types/stream";
import type { ChatLLM } from "./types";
import { Message } from "./types";

export interface BuildLLMRequestBodyParams {
  threadId: string;
  /** Canonical messages from the ChatLLM send call. */
  messages: Message[];
  /** Convert any selected canonical messages with the configured message format. */
  formatMessages: (messages: Message[]) => unknown;
}

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
  /** Override the JSON request body. Defaults to an AG-UI RunAgentInput-shaped body. */
  buildBody?: (params: BuildLLMRequestBodyParams) => unknown;
  /** Called immediately before the request starts. */
  onRequestStart?: () => void;
  /** Called with a clone of any non-2xx response before it is returned. */
  onResponseError?: (response: Response) => void | Promise<void>;
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
export function fetchLLM({ ...options }: FetchLLMOptions): ChatLLM {
  return createFetchLLM(() => options);
}

/** @internal Shared by `fetchLLM` and the React `useLLM` hook. */
export function createFetchLLM(getOptions: () => FetchLLMOptions): ChatLLM {
  const initialOptions = getOptions();
  return {
    send: async ({ threadId, messages, signal }) => {
      const {
        url,
        messageFormat = identityMessageFormat,
        headers,
        fetch: customFetch,
        buildBody,
        onRequestStart,
        onResponseError,
      } = getOptions();
      const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);
      const formatMessages = (selectedMessages: Message[]) => messageFormat.toApi(selectedMessages);
      const body = buildBody
        ? buildBody({ threadId, messages, formatMessages })
        : {
            threadId,
            runId: crypto.randomUUID(),
            messages: formatMessages(messages),
            tools: [],
            context: [],
          };

      onRequestStart?.();
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) await onResponseError?.(response.clone());
      return response;
    },
    streamProtocol: initialOptions.streamAdapter,
  };
}
