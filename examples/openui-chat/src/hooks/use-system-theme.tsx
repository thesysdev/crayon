"use client";

import { ColorSchemeProvider, useColorScheme } from "@openuidev/react-ui";
import { createContext, useContext, useLayoutEffect } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ColorSchemeProvider>
      <ThemeState>{children}</ThemeState>
    </ColorSchemeProvider>
  );
}

function ThemeState({ children }: { children: React.ReactNode }) {
  const { resolvedMode } = useColorScheme();
  const mode: ThemeMode = resolvedMode ?? "light";

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
