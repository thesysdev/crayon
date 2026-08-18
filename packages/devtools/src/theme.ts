import {
  createContext,
  createElement,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * The widget's own theme. Chosen explicitly in Settings (persisted) — the
 * widget never sniffs the host page or the OS, so it looks the same in
 * every app until you change it.
 */
export type ColorScheme = "light" | "dark";

export const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

/**
 * Zinc-based chrome for the injected widget. Independent of the host design
 * system so the same drawer works in any app.
 */
const LIGHT = {
  bg: "#ffffff",
  // Event cards. Level with the tray in light; lifted off it in dark, where a
  // border alone is too faint to separate them.
  card: "#ffffff",
  // Small outlined controls. They sit on recessed panels, so in dark they need
  // to be lighter than the tray to read as raised.
  "control-bg": "#ffffff",
  "control-border": "#e4e4e7",
  // Inset fills are alpha, not fixed hex, so they read the same shade deeper
  // wherever they land — on the tray, on a card, or inside another panel.
  "promo-bg": "rgba(24, 24, 27, 0.035)",
  "bg-muted": "rgba(24, 24, 27, 0.035)",
  "bg-subtle": "#f4f4f5",
  fg: "#18181b",
  "fg-muted": "#71717a",
  "fg-faint": "#8a8a94",
  "fg-secondary": "#52525b",
  "fg-tertiary": "#3f3f46",
  border: "#e4e4e7",
  "border-strong": "#cfcfd4",
  // LevelIcon chip fills: a step tinted past the surface, softer than the
  // matching -border tokens they sit next to.
  "level-neutral": "#ececee",
  "level-warning": "#ffedd5",
  "level-danger": "#fee2e2",
  "border-subtle": "#f4f4f5",
  overlay: "rgba(24, 24, 27, 0.4)",
  shadow: "0 16px 48px rgba(24, 24, 27, 0.18)",
  "shadow-subtle": "0 1px 2px rgba(24, 24, 27, 0.07)",
  "toggle-bg": "#18181b",
  "toggle-fg": "#ffffff",
  // Rim on the trays: a hairline of the opposite tone, so the panel edge
  // reads without the weight of a solid border.
  "tray-ring": "rgba(24, 24, 27, 0.10)",
  "toggle-border": "rgba(0, 0, 0, 0.08)",
  "toggle-shadow": "0 1px 4px rgba(0, 0, 0, 0.10)",
  "toggle-error": "#e05252",
  // The error toggle is a light puck in both themes, so the red count disc
  // inside it keeps the same contrast wherever the widget is mounted.
  "toggle-error-surface": "#ffffff",
  "toggle-error-ring": "rgba(0, 0, 0, 0.14)",
  inverted: "#18181b",
  "inverted-fg": "#ffffff",
  danger: "#b91c1c",
  "danger-bg": "#fef2f2",
  "danger-border": "#fecaca",
  "danger-strong": "#991b1b",
  warning: "#c2410c",
  "warning-bg": "#fff7ed",
  "warning-border": "#fed7aa",
  "warning-strong": "#9a3412",
  info: "#1d4ed8",
  "info-bg": "#eff6ff",
  "info-border": "#bfdbfe",
  success: "#047857",
  "success-bg": "#ecfdf5",
  "success-border": "#a7f3d0",
  "credits-bg": "#fef3c7",
  "credits-fg": "#92400e",
  "credits-border": "#fde68a",
  "credits-gradient": "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
  selection: "#bfdbfe",
  "syntax-string": "#15803d",
  "syntax-state": "#a21caf",
  "syntax-number": "#c2410c",
  "syntax-atom": "#7c3aed",
  "syntax-type": "#1d4ed8",
  "syntax-ident": "#3f3f46",
  "syntax-keyword": "#0f766e",
  "syntax-operator": "#71717a",
  "syntax-punct": "#a1a1aa",
  "syntax-text": "#18181b",
} as const;

const DARK = {
  // Lightness is the depth cue: raised surfaces step up from the tray, inset
  // ones step down. One neutral hue throughout, so nothing reads muddy.
  //   inset (alpha) < tray #17171a < card #1f1f23 < chips #2e2e34
  bg: "#17171a",
  card: "#1f1f23",
  // Fill sits just above the card; the stroke a step above the fill, so the
  // control catches light on its edge the way a raised surface does.
  "control-bg": "#26262b",
  "control-border": "#33333a",
  "bg-muted": "rgba(0, 0, 0, 0.20)",
  "promo-bg": "rgba(0, 0, 0, 0.20)",
  "bg-subtle": "#2e2e34",
  // Five distinct steps. `fg` stops short of pure white to avoid halation.
  fg: "#ededf0",
  "fg-tertiary": "#d0d0d6",
  "fg-secondary": "#b0b0b8",
  "fg-muted": "#9494a0",
  "fg-faint": "#74747f",
  border: "#262629",
  "border-strong": "#3f3f47",
  "border-subtle": "#26262b",
  "level-neutral": "#2e2e34",
  "level-warning": "#3b2a13",
  "level-danger": "#3b1f23",
  overlay: "rgba(0, 0, 0, 0.6)",
  shadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
  "shadow-subtle": "0 1px 2px rgba(0, 0, 0, 0.4)",
  "toggle-bg": "#17171a",
  "toggle-fg": "#ffffff",
  "tray-ring": "rgba(255, 255, 255, 0.09)",
  "toggle-border": "rgba(255, 255, 255, 0.18)",
  "toggle-shadow": "0 1px 4px rgba(0, 0, 0, 0.28)",
  "toggle-error": "#e05252",
  "toggle-error-surface": "#ffffff",
  "toggle-error-ring": "rgba(0, 0, 0, 0.14)",
  inverted: "#ededf0",
  "inverted-fg": "#17171a",
  // Accent surfaces are the base neutral nudged toward the hue (~10% sat), not
  // the hue itself darkened — that reads as a solid block on a dark tray.
  danger: "#f78b8b",
  "danger-bg": "#331a1e",
  "danger-border": "#5c2a31",
  "danger-strong": "#fcbcbc",
  warning: "#f5a04a",
  "warning-bg": "#332110",
  "warning-border": "#5c3d1e",
  "warning-strong": "#f9c893",
  info: "#86b3fa",
  "info-bg": "#17253d",
  "info-border": "#2b4778",
  success: "#5fd6a4",
  "success-bg": "#122e23",
  "success-border": "#1f5240",
  "credits-bg": "#332110",
  "credits-fg": "#f9c893",
  "credits-border": "#5c3d1e",
  "credits-gradient": "linear-gradient(135deg, #332110 0%, #331a18 100%)",
  selection: "#2b4778",
  "syntax-string": "#5fd97f",
  "syntax-state": "#dd8bf0",
  "syntax-number": "#f5a04a",
  "syntax-atom": "#b9a6fb",
  "syntax-type": "#86b3fa",
  "syntax-ident": "#d0d0d6",
  "syntax-keyword": "#4dd3c0",
  "syntax-operator": "#9494a0",
  "syntax-punct": "#74747f",
  "syntax-text": "#ededf0",
} as const;

/** CSS custom properties to set on each widget root (toggle, drawer, paste). */
export function themeVars(scheme: ColorScheme): CSSProperties {
  const tokens = scheme === "dark" ? DARK : LIGHT;
  const style: Record<string, string> = { colorScheme: scheme };
  for (const [key, value] of Object.entries(tokens)) {
    style[`--oui-dt-${key}`] = value;
  }
  return style as CSSProperties;
}

const SchemeContext = createContext<ColorScheme>(DEFAULT_COLOR_SCHEME);

export function DevtoolsSchemeProvider({
  scheme,
  children,
}: {
  scheme: ColorScheme;
  children: ReactNode;
}) {
  return createElement(SchemeContext.Provider, { value: scheme }, children);
}

/** The scheme chosen in Settings, shared with the paste modal and popup. */
export function useDevtoolsScheme(): ColorScheme {
  return useContext(SchemeContext);
}
