"use client";

import type { ChatLLM } from "@openuidev/react-ui";
import { useEffect, useRef } from "react";
import { observeLLM, type LLMObserver } from "./observeLLM";

/**
 * Attach an `observeLLM` subscription to the component lifecycle: subscribe
 * when `llm` becomes available, restore the original `send` on unmount or
 * when `llm` changes. The latest observer callbacks are always invoked
 * without re-wrapping `llm.send` on every render.
 */
export function useLLMObserver(llm: ChatLLM | undefined, observer: LLMObserver): void {
  const observerRef = useRef(observer);
  observerRef.current = observer;

  useEffect(() => {
    if (!llm) return;

    return observeLLM(llm, {
      onRequestStart: () => observerRef.current.onRequestStart?.(),
      onResponseError: (response) => observerRef.current.onResponseError?.(response),
    });
  }, [llm]);
}
