import React, { createContext, useContext, useId, useMemo } from "react";
import { COLOR_SCHEME_ATTRIBUTE, COLOR_SCHEME_MEDIA_QUERY } from "./colorScheme";
import { useOptionalColorScheme } from "./ColorSchemeProvider";
import { defaultDarkTheme, defaultLightTheme } from "./defaultTheme";
import { Theme, ThemeMode } from "./types";
import { KNOWN_THEME_KEYS, themeToCssVars } from "./utils";

/**
 * Props for the {@link ThemeProvider} component.
 */
export type ThemeProps = {
  /**
   * Controlled resolved scheme. When omitted, inherits a parent theme, then a
   * root ColorSchemeProvider, and otherwise keeps the legacy `"light"` fallback.
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
   * CSS selector where `--openui-*` custom properties are injected.
   * Change this when mounting multiple independent theme scopes.
   * @default "body"
   */
  cssSelector?: string;
  /** CSP nonce applied to the server-rendered theme style element. */
  nonce?: string;
};

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
  portalThemeClassName: string;
  /** Whether the current mode is deterministic during server rendering. */
  isModeServerResolved: boolean;
};

/**
 * React context that carries the resolved theme, active mode, and a CSS class
 * name for portals. Consumed via {@link useTheme}.
 */
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultLightTheme,
  mode: "light",
  portalThemeClassName: "",
  isModeServerResolved: true,
});

