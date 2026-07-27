"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/models";

// Model choice persists in localStorage: a global default for new threads,
// plus a per-thread override — the model is thread config, so returning to a
// thread restores the model it was explicitly switched to (the active thread
// id reaches the hook via ThreadIdBridge in cloud-chat.tsx).
const MODEL_STORAGE_KEY = "openui-cloud:selected-model";
const THREAD_MODELS_STORAGE_KEY = "openui-cloud:thread-models";

function isKnownModel(id: string | null | undefined): id is string {
  return !!id && MODEL_OPTIONS.some((option) => option.id === id);
}

function readThreadModels(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(THREAD_MODELS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Ignore storage failures (private mode, quota, disabled storage).
  }
  return {};
}

export function getPersistedModel(threadId?: string | null): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  if (threadId) {
    const perThread = readThreadModels()[threadId];
    if (isKnownModel(perThread)) return perThread;
  }
  try {
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (isKnownModel(saved)) return saved;
  } catch {
    // Ignore storage failures (private mode, quota, disabled storage).
  }
  return DEFAULT_MODEL;
}

// Like useState, but the value is remembered across refreshes — and scoped to
// the active thread: an explicit choice made inside a thread pins that thread;
// threads without a pin follow the global default.
export function usePersistedModel(
  threadId?: string | null,
): readonly [string, (model: string) => void] {
  const [model, setModel] = useState(DEFAULT_MODEL);

  // Re-resolve on thread switch: the thread's pinned model wins, else the
  // global default.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModel(getPersistedModel(threadId));
  }, [threadId]);

  // Update the model, save it as the global default, and pin it to the
  // active thread when there is one.
  const selectModel = useCallback(
    (next: string) => {
      setModel(next);
      try {
        window.localStorage.setItem(MODEL_STORAGE_KEY, next);
        if (threadId) {
          const map = readThreadModels();
          map[threadId] = next;
          window.localStorage.setItem(THREAD_MODELS_STORAGE_KEY, JSON.stringify(map));
        }
      } catch {
        // Ignore storage failures (private mode, quota, disabled storage).
      }
    },
    [threadId],
  );

  return [model, selectModel] as const;
}
