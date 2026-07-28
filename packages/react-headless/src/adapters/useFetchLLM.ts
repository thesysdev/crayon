import { useRef } from "react";

import { fetchLLM, type FetchLLMOptions } from "./fetchLLM";
import type { ChatLLM } from "./types";

/**
 * React hook around {@link fetchLLM}. Returns a single, stable `ChatLLM` that
 * persists for the component's lifetime, so consumers don't manage the instance
 * themselves — no `useState(() => fetchLLM(...))` or ref boilerplate.
 *
 * `options` are read fresh on every `send`, so a `buildBody` (or `headers`,
 * `url`, …) that closes over current props/state stays up to date without extra
 * refs. The instance identity is stable across renders — `AgentInterface` never
 * sees a "new" LLM — and the stream adapter is captured once (adapters are
 * stateless parsers).
 *
 * @example
 * const llm = useFetchLLM({
 *   url: "/api/chat",
 *   streamAdapter: openAIResponsesAdapter(),
 *   buildBody: ({ threadId, messages }) => ({ threadId, input: messages, model }),
 * });
 */
export function useFetchLLM(options: FetchLLMOptions): ChatLLM {
  // Keep the latest options so `send` never closes over stale values.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const llmRef = useRef<ChatLLM | null>(null);
  return (llmRef.current ??= {
    send: (params) => fetchLLM(optionsRef.current).send(params),
    streamProtocol: options.streamAdapter,
  });
}
