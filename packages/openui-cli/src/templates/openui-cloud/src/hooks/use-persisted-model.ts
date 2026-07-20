"use client";

import { useCallback, useLayoutEffect, useState } from "react";

import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/models";

const STORAGE_KEY = "openui-cloud-selected-model";

export function usePersistedModel(): [string, (model: string) => void] {
  const [model, setModel] = useState(DEFAULT_MODEL);

  // Restore after mount: reading localStorage during render would make the
  // server-rendered HTML differ from the client's and break hydration.
  useLayoutEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && MODEL_OPTIONS.some((option) => option.id === stored)) {
        setModel(stored);
      }
    } catch {
      // localStorage unavailable; fall back to the default model
    }
  }, []);

  const selectModel = useCallback((next: string) => {
    setModel(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // persistence is best-effort; the in-memory selection still applies
    }
  }, []);

  return [model, selectModel];
}
