"use client";

import { Callout } from "@openuidev/react-ui";

export interface ToastItem {
  id: string;
  text: string;
  /** Loading toasts get a spinner; they disappear when the state resolves. */
  spinning?: boolean;
}

/**
 * Purely derived toast stack — callers pass the currently active long-running
 * tasks and the stack reflects them; no timers or imperative queue needed.
 */
export function Toasts({ items }: { items: ToastItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((t) => (
        <Callout
          key={t.id}
          variant="info"
          description={
            <span className="toast-body">
              {t.spinning && <span className="toast-spinner" aria-hidden />}
              {t.text}
            </span>
          }
        />
      ))}
    </div>
  );
}
