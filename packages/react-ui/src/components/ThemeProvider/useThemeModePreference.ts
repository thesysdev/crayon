"use client";

import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { useIsomorphicLayoutEffect } from "../Charts/hooks/core/useIsomorphicLayoutEffect";
import type { ThemeMode } from "./types";
import { useSystemThemeMode } from "./useSystemThemeMode";

/** A user's theme choice: a fixed mode, or follow the OS. */
export type ThemeModePreference = ThemeMode | "system";

/** localStorage key the preference is saved under (unset means "system"). */
export const THEME_MODE_STORAGE_KEY = "openui-theme-mode";

/**
 * Attribute set on <html> while a mode is pinned. The default token sheet
 * (openui-defaults) reads it, so pages outside AgentInterface follow the
 * chosen mode too.
 */
export const THEME_MODE_ATTRIBUTE = "data-openui-theme";

interface ThemeModePreferenceState {
  preference: ThemeModePreference;
  setPreference: (next: ThemeModePreference) => void;
}

const isPreference = (value: unknown): value is ThemeModePreference =>
  value === "light" || value === "dark" || value === "system";

// Saved with zustand `persist`, like the AgentInterface sidebar preferences:
// "system" until restored after hydration, so server-rendered markup matches.
const createPreferenceStore = (storageKey: string) =>
  createStore<ThemeModePreferenceState>()(
    persist(
      (set) => ({
        preference: "system",
        setPreference: (preference) => set({ preference }),
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (state) => ({ preference: state.preference }),
        merge: (persisted, current) => {
          const saved = (persisted as Partial<ThemeModePreferenceState> | undefined)?.preference;
          return { ...current, preference: isPreference(saved) ? saved : "system" };
        },
      },
    ),
  );

// One store per key, so every component using the hook shares the choice.
const preferenceStores = new Map<string, ReturnType<typeof createPreferenceStore>>();

const getPreferenceStore = (storageKey: string) => {
  let store = preferenceStores.get(storageKey);
  if (!store) {
    store = createPreferenceStore(storageKey);
    preferenceStores.set(storageKey, store);
  }
  return store;
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
  const store = getPreferenceStore(storageKey);
  const preference = useStore(store, (state) => state.preference);
  const setPreference = useStore(store, (state) => state.setPreference);
  const systemMode = useSystemThemeMode();

  // After hydration, before paint. `persist` is missing when storage is
  // unavailable; the choice then lives for the page only.
  useIsomorphicLayoutEffect(() => {
    void store.persist?.rehydrate();
  }, [store]);

  const mode: ThemeMode = preference === "system" ? systemMode : preference;

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (preference === "system") root.removeAttribute(THEME_MODE_ATTRIBUTE);
    else root.setAttribute(THEME_MODE_ATTRIBUTE, preference);
    root.style.colorScheme = mode;
  }, [preference, mode]);

  return { preference, setPreference, mode };
}
