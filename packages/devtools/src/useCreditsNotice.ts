"use client";

import type { ChatLLM } from "@openuidev/react-ui";
import { useState } from "react";
import { useLLMObserver } from "./useLLMObserver";

export interface CreditsNotice {
  /** True after a request failed with HTTP 429; reset when the next request starts. */
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * Track whether the workspace ran out of OpenUI Cloud credits. State only —
 * render it however fits the app (the packaged `CreditsModal`, a toast, a
 * banner, …).
 */
export function useCreditsNotice(llm?: ChatLLM): CreditsNotice {
  const [open, setOpen] = useState(false);

  useLLMObserver(llm, {
    onRequestStart: () => setOpen(false),
    onResponseError: (response) => {
      if (response.status === 429) setOpen(true);
    },
  });

  return { open, setOpen };
}
