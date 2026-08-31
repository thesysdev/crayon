"use client";

import { ThemeProvider, useSystemThemeMode } from "@openuidev/react-ui";

export function ThemeShell({ children }: { children: React.ReactNode }) {
  const mode = useSystemThemeMode();
  return <ThemeProvider mode={mode}>{children}</ThemeProvider>;
}
