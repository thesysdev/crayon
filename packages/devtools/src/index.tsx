"use client";

import { Button, type ChatLLM } from "@openuidev/react-ui";
import { Modal } from "@openuidev/react-ui/Modal";
import { useEffect, useState } from "react";

export interface OpenUICreditsModalProps {
  billingUrl?: string;
  llm?: ChatLLM;
}

export function OpenUICreditsModal({
  billingUrl = "https://console.thesys.dev/billing",
  llm,
}: OpenUICreditsModalProps) {
  const [activeNotice, setActiveNotice] = useState<"billing-credits-required" | null>(null);
  const billingCreditsRequired = activeNotice === "billing-credits-required";

  useEffect(() => {
    if (!llm) return;

    return observeLLM(llm, {
      onRequestStart: () => setActiveNotice(null),
      onResponseError: (response) => {
        if (response.status === 429) setActiveNotice("billing-credits-required");
      },
    });
  }, [llm]);

  useEffect(() => {
    document.body.classList.toggle(
      "openui-devtools--billing-credits-required",
      billingCreditsRequired,
    );
    return () => document.body.classList.remove("openui-devtools--billing-credits-required");
  }, [billingCreditsRequired]);

  return (
    <>
      <style>{`.openui-devtools--billing-credits-required .openui-agent-thread-error { display: none; }`}</style>
      <Modal
        open={billingCreditsRequired}
        onOpenChange={(open) => setActiveNotice(open ? "billing-credits-required" : null)}
        size="sm"
        title="Add credits to keep going"
      >
        <p
          style={{
            margin: 0,
            color: "var(--openui-text-neutral-secondary)",
            font: "var(--openui-text-body-default)",
            letterSpacing: "var(--openui-text-body-default-letter-spacing)",
          }}
        >
          Looks like this workspace is out of OpenUI Cloud credits. Purchase credits to keep
          testing, then try your request again.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--openui-space-s)",
            marginTop: "var(--openui-space-xs)",
          }}
        >
          <Button
            onClick={() => window.open(billingUrl, "_blank", "noopener,noreferrer")}
            size="medium"
            type="button"
            variant="primary"
          >
            Purchase credits
          </Button>
        </div>
      </Modal>
    </>
  );
}

export interface LLMDevToolsObserver {
  onRequestStart?: () => void;
  onResponseError?: (response: Response) => void;
}

export function observeLLM(llm: ChatLLM, observer: LLMDevToolsObserver): () => void {
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
