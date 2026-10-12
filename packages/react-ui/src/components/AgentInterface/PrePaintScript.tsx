import { THEME_MODE_ATTRIBUTE, THEME_MODE_STORAGE_KEY } from "../ThemeProvider/themeModeStorage";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_OPEN_STORAGE_KEY,
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_WIDTH_VAR,
} from "./_shared/storageKeys";

/** Set on <html> (value "open") when the desktop sidebar was left open. */
export const SIDEBAR_OPEN_ATTRIBUTE = "data-openui-sidebar";

const config = {
  sidebarOpenKey: SIDEBAR_OPEN_STORAGE_KEY,
  sidebarOpenAttribute: SIDEBAR_OPEN_ATTRIBUTE,
  sidebarWidthKey: SIDEBAR_WIDTH_STORAGE_KEY,
  sidebarWidthVar: SIDEBAR_WIDTH_VAR,
  sidebarMinWidth: SIDEBAR_MIN_WIDTH,
  sidebarMaxWidth: SIDEBAR_MAX_WIDTH,
  themeKey: THEME_MODE_STORAGE_KEY,
  themeAttribute: THEME_MODE_ATTRIBUTE,
};

// Shipped as source text inside an inline <script>, so it must be
// self-contained: nothing from outside the function except its argument.
function applySavedPreferences(c: typeof config) {
  try {
    const storage = window.localStorage;
    const root = document.documentElement;

    // Shape written by the AgentInterface store's zustand `persist`.
    const sidebar = JSON.parse(storage.getItem(c.sidebarOpenKey) ?? "null");
    if (sidebar?.state?.desktopSidebarOpen === true) {
      root.setAttribute(c.sidebarOpenAttribute, "open");
    }

    const width = Number(storage.getItem(c.sidebarWidthKey));
    if (width >= c.sidebarMinWidth && width <= c.sidebarMaxWidth) {
      root.style.setProperty(c.sidebarWidthVar, `${width}px`);
    }

    const theme = storage.getItem(c.themeKey);
    if (theme === "light" || theme === "dark") {
      root.setAttribute(c.themeAttribute, theme);
      root.style.colorScheme = theme;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
}

const script = `(${applySavedPreferences.toString()})(${JSON.stringify(config)})`;

/**
 * Applies the saved AgentInterface preferences (theme mode, sidebar open state
 * and width) to <html> before first paint, so a server-rendered shell matches
 * what the client will render. Render it in your root layout's <head>:
 *
 * ```tsx
 * <head>
 *   <PrePaintScript />
 * </head>
 * ```
 */
export const PrePaintScript = ({ nonce }: { nonce?: string }) => (
  <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />
);
