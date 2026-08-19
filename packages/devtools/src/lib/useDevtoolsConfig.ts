import { useCallback, useEffect, useRef, useState } from "react";
import type { ColorMode } from "../theme";

const STORAGE_KEY = "openui.devtools.config";

export type DevtoolsConfig = {
  autoOpen: boolean;
  onlyErrors: boolean;
  theme: ColorMode;
};

function isColorMode(value: unknown): value is ColorMode {
  return value === "light" || value === "dark";
}

function sanitize(patch: Partial<DevtoolsConfig>): Partial<DevtoolsConfig> {
  const next: Partial<DevtoolsConfig> = {};
  if (typeof patch.autoOpen === "boolean") next.autoOpen = patch.autoOpen;
  if (typeof patch.onlyErrors === "boolean") next.onlyErrors = patch.onlyErrors;
  if (isColorMode(patch.theme)) next.theme = patch.theme;
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
 *
 * Theme is arg-first: a passed `theme` wins over storage and is written
 * back so Settings stays in sync. With no arg, the stored theme is used.
 */
export function useDevtoolsConfig(
  defaults: DevtoolsConfig,
  provided: { theme?: ColorMode } = {},
) {
  const resolveTheme = (stored: Partial<DevtoolsConfig>, fallback: ColorMode): ColorMode =>
    provided.theme ?? stored.theme ?? fallback;

  const [config, setConfigState] = useState(() => {
    const stored = readStored();
    const next = { ...merge(defaults, stored), theme: resolveTheme(stored, defaults.theme) };
    if (provided.theme) writeStored({ theme: provided.theme });
    return next;
  });
  const configRef = useRef(config);
  configRef.current = config;

  // After SSR hydration the lazy initializer reused the server snapshot
  // (prop defaults). Re-read storage so a previous session's checkboxes win.
  // Theme still prefers a provided arg over that stored value.
  useEffect(() => {
    const stored = readStored();
    setConfigState((prev) => {
      const next = { ...merge(prev, stored), theme: resolveTheme(stored, prev.theme) };
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
