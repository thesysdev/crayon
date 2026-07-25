"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

// The Free-tier "Usage policy" hint. A Radix Tooltip does not open when nested
// inside the Radix Select dropdown (the Select intercepts the pointer events the
// tooltip relies on), so this is a small state-driven tooltip portaled to the
// body — it isn't clipped by the dropdown's overflow and opens on plain hover.
export function UsagePolicy() {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  return (
    <span
      onMouseEnter={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setAnchor({ top: rect.top, left: rect.right });
      }}
      onMouseLeave={() => setAnchor(null)}
      onClick={(event) => event.stopPropagation()}
      className="flex cursor-default items-center gap-1 text-xs font-normal text-gray-400"
    >
      <Info className="h-3 w-3" />
      Usage policy
      {anchor && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              // Positioned relative to the trigger; anchor coords are dynamic so
              // stay inline. Everything else is Tailwind arbitrary values pointing
              // at the @openuidev design tokens (same tokens globals.css uses for
              // callouts/dialogs), so the tooltip is theme-aware and consistent.
              style={{ position: "fixed", top: anchor.top - 8, left: anchor.left }}
              className="z-[100000] w-[280px] -translate-x-full -translate-y-full rounded-[var(--openui-radius-l)] border border-[var(--openui-border-interactive)] bg-[var(--openui-foreground)] p-[var(--openui-space-m)] text-left shadow-[var(--openui-shadow-m)]"
            >
              <div className="[font:var(--openui-text-label-default)] font-semibold! text-[color:var(--openui-text-neutral-primary)]">
                Usage policy
              </div>
              <p className="mt-[var(--openui-space-2xs)] [font:var(--openui-text-body-sm)] tracking-[var(--openui-text-body-sm-letter-spacing)] text-[color:var(--openui-text-neutral-secondary)]">
                Data from free models may be used for training. Rate limits apply.
              </p>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
