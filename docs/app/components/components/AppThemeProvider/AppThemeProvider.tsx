"use client";

import { fontOverrides, legacyVarCss, swatchVarCss } from "@/shared/theme/openuiThemeBridge";
import type { ThemeMode } from "@components/types";
import { ThemeProvider } from "@openuidev/react-ui/ThemeProvider";
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

interface AppThemeProviderProps {
  children: ReactNode;
}

type AppThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export const useAppTheme = (): AppThemeContextValue => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
};

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mode: ThemeMode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      setMode: (nextMode: ThemeMode) => setTheme(nextMode),
      toggleMode: () => setTheme(mode === "light" ? "dark" : "light"),
    }),
    [mode, setTheme],
  );

  return (
    <AppThemeContext.Provider value={contextValue}>
      <ThemeProvider key={mode} mode={mode} lightTheme={fontOverrides}>
        <style>{`
          body {
            ${legacyVarCss}
            ${swatchVarCss}
          }
        `}</style>
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}
