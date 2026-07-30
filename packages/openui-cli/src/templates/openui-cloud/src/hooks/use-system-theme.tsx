"use client";

import { createContext, useContext, useLayoutEffect, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colorSchemeQuery = "(prefers-color-scheme: dark)";

function subscribeToSystemMode(onStoreChange: () => void) {
  const mq = window.matchMedia(colorSchemeQuery);
  const handler = () => onStoreChange();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

function getSystemMode(): ThemeMode {
  return window.matchMedia(colorSchemeQuery).matches ? "dark" : "light";
}

function getServerMode(): ThemeMode {
  // The server cannot know the browser's color scheme. React uses this same
  // snapshot for the first client render, keeping hydration deterministic.
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeToSystemMode, getSystemMode, getServerMode);

  useLayoutEffect(() => {
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  return <ThemeContext.Provider value={{ mode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeMode {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx.mode;
}
