"use client";

import { useEffect, type RefObject } from "react";

/** Whether an element is currently rendered on screen enough to receive focus. */
const canFocus = (el: HTMLElement) =>
  typeof el.checkVisibility === "function" ? el.checkVisibility() : el.getClientRects().length > 0;

export interface UseAutoFocusOptions {
  /** @default true */
  enabled?: boolean;
  /** When this value changes, the element is re-focused */
  focusKey?: unknown;
}

/**
 * Focuses a ref'd element on mount, whenever `focusKey` changes, and whenever
 * `enabled` flips back to `true` — but only while the element is actually on
 * screen.
 */
export const useAutoFocus = <T extends HTMLElement | null>(
  ref: RefObject<T>,
  { enabled = true, focusKey }: UseAutoFocusOptions = {},
) => {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || !canFocus(el)) return;
    el.focus();
  }, [ref, enabled, focusKey]);
};
