"use client";

import { observability } from "@openuidev/observability";
import { Button } from "@openuidev/react-ui";
import { Modal } from "@openuidev/react-ui/Modal";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export interface OpenUICreditsModalProps {
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

/**
 * Drop-in credits notice: listens for 429 errors on the observability bus and
 * shows the modal. Render it once (dev-only) alongside your chat surface.
 */
export function OpenUICreditsModal({
  billingUrl = DEFAULTS.billingUrl,
  title = DEFAULTS.title,
  message = DEFAULTS.message,
  actionLabel = DEFAULTS.actionLabel,
  icon,
}: OpenUICreditsModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const remove = observability.listen("error", (event) => {
      if ((event.detail as { status?: unknown }).status === 429) setOpen(true);
    });

    return () => {
      remove();
    };
  }, []);

  return (
    <Modal open={open} onOpenChange={setOpen} size="sm" title={title}>
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
