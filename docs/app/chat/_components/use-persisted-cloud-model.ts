"use client";

import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/openui-cloud/models";
import { useCallback, useSyncExternalStore } from "react";

const MODEL_STORAGE_KEY = "openui-cloud:selected-model";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getPersistedCloudModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;

  try {
    const savedModel = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (savedModel && MODEL_OPTIONS.some((model) => model.id === savedModel)) {
      return savedModel;
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }

  return DEFAULT_MODEL;
}

export function usePersistedCloudModel(): readonly [string, (model: string) => void] {
  const selectedModel = useSyncExternalStore(
    subscribe,
    getPersistedCloudModel,
    () => DEFAULT_MODEL,
  );
  const setSelectedModel = useCallback((model: string) => {
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch {
      // Keep the in-page selection working even if persistence is unavailable.
    }

    listeners.forEach((listener) => listener());
  }, []);

  return [selectedModel, setSelectedModel] as const;
}
