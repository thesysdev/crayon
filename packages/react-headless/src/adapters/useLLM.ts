import { useRef } from "react";
import { createFetchLLM, type FetchLLMOptions } from "./fetchLLM";
import type { ChatLLM } from "./types";

/**
 * React wrapper around `fetchLLM`.
 *
 * The returned `ChatLLM` keeps a stable identity while each request reads the
 * latest options, allowing request bodies to reference live props and state.
 */
export function useLLM(options: FetchLLMOptions): ChatLLM {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const llmRef = useRef<ChatLLM | null>(null);
  if (!llmRef.current) {
    llmRef.current = createFetchLLM(() => optionsRef.current);
  }

  llmRef.current.streamProtocol = options.streamAdapter;
  return llmRef.current;
}
