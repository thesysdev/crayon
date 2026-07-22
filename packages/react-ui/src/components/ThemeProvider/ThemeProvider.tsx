import React, { createContext, useContext, useId, useMemo, useSyncExternalStore } from "react";
import { defaultDarkTheme, defaultLightTheme } from "./defaultTheme";
import { Theme, ThemeMode } from "./types";
import { themeToCssVars } from "./utils";

/**
 * Props for the {@link ThemeProvider} component.
 */
export type ThemeProps = {
  /**
   * Active color scheme. `"system"` follows the device scheme and honors a
   * `data-openui-mode="light" | "dark"` attribute on `<html>` (or any
   * ancestor of the themed scope) as an override — see {@link ThemeScript}
   * for applying a stored preference before hydration. Defaults to the parent
   * ThemeProvider mode when nested, otherwise `"light"`.
   */
  mode?: ThemeMode;
  /** Application content rendered inside the theme context. */
  children?: React.ReactNode;
  /**
   * Partial overrides for **light** mode, merged onto the built-in light
   * defaults.  Omitted keys fall back to the built-in defaults.
   * Preferred over the deprecated `theme` prop.
   */
  lightTheme?: Theme;
  /**
   * Partial overrides for **dark** mode, merged onto the built-in dark
   * defaults.  When omitted, `lightTheme` overrides are applied to both modes
   * so a single set of brand customizations "just works".
   */
  darkTheme?: Theme;
  /**
   * @deprecated Use `lightTheme` instead. Kept for backward compatibility;
   * mapped to `lightTheme` internally. If both `theme` and `lightTheme` are
   * provided, `lightTheme` wins.
   */
  theme?: Theme;
  /**
   * CSS selector where `--openui-*` custom properties are applied.
   * Change this when mounting multiple independent theme scopes.
   * @default "body"
   */
  cssSelector?: string;
};

type ThemeContextType = {
  theme: Theme;
  /**
   * Resolved scheme — always `"light"` or `"dark"`, even when the provider's
   * `mode` prop is `"system"`.
   */
  mode: ThemeMode;
  portalThemeClassName: string;
};

/**
 * React context that carries the resolved theme, active mode, and a CSS class
 * name for portals. Consumed via {@link useTheme}.
 */
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultLightTheme,
  mode: "light",
  portalThemeClassName: "",
});

/**
 * Access the current theme, mode, and portal class name from the nearest
 * {@link ThemeProvider}.
 *
 * @returns An object with:
 *  - `theme` – the fully resolved {@link Theme} object
 *  - `mode` – the resolved `"light"` or `"dark"` (never `"system"`; a
 *     `mode="system"` provider resolves it from the `data-openui-mode`
 *     attribute on `<html>`, falling back to the device scheme)
 *  - `portalThemeClassName` – a unique CSS class name to apply on portal
 *     containers so they inherit the same `--openui-*` custom properties
 *
 * Falls back to the default light theme when no provider is present.
 *
 * @example
 * ```tsx
 * const { theme, mode, portalThemeClassName } = useTheme();
 * ```
 */
export const useTheme = () => useContext(ThemeContext);

const themes = {
  light: defaultLightTheme,
  dark: defaultDarkTheme,
} as const;

// ---------------------------------------------------------------------------
// Internal context for nesting detection
// ---------------------------------------------------------------------------
const OPENUI_THEME_SENTINEL = Symbol("openui-theme-provider");

type InternalContextType = {
  [OPENUI_THEME_SENTINEL]: true;
  theme: Theme;
  /** Unresolved mode (may be `"system"`) so nested providers inherit it. */
  mode: ThemeMode;
  portalThemeClassName: string;
};

const InternalContext = createContext<InternalContextType | null>(null);

