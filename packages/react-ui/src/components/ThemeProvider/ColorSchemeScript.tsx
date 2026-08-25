import React from "react";
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_MEDIA_QUERY,
  ColorSchemeConfig,
  ColorSchemeConfigOptions,
  ColorSchemeMode,
  createColorSchemeConfig,
  defaultColorSchemeConfig,
  isColorSchemeMode,
} from "./colorScheme";

type ScriptOptions = Pick<
  ColorSchemeConfig,
  "defaultMode" | "storageKey" | "forcedMode" | "enableColorScheme"
> & {
  serverMode?: ColorSchemeMode;
  attribute: typeof COLOR_SCHEME_ATTRIBUTE;
  mediaQuery: typeof COLOR_SCHEME_MEDIA_QUERY;
};

function initializeColorScheme(options: ScriptOptions) {
  const root = document.documentElement;
  let mode = options.defaultMode;

  if (options.forcedMode) {
    mode = options.forcedMode;
  } else if (options.serverMode) {
    mode = options.serverMode;
  } else {
    try {
      const storedMode = window.localStorage.getItem(options.storageKey);
      if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
        mode = storedMode;
      }
    } catch {
      // Storage can be unavailable in private or restricted browsing contexts.
    }
  }

  const resolvedMode =
    mode === "system"
      ? typeof window.matchMedia === "function" && window.matchMedia(options.mediaQuery).matches
        ? "dark"
        : "light"
      : mode;

  root.setAttribute(options.attribute, resolvedMode);
  if (options.enableColorScheme) {
    root.style.colorScheme = resolvedMode;
  }
}

function serializeScriptOptions(options: ScriptOptions): string {
  return JSON.stringify(options)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** @internal Exported for focused script and CSP regression tests. */
export function buildColorSchemeScript(
  config: ColorSchemeConfigOptions,
  serverMode?: ColorSchemeMode,
): string {
  const normalizedConfig = createColorSchemeConfig(config);
  const options: ScriptOptions = {
    defaultMode: normalizedConfig.defaultMode,
    ...(isColorSchemeMode(serverMode) ? { serverMode } : {}),
    storageKey: normalizedConfig.storageKey,
    ...(normalizedConfig.forcedMode ? { forcedMode: normalizedConfig.forcedMode } : {}),
    enableColorScheme: normalizedConfig.enableColorScheme,
    attribute: COLOR_SCHEME_ATTRIBUTE,
    mediaQuery: COLOR_SCHEME_MEDIA_QUERY,
  };

  return `(${initializeColorScheme.toString()})(${serializeScriptOptions(options)})`;
}

export type ColorSchemeScriptProps = Omit<
  React.ComponentProps<"script">,
  "children" | "dangerouslySetInnerHTML"
> & {
  /** Configuration shared with the runtime ColorSchemeProvider. */
  config?: ColorSchemeConfigOptions;
  /** Selected mode obtained from the same server-readable source as the provider. */
  serverMode?: ColorSchemeMode;
};

/**
 * Selects the persisted, forced, or system color scheme before application
 * content paints. Render it before paintable content and add
 * `suppressHydrationWarning` to the root `<html>` element.
 */
export function ColorSchemeScript({
  config = defaultColorSchemeConfig,
  serverMode,
  nonce,
  ...scriptProps
}: ColorSchemeScriptProps) {
  return (
    <script
      {...scriptProps}
      data-openui-color-scheme-script
      suppressHydrationWarning
      nonce={typeof window === "undefined" ? nonce : ""}
      dangerouslySetInnerHTML={{ __html: buildColorSchemeScript(config, serverMode) }}
    />
  );
}
