"use client";

import { ThemeProvider } from "@openuidev/react-ui";
import { WebsiteThemeBridge, type WebsiteThemeProviderProps } from "./website-theme-bridge";

export function WebsiteThemeProvider({ children, forcedTheme }: WebsiteThemeProviderProps) {
  return (
    <WebsiteThemeBridge provider={ThemeProvider} forcedTheme={forcedTheme}>
      {children}
    </WebsiteThemeBridge>
  );
}
