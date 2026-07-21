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
  // JSON.stringify + <-escaping keeps any storageKey inert inside the
  // inline script: it stays a JS string literal and cannot close the tag early.
  const key = JSON.stringify(storageKey).replace(/</g, "\\u003c");
  const code = `(function(){try{var v=localStorage.getItem(${key});if(v==="light"||v==="dark")document.documentElement.setAttribute("data-openui-mode",v)}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
};
