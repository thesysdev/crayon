"use client";

import { useThreadList } from "@openuidev/react-headless";
import { useEffect, useRef, useState } from "react";

const CLOUD_SELECTED_THREAD_STORAGE_KEY = "openui-cloud-selected-thread-id";

/**
 * Restores the Cloud thread selected in this tab after a page reload. The
 * comparison intentionally hides AgentInterface's sidebar, so the default
 * ThreadList cannot perform this selection for the user.
 */
export function CloudPersistedThreadBridge() {
  const threads = useThreadList((state) => state.threads);
  const isLoadingThreads = useThreadList((state) => state.isLoadingThreads);
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const loadThreads = useThreadList((state) => state.loadThreads);
  const selectThread = useThreadList((state) => state.selectThread);
  const [storedThreadId] = useState(readStoredThreadId);
  const sawInitialLoadRef = useRef(false);
  const restoreFinishedRef = useRef(false);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (isLoadingThreads) {
      sawInitialLoadRef.current = true;
      return;
    }
    if (!sawInitialLoadRef.current || restoreFinishedRef.current) return;

    restoreFinishedRef.current = true;
    if (!storedThreadId) return;

    if (threads.some((thread) => thread.id === storedThreadId)) {
      selectThread(storedThreadId);
    } else {
      removeStoredThreadId();
    }
  }, [isLoadingThreads, selectThread, storedThreadId, threads]);

  useEffect(() => {
    if (!restoreFinishedRef.current) return;

    if (selectedThreadId) {
      storeThreadId(selectedThreadId);
    } else {
      removeStoredThreadId();
    }
  }, [selectedThreadId]);

  return null;
}

function readStoredThreadId(): string | null {
  try {
    return sessionStorage.getItem(CLOUD_SELECTED_THREAD_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeThreadId(threadId: string): void {
  try {
    sessionStorage.setItem(CLOUD_SELECTED_THREAD_STORAGE_KEY, threadId);
  } catch {
    // Persistence is best-effort when browser storage is unavailable.
  }
}

function removeStoredThreadId(): void {
  try {
    sessionStorage.removeItem(CLOUD_SELECTED_THREAD_STORAGE_KEY);
  } catch {
    // Persistence is best-effort when browser storage is unavailable.
  }
}