/**
 * Access the current theme, mode, and portal class name from the nearest
 * {@link ThemeProvider}.
 *
 * @returns An object with:
 *  - `theme` – the fully resolved {@link Theme} object
 *  - `mode` – `"light"` or `"dark"`
 *  - `portalThemeClassName` – a unique CSS class name to apply on portal
 *     containers so they inherit the same `--openui-*` custom properties
 *  - `isModeServerResolved` – false when the root mode comes from browser-only state
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
const EMPTY_THEME: Theme = Object.freeze({});

// ---------------------------------------------------------------------------
// Internal context for nesting detection
// ---------------------------------------------------------------------------
const OPENUI_THEME_SENTINEL = Symbol("openui-theme-provider");

type InternalContextType = {
  [OPENUI_THEME_SENTINEL]: true;
  theme: Theme;
  mode: ThemeMode;
  portalThemeClassName: string;
  inheritsRootColorScheme: boolean;
  isModeServerResolved: boolean;
};

const InternalContext = createContext<InternalContextType | null>(null);

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

function splitTopLevelSelectors(selectorList: string): string[] {
  const selectors: string[] = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote: '"' | "'" | undefined;
  let escaped = false;

  for (let index = 0; index < selectorList.length; index += 1) {
    const character = selectorList[index]!;

    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (character === "," && parentheses === 0 && brackets === 0) {
      const selector = selectorList.slice(start, index).trim();
      if (selector) selectors.push(selector);
      start = index + 1;
    }
  }

  const finalSelector = selectorList.slice(start).trim();
  if (finalSelector) selectors.push(finalSelector);
  return selectors;
}

// React 18 HTML-escapes quote characters in <style> text. Because style is a
// raw-text HTML element, the browser does not decode those entities back into
// CSS. Represent quoted selector strings as unquoted hexadecimal escapes so
// the same server output works in React 18 and 19.
function escapeSelectorStringLiterals(selector: string): string {
  let output = "";

  for (let index = 0; index < selector.length; index += 1) {
    const quote = selector[index];
    if (quote !== '"' && quote !== "'") {
      output += quote;
      continue;
    }

    let value = "";
    let closed = false;
    for (index += 1; index < selector.length; index += 1) {
      const character = selector[index]!;
      if (character === "\\" && selector[index + 1] !== undefined) {
        const nextCharacter = selector[index + 1]!;
        if (nextCharacter === "\n" || nextCharacter === "\f") {
          index += 1;
        } else if (nextCharacter === "\r") {
          index += selector[index + 2] === "\n" ? 2 : 1;
        } else if (/[0-9a-f]/i.test(nextCharacter)) {
          let hex = "";
          let cursor = index + 1;
          while (
            cursor < selector.length &&
            hex.length < 6 &&
            /[0-9a-f]/i.test(selector[cursor]!)
          ) {
            hex += selector[cursor];
            cursor += 1;
          }
          const codePoint = Number.parseInt(hex, 16);
          value += String.fromCodePoint(
            codePoint === 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)
              ? 0xfffd
              : codePoint,
          );
          if (selector[cursor] === "\r" && selector[cursor + 1] === "\n") cursor += 2;
          else if (/\s/.test(selector[cursor] ?? "")) cursor += 1;
          index = cursor - 1;
        } else {
          value += nextCharacter;
          index += 1;
        }
      } else if (character === quote) {
        closed = true;
        break;
      } else {
        value += character;
      }
    }

    if (!closed || !value) {
      output += `${quote}${value}${closed ? quote : ""}`;
      continue;
    }

    output += Array.from(value, (character) => `\\${character.codePointAt(0)!.toString(16)} `).join(
      "",
    );
  }

  return output;
}

function prefixSelector(prefix: string, selector: string): string {
  for (const rootSelector of [":root", "html"] as const) {
    if (!selector.startsWith(rootSelector)) continue;
    const boundary = selector[rootSelector.length];
    if (boundary === undefined || /[\s>+~.#:\[\]]/.test(boundary)) {
      return `${prefix}${selector.slice(rootSelector.length)}`;
    }
  }

  return `${prefix} ${selector}`;
}

function formatSelectorList(selectors: string[]): string {
  return selectors.join(",\n");
}

function formatThemeRule(selectors: string[], cssVars: string): string {
  return `${formatSelectorList(selectors)} {\n${cssVars}\n}`;
}

function buildThemeCss({
  selectors,
  lightCssVars,
  darkCssVars,
  inheritsRootColorScheme,
  activeCssVars,
}: {
  selectors: string[];
  lightCssVars: string;
  darkCssVars: string;
  inheritsRootColorScheme: boolean;
  activeCssVars: string;
}): string {
  if (!inheritsRootColorScheme) return formatThemeRule(selectors, activeCssVars);

  const lightRoot = `:root[${COLOR_SCHEME_ATTRIBUTE}=light]`;
  const darkRoot = `:root[${COLOR_SCHEME_ATTRIBUTE}=dark]`;
  const systemDarkRoot = `:root:not([${COLOR_SCHEME_ATTRIBUTE}])`;
  const lightSelectors = selectors.map((selector) => prefixSelector(lightRoot, selector));
  const darkSelectors = selectors.map((selector) => prefixSelector(darkRoot, selector));
  const systemDarkSelectors = selectors.map((selector) => prefixSelector(systemDarkRoot, selector));

  return [
    lightCssVars ? formatThemeRule([...selectors, ...lightSelectors], lightCssVars) : "",
    darkCssVars ? formatThemeRule(darkSelectors, darkCssVars) : "",
    darkCssVars
      ? `@media ${COLOR_SCHEME_MEDIA_QUERY} {\n${formatThemeRule(systemDarkSelectors, darkCssVars)}\n}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function validateThemeObject(themeObj: Theme, propName: string) {
  for (const [key, value] of Object.entries(themeObj)) {
    if (value !== undefined && typeof value !== "string" && !Array.isArray(value)) {
      warnOnce(
        `non-string:${propName}:${key}`,
        `[OpenUI] ${propName} key "${key}" has a non-string value (${typeof value}). All theme values should be strings.`,
      );
    }
    if (!KNOWN_THEME_KEYS.has(key)) {
      warnOnce(
        `unknown-key:${propName}:${key}`,
        `[OpenUI] ${propName} contains unknown key "${key}". It will be ignored. Use createTheme() for typo detection with suggestions.`,
      );
    }
  }
}

function buildRootDarkCssTheme(userLightTheme: Theme, userDarkTheme: Theme | undefined): Theme {
  if (!userDarkTheme) return userLightTheme;

  const darkThemeRecord = userDarkTheme as Record<string, unknown>;
  const defaultDarkThemeRecord = defaultDarkTheme as Record<string, unknown>;
  const lightOnlyResets = Object.fromEntries(
    Object.entries(userLightTheme).flatMap(([key, lightValue]) => {
      if (typeof lightValue !== "string" || typeof darkThemeRecord[key] === "string") return [];
      const defaultDarkValue = defaultDarkThemeRecord[key];
      return typeof defaultDarkValue === "string" ? [[key, defaultDarkValue]] : [];
    }),
  );

  // The light rule is intentionally unqualified so it also works with
  // JavaScript disabled. Reset light-only overrides in the qualified dark rule
  // before applying the independent dark overrides.
  return { ...lightOnlyResets, ...userDarkTheme };
}

/**
 * Injects the OpenUI design-token CSS custom properties (`--openui-*`) into the
 * DOM and provides theme context to all descendant components.
 *
 * Supports automatic scoping when nested inside another ThemeProvider: the inner
 * provider wraps its children in a `<div>` with `display: contents` and injects
 * a scoped style rule instead of targeting `body`.
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
  nonce,
}: ThemeProps) => {
  const id = cssSafeId(useId());
  const parent = useContext(InternalContext);
  const rootColorScheme = useOptionalColorScheme();
  const isNested = parent != null;
  const inheritsRootColorScheme =
    modeProp === undefined && (parent ? parent.inheritsRootColorScheme : rootColorScheme !== null);
  const mode = modeProp ?? parent?.mode ?? rootColorScheme?.resolvedMode ?? "light";
  const isModeServerResolved =
    modeProp !== undefined
      ? true
      : parent
        ? parent.isModeServerResolved
        : rootColorScheme
          ? rootColorScheme.resolvedMode !== undefined
          : true;
  const effectiveCssSelector = cssSelector || "body";
  const hasExplicitSelector = effectiveCssSelector !== "body";

  // Resolve the deprecated `theme` prop → `lightTheme` takes precedence
  const userLightTheme = lightTheme ?? deprecatedTheme ?? EMPTY_THEME;
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

  const activeTheme = mode === "light" ? resolvedLightTheme : resolvedDarkTheme;
  // Root providers that inherit the global selector only need to emit actual
  // overrides; complete defaults already exist on :root for both schemes.
  // Nested and explicit providers retain complete themes so local scopes keep
  // their historical reset semantics.
  const lightCssTheme = inheritsRootColorScheme && !isNested ? userLightTheme : resolvedLightTheme;
  const darkCssTheme =
    inheritsRootColorScheme && !isNested
      ? buildRootDarkCssTheme(userLightTheme, userDarkTheme)
      : resolvedDarkTheme;
  const lightCssVars = useMemo(() => themeToCssVars(lightCssTheme), [lightCssTheme]);
  const darkCssVars = useMemo(() => themeToCssVars(darkCssTheme), [darkCssTheme]);
  const activeCssVars = mode === "light" ? lightCssVars : darkCssVars;

  const portalClassName = `openui-theme-portal-${id}`;
  const scopedClassName = `openui-theme-${id}`;

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme: activeTheme,
      mode,
      portalThemeClassName: portalClassName,
      isModeServerResolved,
    }),
    [activeTheme, mode, portalClassName, isModeServerResolved],
  );

  const internalValue = useMemo<InternalContextType>(
    () => ({
      [OPENUI_THEME_SENTINEL]: true as const,
      theme: activeTheme,
      mode,
      portalThemeClassName: portalClassName,
      inheritsRootColorScheme,
      isModeServerResolved,
    }),
    [activeTheme, mode, portalClassName, inheritsRootColorScheme, isModeServerResolved],
  );

  // ---------------------------------------------------------------------------
  // Server-rendered style injection
  // ---------------------------------------------------------------------------
  const useAutoScope = isNested && !hasExplicitSelector;
  const styleSelector = useAutoScope ? `.${scopedClassName}` : effectiveCssSelector;
  const targetSelectors = useMemo(
    () => [
      ...splitTopLevelSelectors(styleSelector).map(escapeSelectorStringLiterals),
      `.${portalClassName}`,
    ],
    [styleSelector, portalClassName],
  );
  const cssText = useMemo(() => {
    if (!lightCssVars && !darkCssVars) return "";
    return buildThemeCss({
      selectors: targetSelectors,
      lightCssVars,
      darkCssVars,
      inheritsRootColorScheme,
      activeCssVars,
    });
  }, [targetSelectors, lightCssVars, darkCssVars, inheritsRootColorScheme, activeCssVars]);

  // Intentionally unlayered — must override component styles in both modes,
  // including when consumers opt into layered-components.css (@layer openui),
  // so runtime theming always wins. See README "Styling integration" before changing.

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <InternalContext.Provider value={internalValue}>
      <ThemeContext.Provider value={contextValue}>
        {cssText ? (
          <style data-openui-theme={id} nonce={nonce}>
            {cssText}
          </style>
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
