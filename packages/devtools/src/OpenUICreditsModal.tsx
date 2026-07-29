"use client";

import { observability } from "@openuidev/observability";
import type { CSSProperties, ReactNode } from "react";
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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button
            type="button"
            aria-label="Close"
            style={styles.close}
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.action}
            onClick={() => window.open(billingUrl, "_blank", "noopener,noreferrer")}
          >
            {icon ? <span style={styles.actionIcon}>{icon}</span> : null}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.5)",
    // Max 32-bit signed int — sit above any app chrome.
    zIndex: 2147483647,
  },
  dialog: {
    boxSizing: "border-box",
    width: "min(420px, calc(100vw - 32px))",
    borderRadius: 12,
    border: "1px solid #e4e4e7",
    background: "#ffffff",
    color: "#18181b",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
    padding: 20,
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  close: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "#71717a",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
  message: {
    margin: "12px 0 0",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#52525b",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  action: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    borderRadius: 8,
    background: "#18181b",
    color: "#ffffff",
    padding: "8px 14px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  actionIcon: {
    display: "inline-flex",
    alignItems: "center",
  },
} satisfies Record<string, CSSProperties>;
