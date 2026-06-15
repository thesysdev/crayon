"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { createAppTheme } from "@/lib/mui-genui/theme";

type ThemeMode = "light" | "dark";

interface ColorModeContextType {
  mode: ThemeMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

function getSystemMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Provides the Material UI theme + a light/dark color mode. The mode follows the
 * OS color scheme by default, and stays in sync with it until the user picks a
 * mode manually via `toggle()`.
 */
export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [userOverride, setUserOverride] = useState(false);

  // Pick up the system preference once mounted (avoids SSR hydration mismatch).
  useEffect(() => {
    if (!userOverride) setMode(getSystemMode());
  }, [userOverride]);

  // Keep following the system preference until the user overrides it.
  useEffect(() => {
    if (userOverride) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [userOverride]);

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo<ColorModeContextType>(
    () => ({
      mode,
      toggle: () => {
        setUserOverride(true);
        setMode((m) => (m === "light" ? "dark" : "light"));
      },
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextType {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return ctx;
}
