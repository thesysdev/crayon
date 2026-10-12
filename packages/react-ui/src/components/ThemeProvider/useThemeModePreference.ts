"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_MODE_ATTRIBUTE, THEME_MODE_STORAGE_KEY } from "./themeModeStorage";
import type { ThemeMode } from "./types";
import { useSystemThemeMode } from "./useSystemThemeMode";

export { THEME_MODE_ATTRIBUTE, THEME_MODE_STORAGE_KEY };

/** A user's theme choice: a fixed mode, or follow the OS. */
export type ThemeModePreference = ThemeMode | "system";

const isPreference = (value: unknown): value is ThemeModePreference =>
  value === "light" || value === "dark" || value === "system";

const readPreference = (storageKey: string): ThemeModePreference => {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return isPreference(saved) ? saved : "system";
  } catch {
    return "system";
  }
};

/**
 * The user's Light / Dark / System choice, saved to localStorage and mirrored
 * onto <html> as `data-openui-theme`. Returns the choice, a setter, and the
 * resolved `mode` to pass to `<ThemeProvider mode>` (or `theme={{ mode }}`).
 */
export function useThemeModePreference(storageKey: string = THEME_MODE_STORAGE_KEY): {
  preference: ThemeModePreference;
  setPreference: (next: ThemeModePreference) => void;
  mode: ThemeMode;
} {
  const systemMode = useSystemThemeMode();
  const [preference, setPreferenceState] = useState<ThemeModePreference>(() =>
    typeof window === "undefined" ? "system" : readPreference(storageKey),
  );

  const setPreference = useCallback(
    (next: ThemeModePreference) => {
      setPreferenceState(next);
      try {
        if (next === "system") window.localStorage.removeItem(storageKey);
        else window.localStorage.setItem(storageKey, next);
      } catch {
        // Storage can be unavailable (private mode); the choice still applies.
      }
    },
    [storageKey],
  );

  const mode: ThemeMode = preference === "system" ? systemMode : preference;

  useEffect(() => {
    const root = document.documentElement;
    if (preference === "system") root.removeAttribute(THEME_MODE_ATTRIBUTE);
    else root.setAttribute(THEME_MODE_ATTRIBUTE, preference);
    root.style.colorScheme = mode;
  }, [preference, mode]);

  return { preference, setPreference, mode };
}
