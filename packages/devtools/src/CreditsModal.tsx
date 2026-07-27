"use client";

import { Button } from "@openuidev/react-ui";
import { Modal } from "@openuidev/react-ui/Modal";

export interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the action button sends the user. */
  billingUrl?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
}

/**
 * Presentational "out of credits" modal. Pair it with `useCreditsNotice`, or
 * drive `open` from any state of your own.
 */
export function CreditsModal({
  open,
  onOpenChange,
  billingUrl = "https://console.thesys.dev/billing",
  title = "Add credits to keep going",
  message = "Looks like this workspace is out of OpenUI Cloud credits. Purchase credits to keep testing, then try your request again.",
  actionLabel = "Purchase credits",
}: CreditsModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title={title}>
      <p
        style={{
          margin: 0,
          color: "var(--openui-text-neutral-secondary)",
          font: "var(--openui-text-body-default)",
          letterSpacing: "var(--openui-text-body-default-letter-spacing)",
        }}
      >
        {message}
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
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}
