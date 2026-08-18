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
  "bg-muted": "#fafafa",
  "bg-subtle": "#f4f4f5",
  fg: "#18181b",
  "fg-muted": "#71717a",
  "fg-faint": "#a1a1aa",
  "fg-secondary": "#52525b",
  "fg-tertiary": "#3f3f46",
  border: "#e4e4e7",
  "border-subtle": "#f4f4f5",
  overlay: "rgba(24, 24, 27, 0.4)",
  shadow: "0 16px 48px rgba(24, 24, 27, 0.18)",
  "toggle-bg": "#18181b",
  "toggle-fg": "#ffffff",
  "toggle-border": "rgba(0, 0, 0, 0.08)",
  "toggle-shadow": "0 2px 8px rgba(0, 0, 0, 0.16)",
  "toggle-error": "#dc2626",
  inverted: "#18181b",
  "inverted-fg": "#ffffff",
  danger: "#b91c1c",
  "danger-bg": "#fef2f2",
  "danger-border": "#fecaca",
  "danger-strong": "#991b1b",
  warning: "#b45309",
  "warning-bg": "#fffbeb",
  "warning-border": "#fde68a",
  "warning-strong": "#92400e",
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
  bg: "#18181b",
  "bg-muted": "#09090b",
  "bg-subtle": "#27272a",
  fg: "#fafafa",
  "fg-muted": "#a1a1aa",
  "fg-faint": "#71717a",
  "fg-secondary": "#a1a1aa",
  "fg-tertiary": "#d4d4d8",
  border: "#3f3f46",
  "border-subtle": "#27272a",
  overlay: "rgba(0, 0, 0, 0.6)",
  shadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
  "toggle-bg": "#18181b",
  "toggle-fg": "#ffffff",
  "toggle-border": "rgba(255, 255, 255, 0.18)",
  "toggle-shadow": "0 2px 8px rgba(0, 0, 0, 0.45)",
  "toggle-error": "#dc2626",
  inverted: "#fafafa",
  "inverted-fg": "#18181b",
  danger: "#fca5a5",
  "danger-bg": "#450a0a",
  "danger-border": "#7f1d1d",
  "danger-strong": "#fecaca",
  warning: "#fbbf24",
  "warning-bg": "#451a03",
  "warning-border": "#854d0e",
  "warning-strong": "#fde68a",
  info: "#93c5fd",
  "info-bg": "#1e3a5f",
  "info-border": "#1e40af",
  success: "#6ee7b7",
  "success-bg": "#064e3b",
  "success-border": "#065f46",
  "credits-bg": "#451a03",
  "credits-fg": "#fde68a",
  "credits-border": "#854d0e",
  "credits-gradient": "linear-gradient(135deg, #451a03 0%, #431407 100%)",
  selection: "#1e3a5f",
  "syntax-string": "#4ade80",
  "syntax-state": "#e879f9",
  "syntax-number": "#fb923c",
  "syntax-atom": "#c4b5fd",
  "syntax-type": "#93c5fd",
  "syntax-ident": "#d4d4d8",
  "syntax-keyword": "#2dd4bf",
  "syntax-operator": "#a1a1aa",
  "syntax-punct": "#71717a",
  "syntax-text": "#fafafa",
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
