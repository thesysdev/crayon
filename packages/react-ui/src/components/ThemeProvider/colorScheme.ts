export const COLOR_SCHEME_ATTRIBUTE = "data-openui-color-scheme";
export const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
export const DEFAULT_COLOR_SCHEME_STORAGE_KEY = "openui-color-scheme";

export type ColorSchemeMode = "light" | "dark" | "system";
export type ResolvedColorScheme = Exclude<ColorSchemeMode, "system">;

export type ColorSchemeConfig = Readonly<{
  defaultMode: ColorSchemeMode;
  storageKey: string;
  forcedMode?: ResolvedColorScheme;
  enableColorScheme: boolean;
  disableTransitionOnChange: boolean;
}>;

export type ColorSchemeConfigOptions = Partial<ColorSchemeConfig>;

export type ColorSchemeServerOptions = Readonly<{
  /** Selected mode read by the application from a server-visible source. */
  mode?: ColorSchemeMode;
  /** Server-known system preference, required to resolve `mode="system"`. */
  systemMode?: ResolvedColorScheme;
}>;

export type ColorSchemeHtmlProps = Readonly<{
  suppressHydrationWarning: true;
  [COLOR_SCHEME_ATTRIBUTE]?: ResolvedColorScheme;
}>;

export function isColorSchemeMode(value: unknown): value is ColorSchemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function isResolvedColorScheme(value: unknown): value is ResolvedColorScheme {
  return value === "light" || value === "dark";
}

export function resolveColorScheme(
  mode: ColorSchemeMode,
  systemMode: ResolvedColorScheme,
): ResolvedColorScheme {
  return mode === "system" ? systemMode : mode;
}

/**
 * Creates the serializable configuration shared by {@link ColorSchemeScript}
 * and {@link ColorSchemeProvider}. Passing the same object to both prevents
 * first-paint drift from mismatched defaults or storage keys.
 */
export function createColorSchemeConfig(options: ColorSchemeConfigOptions = {}): ColorSchemeConfig {
  const defaultMode = isColorSchemeMode(options.defaultMode) ? options.defaultMode : "system";
  const storageKey = options.storageKey?.trim() || DEFAULT_COLOR_SCHEME_STORAGE_KEY;
  const forcedMode = isResolvedColorScheme(options.forcedMode) ? options.forcedMode : undefined;

  return Object.freeze({
    defaultMode,
    storageKey,
    ...(forcedMode ? { forcedMode } : {}),
    enableColorScheme: options.enableColorScheme ?? true,
    disableTransitionOnChange: options.disableTransitionOnChange ?? false,
  });
}

export const defaultColorSchemeConfig = createColorSchemeConfig();

/**
 * Props for the application root `<html>` element. A concrete attribute is
 * included only when the scheme is server-resolvable; otherwise CSS media
 * fallback and ColorSchemeScript select it.
 */
export function getColorSchemeHtmlProps(
  configOptions: ColorSchemeConfigOptions = defaultColorSchemeConfig,
  serverOptions: ColorSchemeServerOptions = {},
): ColorSchemeHtmlProps {
  const config = createColorSchemeConfig(configOptions);
  const mode = isColorSchemeMode(serverOptions.mode) ? serverOptions.mode : config.defaultMode;
  const systemMode = isResolvedColorScheme(serverOptions.systemMode)
    ? serverOptions.systemMode
    : undefined;
  const resolvedMode =
    config.forcedMode ?? (mode === "system" ? systemMode : resolveColorScheme(mode, "light"));

  return Object.freeze({
    suppressHydrationWarning: true,
    ...(resolvedMode ? { [COLOR_SCHEME_ATTRIBUTE]: resolvedMode } : {}),
  });
}

/** Root props for the default system-mode configuration. */
export const openuiColorSchemeHtmlProps = getColorSchemeHtmlProps();
