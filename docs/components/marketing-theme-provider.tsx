"use client";

// The subpath entry is only the provider. The package root would put the whole
// component library (~2 MB of JS) into every marketing page's first load. The
// catch is that it has its own React context, so @openuidev/react-ui components
// rendered below it would not see this theme. Use WebsiteThemeProvider for any
// page that renders them.
import { ThemeProvider } from "@openuidev/react-ui/ThemeProvider";
import { WebsiteThemeBridge, type WebsiteThemeProviderProps } from "./website-theme-bridge";

export function MarketingThemeProvider({ children, forcedTheme }: WebsiteThemeProviderProps) {
  return (
    <WebsiteThemeBridge provider={ThemeProvider} forcedTheme={forcedTheme}>
      {children}
    </WebsiteThemeBridge>
  );
}
