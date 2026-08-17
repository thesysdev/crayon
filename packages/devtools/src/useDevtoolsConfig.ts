import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "openui.devtools.config";

/** Add a boolean here when a new drawer setting should persist. */
const BOOLEAN_KEYS = ["autoOpen", "onlyErrors"] as const;

export type DevtoolsConfig = { [K in (typeof BOOLEAN_KEYS)[number]]: boolean };

function readStored(): Partial<DevtoolsConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    const config: Partial<DevtoolsConfig> = {};
    for (const key of BOOLEAN_KEYS) {
      if (typeof record[key] === "boolean") config[key] = record[key];
    }
    return config;
  } catch {
    return {};
  }
}

function writeStored(patch: Partial<DevtoolsConfig>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), ...patch }));
  } catch {
    // private mode / quota / disabled storage
  }
}

function merge(base: DevtoolsConfig, patch: Partial<DevtoolsConfig>): DevtoolsConfig {
  const next = { ...base };
  for (const key of BOOLEAN_KEYS) {
    const value = patch[key];
    if (typeof value === "boolean") next[key] = value;
  }
  return next;
}

/**
 * Drawer checkbox state as one object, restored from localStorage.
 * `setConfig({ autoOpen: false })` patches and persists; add keys to
 * `BOOLEAN_KEYS` when a new setting should survive refresh.
 */
export function useDevtoolsConfig(defaults: DevtoolsConfig) {
  const [config, setConfigState] = useState(() => merge(defaults, readStored()));
  const configRef = useRef(config);
  configRef.current = config;

  // After SSR hydration the lazy initializer reused the server snapshot
  // (prop defaults). Re-read storage so a previous session's checkboxes win.
  useEffect(() => {
    const stored = readStored();
    setConfigState((prev) => {
      const next = merge(prev, stored);
      configRef.current = next;
      return next;
    });
  }, []);

  const setConfig = useCallback((patch: Partial<DevtoolsConfig>) => {
    setConfigState((prev) => {
      const next = merge(prev, patch);
      configRef.current = next;
      writeStored(patch);
      return next;
    });
  }, []);

  return { config, setConfig, configRef };
}
