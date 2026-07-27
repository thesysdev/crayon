import type { ChatLLM } from "@openuidev/react-ui";

export interface LLMObserver {
  /** Called immediately before each request starts. */
  onRequestStart?: () => void;
  /** Called with a clone of any non-2xx response before it is returned. */
  onResponseError?: (response: Response) => void;
}

/**
 * Wrap `llm.send` so every request reports to `observer`. Framework-free —
 * usable for logging, metrics, or custom error UIs outside React.
 *
 * Returns an unsubscribe that restores the original `send`; if something else
 * wrapped `send` after this observer, the unsubscribe leaves it untouched.
 */
export function observeLLM(llm: ChatLLM, observer: LLMObserver): () => void {
  const originalSend = llm.send;
  const observedSend: ChatLLM["send"] = async (params) => {
    observer.onRequestStart?.();
    const response = await originalSend(params);
    if (!response.ok) observer.onResponseError?.(response.clone());
    return response;
  };
  llm.send = observedSend;

  return () => {
    if (llm.send === observedSend) llm.send = originalSend;
  };
}
