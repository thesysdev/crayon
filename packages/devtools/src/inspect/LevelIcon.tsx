import { type ObservabilityEvent } from "@openuidev/observability";
import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useStyles, type ThemeTokens } from "../theme";

const GLYPH: Record<ObservabilityEvent["level"], ReactNode> = {
  info: "i",
  warning: <X size={11} strokeWidth={2.75} />,
  error: <X size={11} strokeWidth={2.75} />,
};

/**
 * Severity as a colored glyph instead of a word, so the row header has room for
 * the fields that actually differ between events. The level stays the accessible
 * name, which is also what tests and screen readers read.
 */
export function LevelIcon({ level }: { level: ObservabilityEvent["level"] }) {
  const styles = useStyles(levelIconStyles);
  return (
    <span style={{ ...styles.chip, ...styles[level] }} role="img" aria-label={level} title={level}>
      {GLYPH[level]}
    </span>
  );
}

function levelIconStyles(t: ThemeTokens) {
  return {
    chip: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxSizing: "border-box",
      width: 18,
      height: 18,
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1,
    },
    // The chip is already the container, so info is a bare letter rather than an
    // icon that draws its own circle around one.
    info: {
      background: t.levelNeutral,
      color: t.fgMuted,
    },
    warning: {
      background: t.levelWarning,
      color: t.warning,
    },
    error: {
      background: t.levelDanger,
      color: t.danger,
    },
  } satisfies Record<string, CSSProperties>;
}
