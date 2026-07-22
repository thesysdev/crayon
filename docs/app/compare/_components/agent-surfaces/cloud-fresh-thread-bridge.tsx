"use client";

import { useThreadList } from "@openuidev/react-headless";
import { useEffect, useRef } from "react";

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

    switchToNewThread();
  }, [switchToNewThread]);

  return null;
}
