"use client";

import { Callout } from "@openuidev/react-ui";
import styles from "@paste/paste.module.css";

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
    <div className={styles.toastStack} role="status" aria-live="polite">
      {items.map((t) => (
        <Callout
          key={t.id}
          variant="info"
          description={
            <span className={styles.toastBody}>
              {t.spinning && <span className={styles.toastSpinner} aria-hidden />}
              {t.text}
            </span>
          }
        />
      ))}
    </div>
  );
}
