import { type ObservabilityEvent } from "@openuidev/observability";
import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

// The chip is already the container, so info is a bare letter rather than an
// icon that draws its own circle around one.
const BY_LEVEL = {
  info: {
    glyph: "i",
    style: {
      background: "var(--oui-dt-level-neutral)",
      color: "var(--oui-dt-fg-muted)",
    },
  },
  warning: {
    glyph: <X size={11} strokeWidth={2.75} />,
    style: {
      background: "var(--oui-dt-level-warning)",
      color: "var(--oui-dt-warning)",
    },
  },
  error: {
    glyph: <X size={11} strokeWidth={2.75} />,
    style: {
      background: "var(--oui-dt-level-danger)",
      color: "var(--oui-dt-danger)",
    },
  },
} satisfies Record<ObservabilityEvent["level"], { glyph: ReactNode; style: CSSProperties }>;

/**
 * Severity as a colored glyph instead of a word, so the row header has room for
 * the fields that actually differ between events. The level stays the accessible
 * name, which is also what tests and screen readers read.
 */
export function LevelIcon({ level }: { level: ObservabilityEvent["level"] }) {
  const { glyph, style } = BY_LEVEL[level];
  return (
    <span style={{ ...styles.chip, ...style }} role="img" aria-label={level} title={level}>
      {glyph}
    </span>
  );
}

const styles = {
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
} satisfies Record<string, CSSProperties>;
