"use client";

import type { ChatLLM } from "@openuidev/react-ui";
import { useEffect } from "react";
import { CreditsModal } from "./CreditsModal";
import { useCreditsNotice } from "./useCreditsNotice";

const HIDE_THREAD_ERROR_CLASS = "openui-devtools--billing-credits-required";

export interface OpenUICreditsModalProps {
  /** The app's ChatLLM; its requests are observed for 429 responses. */
  llm: ChatLLM;
  billingUrl?: string;
  /**
   * While the modal is open, hide AgentInterface's inline thread error so the
   * failure isn't reported twice (default true).
   */
  hideThreadError?: boolean;
}

/**
 * Drop-in credits notice: `useCreditsNotice` wired to `CreditsModal`.
 * Development-time affordance — render it conditionally, e.g. behind
 * `process.env.NODE_ENV === "development"` with a dynamic import.
 */
export function OpenUICreditsModal({
  llm,
  billingUrl,
  hideThreadError = true,
}: OpenUICreditsModalProps) {
  const { open, setOpen } = useCreditsNotice(llm);
  const hideErrorNow = hideThreadError && open;

  useEffect(() => {
    if (!hideErrorNow) return;
    document.body.classList.add(HIDE_THREAD_ERROR_CLASS);
    return () => document.body.classList.remove(HIDE_THREAD_ERROR_CLASS);
  }, [hideErrorNow]);

  return (
    <>
      {hideThreadError ? (
        <style>{`.${HIDE_THREAD_ERROR_CLASS} .openui-agent-thread-error { display: none; }`}</style>
      ) : null}
      <CreditsModal open={open} onOpenChange={setOpen} billingUrl={billingUrl} />
    </>
  );
}
