"use client";

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_MEDIA_QUERY,
  ColorSchemeConfig,
  ColorSchemeConfigOptions,
  ColorSchemeMode,
  createColorSchemeConfig,
  defaultColorSchemeConfig,
  isColorSchemeMode,
  isResolvedColorScheme,
  resolveColorScheme,
  ResolvedColorScheme,
} from "./colorScheme";

export type ColorSchemeStorageManager = {
  get(defaultMode: ColorSchemeMode): ColorSchemeMode;
  set(mode: ColorSchemeMode): void;
  clear(): void;
  subscribe(listener: (mode: ColorSchemeMode | null) => void): () => void;
};

export type LocalStorageColorSchemeManagerOptions = {
  key?: string;
  storageWindow?: Window;
};

export function localStorageColorSchemeManager({
  key = defaultColorSchemeConfig.storageKey,
  storageWindow = typeof window === "undefined" ? undefined : window,
}: LocalStorageColorSchemeManagerOptions = {}): ColorSchemeStorageManager {
  return {
    get(defaultMode) {
      try {
        const value = storageWindow?.localStorage.getItem(key);
        return isColorSchemeMode(value) ? value : defaultMode;
      } catch {
        return defaultMode;
      }
    },
    set(mode) {
      try {
        storageWindow?.localStorage.setItem(key, mode);
      } catch {
        // Storage can be unavailable in private or restricted browsing contexts.
      }
    },
    clear() {
      try {
        storageWindow?.localStorage.removeItem(key);
      } catch {
        // Storage can be unavailable in private or restricted browsing contexts.
      }
    },
    subscribe(listener) {
      if (!storageWindow) return () => {};

      const handleStorage = (event: StorageEvent) => {
        if (event.key !== key && event.key !== null) return;

        try {
          if (event.storageArea && event.storageArea !== storageWindow.localStorage) return;
        } catch {
          // Reading localStorage can itself throw in restricted contexts. The
          // event key is still sufficient to synchronize the preference.
        }

        listener(isColorSchemeMode(event.newValue) ? event.newValue : null);
      };

      storageWindow.addEventListener("storage", handleStorage);
      return () => storageWindow.removeEventListener("storage", handleStorage);
    },
  };
}

export type ColorSchemeSnapshot = Readonly<{
  mode: ColorSchemeMode | undefined;
  resolvedMode: ResolvedColorScheme | undefined;
  systemMode: ResolvedColorScheme | undefined;
  forcedMode: ResolvedColorScheme | undefined;
}>;

export type ColorSchemeContextValue = ColorSchemeSnapshot & {
  setMode(mode: ColorSchemeMode): void;
  clearMode(): void;
};

type ColorSchemeStore = {
  getSnapshot(): ColorSchemeSnapshot;
  getServerSnapshot(): ColorSchemeSnapshot;
  subscribe(listener: () => void): () => void;
  setMode(mode: ColorSchemeMode): void;
  clearMode(): void;
};

type ColorSchemeStoreOptions = {
  config: ColorSchemeConfig;
  storageManager: ColorSchemeStorageManager | null;
  nonce?: string;
  serverMode?: ColorSchemeMode;
  serverSystemMode?: ResolvedColorScheme;
};

const EMPTY_SNAPSHOT: ColorSchemeSnapshot = Object.freeze({
  mode: undefined,
  resolvedMode: undefined,
  systemMode: undefined,
  forcedMode: undefined,
});

function getSystemMode(): ResolvedColorScheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches ? "dark" : "light";
}

function setRootScheme(config: ColorSchemeConfig, resolvedMode: ResolvedColorScheme) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute(COLOR_SCHEME_ATTRIBUTE, resolvedMode);
  document.documentElement.style.colorScheme = config.enableColorScheme ? resolvedMode : "";
}

function temporarilyDisableTransitions(nonce?: string): () => void {
  if (typeof document === "undefined") return () => {};

  const style = document.createElement("style");
  style.dataset["openuiDisableThemeTransitions"] = "true";
  if (nonce) style.setAttribute("nonce", nonce);
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);

  return () => {
    if (typeof window === "undefined") {
      style.remove();
      return;
    }

    if (document.body) window.getComputedStyle(document.body).getPropertyValue("color");
    window.setTimeout(() => style.remove(), 0);
  };
}

