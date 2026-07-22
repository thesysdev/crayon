"use client";

import { useThreadList } from "@openuidev/react-headless";
import { useEffect, useRef } from "react";

const LEGACY_SELECTED_THREAD_STORAGE_KEY = "openui-cloud-selected-thread-id";

/**
 * Keeps the comparison demo page-scoped: every mount starts with a fresh Cloud
 * thread and never loads or restores a previously selected conversation.
 */
export function CloudFreshThreadBridge() {
  const switchToNewThread = useThreadList((state) => state.switchToNewThread);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    removeLegacyStoredThreadId();
    switchToNewThread();
  }, [switchToNewThread]);

  return null;
}

function removeLegacyStoredThreadId(): void {
  try {
    sessionStorage.removeItem(LEGACY_SELECTED_THREAD_STORAGE_KEY);
  } catch {
    // Browser storage may be unavailable; the active store is still reset.
  }
}
