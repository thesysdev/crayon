/**
 * Props for the {@link ThemeScript} component.
 */
export type ThemeScriptProps = {
  /**
   * localStorage key read for the stored `"light"` / `"dark"` preference.
   * @default "openui-theme"
   */
  storageKey?: string;
};

// Serialized into the inline script — must stay dependency-free and synchronous.
const applyStoredMode = (storageKey: string) => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-openui-mode", stored);
    }
  } catch {
    // Storage can be unavailable (private mode, sandboxed iframes); without a
    // readable preference the page keeps following the device scheme.
  }
};

/**
 * Inline script that applies a stored color-scheme preference before
 * hydration. It reads `localStorage[storageKey]` and, when the value is
 * `"light"` or `"dark"`, sets `data-openui-mode` on `<html>`.
 *
 * Place it in `<head>` (or at the top of `<body>`) BEFORE the first paint of
 * your stylesheets so the stored preference applies before hydration. Pairs
 * with `<ThemeProvider mode="system">`, whose rules give the attribute
 * precedence over the device scheme.
 *
 * @example
 * ```tsx
 * <html>
 *   <head>
 *     <ThemeScript />
 *   </head>
 *   <body>…</body>
 * </html>
 * ```
 */
export const ThemeScript = ({ storageKey = "openui-theme" }: ThemeScriptProps) => {
  // The storage key is the only interpolated value: JSON.stringify keeps it a
  // JS string literal and the < escape keeps a "</script>" inside it from
  // closing the tag early.
  const key = JSON.stringify(storageKey).replace(/</g, "\\u003c");
  const code = `(${String(applyStoredMode)})(${key})`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
};
