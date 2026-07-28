"use client";

import { Button } from "@openuidev/react-ui";
import { Modal } from "@openuidev/react-ui/Modal";
import type { ReactNode } from "react";

export interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the action button links. */
  billingUrl?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  /** Optional leading icon for the action button (apps supply their own asset). */
  icon?: ReactNode;
}

const DEFAULTS = {
  billingUrl: "https://console.thesys.dev/billing",
  title: "Add credits to keep going",
  message:
    "Looks like this workspace is out of OpenUI Cloud credits. Purchase credits to keep testing, then try your request again. This notice is only shown in development.",
  actionLabel: "Purchase credits",
} as const;

/** Presentational credits/billing notice */
export function CreditsModal({
  open,
  onOpenChange,
  billingUrl = DEFAULTS.billingUrl,
  title = DEFAULTS.title,
  message = DEFAULTS.message,
  actionLabel = DEFAULTS.actionLabel,
  icon,
}: CreditsModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title={title}>
      <p>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button
          iconLeft={icon}
          onClick={() => window.open(billingUrl, "_blank", "noopener,noreferrer")}
          size="medium"
          variant="primary"
        >
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}
