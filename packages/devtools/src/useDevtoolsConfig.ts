import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "openui.devtools.config";

interface DevtoolsConfig {
  autoOpen: boolean;
  onlyErrors: boolean;
}

function readStored(): Partial<DevtoolsConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    const config: Partial<DevtoolsConfig> = {};
    if (typeof record["autoOpen"] === "boolean") config.autoOpen = record["autoOpen"];
    if (typeof record["onlyErrors"] === "boolean") config.onlyErrors = record["onlyErrors"];
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

/** Stored config for the OpenUI Devtools drawer.
 * This hook reads and writes the config to localStorage.
 */
export function useDevtoolsConfig(defaults: DevtoolsConfig) {
  const [autoOpen, setAutoOpenState] = useState(() => readStored().autoOpen ?? defaults.autoOpen);
  const [onlyErrors, setOnlyErrorsState] = useState(
    () => readStored().onlyErrors ?? defaults.onlyErrors,
  );

  const autoOpenRef = useRef(autoOpen);
  autoOpenRef.current = autoOpen;

  // After SSR hydration the lazy initializer reused the server snapshot
  // (prop defaults). Re-read storage so a previous session's checkboxes win.
  useEffect(() => {
    const stored = readStored();
    if (typeof stored.autoOpen === "boolean") {
      setAutoOpenState(stored.autoOpen);
      autoOpenRef.current = stored.autoOpen;
    }
    if (typeof stored.onlyErrors === "boolean") setOnlyErrorsState(stored.onlyErrors);
  }, []);

  const setAutoOpen = useCallback((next: boolean) => {
    setAutoOpenState(next);
    autoOpenRef.current = next;
    writeStored({ autoOpen: next });
  }, []);

  const setOnlyErrors = useCallback((next: boolean) => {
    setOnlyErrorsState(next);
    writeStored({ onlyErrors: next });
  }, []);

  return { autoOpen, onlyErrors, setAutoOpen, setOnlyErrors, autoOpenRef };
}
