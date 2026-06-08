"use client";

import { Download, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import {
  DEMO_CREDITS_EXHAUSTED_MESSAGE,
  DEMO_CREDITS_LOCAL_COMMANDS,
} from "@/lib/demo-credits";
import "./DemoCreditsDialog.css";

type DemoCreditsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function DemoCreditsDialog({ open, onClose }: DemoCreditsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, open]);

  if (!open) return null;

  return (
    <div className="demo-credits-dialog-overlay" onClick={onClose}>
      <section
        className="demo-credits-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-credits-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="demo-credits-dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className="demo-credits-dialog-icon">
          <Download size={18} />
        </div>

        <h2 id="demo-credits-dialog-title">Hosted demo credits are recharging</h2>
        <p>{DEMO_CREDITS_EXHAUSTED_MESSAGE}</p>

        <pre className="demo-credits-dialog-commands">
          <code>{DEMO_CREDITS_LOCAL_COMMANDS.join("\n")}</code>
        </pre>

        <div className="demo-credits-dialog-actions">
          <a
            className="demo-credits-dialog-primary"
            href="https://github.com/thesysdev/openui"
            target="_blank"
            rel="noreferrer"
          >
            <Download size={14} />
            Download repo
          </a>
          <button className="demo-credits-dialog-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