/** @internal Exported for store contract tests. */
export function createColorSchemeStore({
  config,
  storageManager,
  nonce,
  serverMode: serverModeOption,
  serverSystemMode: serverSystemModeOption,
}: ColorSchemeStoreOptions): ColorSchemeStore {
  let snapshot: ColorSchemeSnapshot = EMPTY_SNAPSHOT;
  let started = false;
  let stopStorage: (() => void) | undefined;
  let media: MediaQueryList | undefined;
  let stopMedia: (() => void) | undefined;
  const listeners = new Set<() => void>();

  const serverMode = isColorSchemeMode(serverModeOption)
    ? serverModeOption
    : storageManager === null
      ? config.defaultMode
      : undefined;
  const serverSystemMode = isResolvedColorScheme(serverSystemModeOption)
    ? serverSystemModeOption
    : undefined;
  const serverResolvedMode =
    config.forcedMode ??
    (serverMode === "light" || serverMode === "dark" ? serverMode : serverSystemMode);
  const serverSnapshot: ColorSchemeSnapshot = Object.freeze({
    mode: serverMode,
    resolvedMode: serverResolvedMode,
    systemMode: serverSystemMode,
    forcedMode: config.forcedMode,
  });

  const publish = (nextSnapshot: ColorSchemeSnapshot, disableTransitions: boolean) => {
    const resolvedChanged =
      nextSnapshot.resolvedMode !== undefined &&
      nextSnapshot.resolvedMode !== snapshot.resolvedMode;
    const restoreTransitions =
      resolvedChanged && disableTransitions && config.disableTransitionOnChange
        ? temporarilyDisableTransitions(nonce)
        : undefined;

    if (nextSnapshot.resolvedMode) {
      setRootScheme(config, nextSnapshot.resolvedMode);
    }
    snapshot = Object.freeze(nextSnapshot);
    listeners.forEach((listener) => listener());
    restoreTransitions?.();
  };

  const commitMode = (
    mode: ColorSchemeMode,
    systemMode: ResolvedColorScheme,
    disableTransitions: boolean,
  ) => {
    const resolvedMode = config.forcedMode ?? resolveColorScheme(mode, systemMode);
    publish(
      {
        mode,
        resolvedMode,
        systemMode,
        forcedMode: config.forcedMode,
      },
      disableTransitions,
    );
  };

  const start = () => {
    if (started || typeof window === "undefined") return;
    started = true;

    const mode = isColorSchemeMode(serverModeOption)
      ? serverModeOption
      : (storageManager?.get(config.defaultMode) ?? config.defaultMode);
    const systemMode = getSystemMode();
    commitMode(mode, systemMode, false);

    media = window.matchMedia?.(COLOR_SCHEME_MEDIA_QUERY);
    const handleMedia = (event: MediaQueryListEvent) => {
      const nextSystemMode = event.matches ? "dark" : "light";
      const selectedMode = snapshot.mode ?? config.defaultMode;
      commitMode(selectedMode, nextSystemMode, true);
    };
    if (media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handleMedia);
        stopMedia = () => media?.removeEventListener("change", handleMedia);
      } else {
        media.addListener(handleMedia);
        stopMedia = () => media?.removeListener(handleMedia);
      }
    }

    stopStorage = storageManager?.subscribe((nextMode) => {
      commitMode(nextMode ?? config.defaultMode, getSystemMode(), true);
    });
  };

  const stop = () => {
    if (!started) return;
    started = false;
    stopStorage?.();
    stopStorage = undefined;
    stopMedia?.();
    stopMedia = undefined;
    media = undefined;
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      start();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
    setMode(mode) {
      if (!isColorSchemeMode(mode)) return;
      storageManager?.set(mode);
      commitMode(mode, getSystemMode(), true);
    },
    clearMode() {
      storageManager?.clear();
      commitMode(config.defaultMode, getSystemMode(), true);
    },
  };
}

const DEFAULT_CONTEXT: ColorSchemeContextValue = {
  ...EMPTY_SNAPSHOT,
  setMode: () => {},
  clearMode: () => {},
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export type ColorSchemeProviderProps = {
  children?: React.ReactNode;
  config?: ColorSchemeConfigOptions;
  storageManager?: ColorSchemeStorageManager | null;
  /** CSP nonce used by the optional transition-suppression style. */
  nonce?: string;
  /** Initial selected mode obtained from a server-readable preference. */
  serverMode?: ColorSchemeMode;
  /** Initial system mode when it is known by the server. */
  serverSystemMode?: ResolvedColorScheme;
};

function RootColorSchemeProvider({
  children,
  config: configProp = defaultColorSchemeConfig,
  storageManager: storageManagerProp,
  nonce,
  serverMode,
  serverSystemMode,
}: ColorSchemeProviderProps) {
  const { defaultMode, storageKey, forcedMode, enableColorScheme, disableTransitionOnChange } =
    configProp;
  const config = useMemo(
    () =>
      createColorSchemeConfig({
        defaultMode,
        storageKey,
        forcedMode,
        enableColorScheme,
        disableTransitionOnChange,
      }),
    [defaultMode, storageKey, forcedMode, enableColorScheme, disableTransitionOnChange],
  );
  const defaultStorageManager = useMemo(
    () => localStorageColorSchemeManager({ key: config.storageKey }),
    [config.storageKey],
  );
  const storageManager =
    storageManagerProp === undefined ? defaultStorageManager : storageManagerProp;
  const store = useMemo(
    () => createColorSchemeStore({ config, storageManager, nonce, serverMode, serverSystemMode }),
    [config, storageManager, nonce, serverMode, serverSystemMode],
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const value = useMemo<ColorSchemeContextValue>(
    () => ({ ...snapshot, setMode: store.setMode, clearMode: store.clearMode }),
    [snapshot, store],
  );

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

/**
 * Manages one application-wide color-scheme preference. Nested providers are
 * ignored so a subtree cannot compete over the root `<html>` attribute.
 */
export function ColorSchemeProvider(props: ColorSchemeProviderProps) {
  const parent = useContext(ColorSchemeContext);
  if (parent) return <>{props.children}</>;
  return <RootColorSchemeProvider {...props} />;
}

export function useColorScheme(): ColorSchemeContextValue {
  return useContext(ColorSchemeContext) ?? DEFAULT_CONTEXT;
}

/** @internal Distinguishes compatibility fallback from a root provider during SSR. */
export function useOptionalColorScheme(): ColorSchemeContextValue | null {
  return useContext(ColorSchemeContext);
}
