import { useRef } from "react";

import { fetchLLM, type FetchLLMOptions } from "./fetchLLM";
import type { ChatLLM } from "./types";

/**
 * React hook around {@link fetchLLM}. Returns a single, stable `ChatLLM` that
 * persists for the component's lifetime
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