// ---------------------------------------------------------------------------
// System-mode resolution (useSyncExternalStore backing)
// ---------------------------------------------------------------------------
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function subscribeToSystemMode(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(DARK_SCHEME_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

// The html attribute (set by ThemeScript or the host app) wins over the device
// scheme so the context agrees with the CSS attribute-block precedence.
// Returns primitives so the snapshot is stable per value.
function getSystemModeSnapshot(): "light" | "dark" {
  if (typeof document !== "undefined") {
    const pinned = document.documentElement.dataset["openuiMode"];
    if (pinned === "light" || pinned === "dark") {
      return pinned;
    }
  }
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
  }
  return "light";
}

function getServerSystemModeSnapshot(): "light" | "dark" {
  return "light";
}

// ---------------------------------------------------------------------------
// Dev-mode warning deduplication
// ---------------------------------------------------------------------------
const _devWarned = new Set<string>();

function warnOnce(key: string, message: string) {
  if (_devWarned.has(key)) return;
  _devWarned.add(key);
  console.warn(message);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cssSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

const _knownThemeKeys = new Set(Object.keys(defaultLightTheme));

function validateThemeObject(themeObj: Theme, propName: string) {
  for (const [key, value] of Object.entries(themeObj)) {
    if (value !== undefined && typeof value !== "string" && !Array.isArray(value)) {
      warnOnce(
        `non-string:${propName}:${key}`,
        `[OpenUI] ${propName} key "${key}" has a non-string value (${typeof value}). All theme values should be strings.`,
      );
    }
    if (!_knownThemeKeys.has(key)) {
      warnOnce(
        `unknown-key:${propName}:${key}`,
        `[OpenUI] ${propName} contains unknown key "${key}". It will be ignored. Use createTheme() for typo detection with suggestions.`,
      );
    }
  }
}

/**
 * Renders the OpenUI design-token CSS custom properties (`--openui-*`) as a
 * `<style>` element and provides theme context to all descendant components.
 * The style element is part of the server-rendered HTML, so SSR/streamed pages
 * paint with the correct scheme before hydration.
 *
 * Supports automatic scoping when nested inside another ThemeProvider: the inner
 * provider wraps its children in a `<div>` with `display: contents` and scopes
 * its style rules to a generated class instead of targeting `body`.
 *
 * @example
 * ```tsx
 * <ThemeProvider
 *   mode="dark"
 *   lightTheme={createTheme({ interactiveAccentDefault: "oklch(0.6 0.2 260)" })}
 * >
 *   <App />
 * </ThemeProvider>
 * ```
 */

export const ThemeProvider = ({
  mode: modeProp,
  children,
  lightTheme,
  darkTheme,
  theme: deprecatedTheme,
  cssSelector = "body",
}: ThemeProps) => {
  const id = cssSafeId(useId());
  const parent = useContext(InternalContext);
  const isNested = parent != null;
  const mode = modeProp ?? parent?.mode ?? "light";
  const effectiveCssSelector = cssSelector || "body";
  const hasExplicitSelector = effectiveCssSelector !== "body";

  const systemMode = useSyncExternalStore(
    subscribeToSystemMode,
    getSystemModeSnapshot,
    getServerSystemModeSnapshot,
  );
  const resolvedMode = mode === "system" ? systemMode : mode;

  // Resolve the deprecated `theme` prop → `lightTheme` takes precedence
  const userLightTheme = lightTheme ?? deprecatedTheme ?? {};
  const userDarkTheme = darkTheme;

  // ---------------------------------------------------------------------------
  // Dev-mode warnings
  // ---------------------------------------------------------------------------
  if (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") {
    if (deprecatedTheme !== undefined && lightTheme !== undefined) {
      warnOnce(
        "theme+lightTheme",
        '[OpenUI] Both "theme" and "lightTheme" were passed to ThemeProvider. "lightTheme" takes precedence. Remove the deprecated "theme" prop.',
      );
    }

    if (deprecatedTheme !== undefined && lightTheme === undefined) {
      warnOnce(
        "deprecated-theme",
        '[OpenUI] The "theme" prop on ThemeProvider is deprecated. Use "lightTheme" instead.',
      );
    }

    validateThemeObject(userLightTheme, "lightTheme");
    if (userDarkTheme) {
      validateThemeObject(userDarkTheme, "darkTheme");
    }

    // if (isNested && !hasExplicitSelector) {
    //   warnOnce(
    //     "nested-global",
    //     '[OpenUI] A nested ThemeProvider is targeting "body". The inner provider will auto-scope to avoid overwriting the parent. Pass an explicit cssSelector to opt out.',
    //   );
    // }
  }

  // ---------------------------------------------------------------------------
  // Theme resolution
  // ---------------------------------------------------------------------------
  const resolvedLightTheme = useMemo(
    () => ({ ...themes.light, ...userLightTheme }),
    [userLightTheme],
  );

  const resolvedDarkTheme = useMemo(() => {
    const overrides = userDarkTheme ?? userLightTheme;
    return { ...themes.dark, ...overrides };
  }, [userDarkTheme, userLightTheme]);

  const activeTheme = resolvedMode === "light" ? resolvedLightTheme : resolvedDarkTheme;

  const portalClassName = `openui-theme-portal-${id}`;
  const scopedClassName = `openui-theme-${id}`;

  const contextValue = useMemo<ThemeContextType>(
    () => ({ theme: activeTheme, mode: resolvedMode, portalThemeClassName: portalClassName }),
    [activeTheme, resolvedMode, portalClassName],
  );

  const internalValue = useMemo<InternalContextType>(
    () => ({
      [OPENUI_THEME_SENTINEL]: true as const,
      theme: activeTheme,
      mode,
      portalThemeClassName: portalClassName,
    }),
    [activeTheme, mode, portalClassName],
  );

  // ---------------------------------------------------------------------------
  // Rendered style element
  // ---------------------------------------------------------------------------
  const useAutoScope = isNested && !hasExplicitSelector;
  const styleSelector = useAutoScope ? `.${scopedClassName}` : effectiveCssSelector;

  // Intentionally unlayered — the rendered rules must override component styles
  // in both modes, including when consumers opt into layered-components.css
  // (@layer openui), so runtime theming always wins. See README "Styling
  // integration" before changing.
  const styleContent = useMemo(() => {
    const scopeSelectors = `${styleSelector}, .${portalClassName}`;
    if (mode !== "system") {
      const vars = themeToCssVars(mode === "light" ? resolvedLightTheme : resolvedDarkTheme);
      return `${scopeSelectors} { ${vars} }`;
    }
    // System mode: the static defaults CSS already ships the full light set,
    // the media-gated dark set, and the [data-openui-mode] override blocks.
    // The tag only carries what that CSS cannot know: custom tokens on a
    // top-level provider, or full sets for a scoped provider whose subtree
    // must out-cascade tokens an ancestor pinned on body. With nothing to
    // add, no tag is rendered. The attribute groups are emitted last and use
    // [attr] descendant selectors — (0,1,1) beats the media-gated (0,0,1) —
    // so a data-openui-mode pin on <html>/an ancestor wins over the device
    // scheme. Custom themes require the defaults stylesheet (always bundled
    // in components.css) for their unset tokens.
    const scoped = styleSelector !== "body";
    const lightVars = themeToCssVars(scoped ? resolvedLightTheme : userLightTheme);
    const darkVars = themeToCssVars(scoped ? resolvedDarkTheme : (userDarkTheme ?? userLightTheme));
    const attrGroup = (attrMode: "light" | "dark") =>
      `[data-openui-mode="${attrMode}"] ${styleSelector}, [data-openui-mode="${attrMode}"] .${portalClassName}`;
    return [
      lightVars && `${scopeSelectors} { ${lightVars} }`,
      darkVars && `@media (prefers-color-scheme: dark) { ${scopeSelectors} { ${darkVars} } }`,
      lightVars && `${attrGroup("light")} { ${lightVars} }`,
      darkVars && `${attrGroup("dark")} { ${darkVars} }`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    mode,
    resolvedLightTheme,
    resolvedDarkTheme,
    userLightTheme,
    userDarkTheme,
    styleSelector,
    portalClassName,
  ]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <InternalContext.Provider value={internalValue}>
      <ThemeContext.Provider value={contextValue}>
        {/* Rendered before children so streamed CSS parses before content paints. */}
        {styleContent ? (
          <style data-openui-theme={id} dangerouslySetInnerHTML={{ __html: styleContent }} />
        ) : null}
        {useAutoScope ? (
          <div className={scopedClassName} style={{ display: "contents" }}>
            {children}
          </div>
        ) : (
          children
        )}
      </ThemeContext.Provider>
    </InternalContext.Provider>
  );
};
