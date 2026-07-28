"use client";

import { observability } from "@openuidev/observability";
import { useEffect, useState } from "react";
import { CreditsModal, type CreditsModalProps } from "./CreditsModal";

export type OpenUICreditsModalProps = Omit<CreditsModalProps, "open" | "onOpenChange">;

/**
 * Drop-in credits notice: listens for 429 errors on the observability bus and
 * shows the modal. Render it once (dev-only) alongside your chat surface.
 */
export function OpenUICreditsModal(props: OpenUICreditsModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const remove = observability.listen("error", (event) => {
      if ((event.detail as { status?: unknown }).status === 429) setOpen(true);
    });

    return () => {
      remove();
    };
  }, []);

  return <CreditsModal open={open} onOpenChange={setOpen} {...props} />;
}
