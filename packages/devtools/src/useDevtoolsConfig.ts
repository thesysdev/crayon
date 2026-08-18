import { useCallback, useEffect, useRef, useState } from "react";
import type { ColorScheme } from "./theme";

const STORAGE_KEY = "openui.devtools.config";

export type DevtoolsConfig = {
  autoOpen: boolean;
  onlyErrors: boolean;
  theme: ColorScheme;
  /** Set once the Paste help dialog has been dismissed, so it only greets once. */
  helpSeen: boolean;
};

function isColorScheme(value: unknown): value is ColorScheme {
  return value === "light" || value === "dark";
}

function sanitize(patch: Partial<DevtoolsConfig>): Partial<DevtoolsConfig> {
  const next: Partial<DevtoolsConfig> = {};
  if (typeof patch.autoOpen === "boolean") next.autoOpen = patch.autoOpen;
  if (typeof patch.onlyErrors === "boolean") next.onlyErrors = patch.onlyErrors;
  if (isColorScheme(patch.theme)) next.theme = patch.theme;
  if (typeof patch.helpSeen === "boolean") next.helpSeen = patch.helpSeen;
  return next;
}

function readStored(): Partial<DevtoolsConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return sanitize(parsed as Partial<DevtoolsConfig>);
  } catch {
    return {};
  }
}

function writeStored(patch: Partial<DevtoolsConfig>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readStored(), ...sanitize(patch) }),
    );
  } catch {
    // private mode / quota / disabled storage
  }
}

function merge(base: DevtoolsConfig, patch: Partial<DevtoolsConfig>): DevtoolsConfig {
  return { ...base, ...sanitize(patch) };
}

/**
 * Drawer settings as one object, restored from localStorage.
 * `setConfig({ autoOpen: false })` patches and persists.
 */
export function useDevtoolsConfig(defaults: DevtoolsConfig) {
  const [config, setConfigState] = useState(() => merge(defaults, readStored()));
  const configRef = useRef(config);
  configRef.current = config;

  // After SSR hydration the lazy initializer reused the server snapshot
  // (prop defaults). Re-read storage so a previous session's settings win.
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
