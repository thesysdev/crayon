import { type ObservabilityEvent } from "@openuidev/observability";
import { Info, TriangleAlert, X } from "lucide-react";
import type { CSSProperties } from "react";

const BY_LEVEL = {
  info: {
    Icon: Info,
    style: {
      background: "var(--oui-dt-bg-subtle)",
      color: "var(--oui-dt-fg-muted)",
    },
  },
  warning: {
    Icon: TriangleAlert,
    style: {
      background: "var(--oui-dt-warning-bg)",
      color: "var(--oui-dt-warning)",
    },
  },
  error: {
    Icon: X,
    style: {
      background: "var(--oui-dt-danger-bg)",
      color: "var(--oui-dt-danger)",
    },
  },
} satisfies Record<ObservabilityEvent["level"], { Icon: typeof Info; style: CSSProperties }>;

/**
 * Severity as a colored glyph instead of a word, so the row header has room for
 * the fields that actually differ between events. The level stays the accessible
 * name, which is also what tests and screen readers read.
 */
export function LevelIcon({ level }: { level: ObservabilityEvent["level"] }) {
  const { Icon, style } = BY_LEVEL[level];
  return (
    <span style={{ ...styles.chip, ...style }} role="img" aria-label={level} title={level}>
      <Icon size={11} strokeWidth={2.75} />
    </span>
  );
}

const styles = {
  chip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 18,
    height: 18,
    borderRadius: 999,
  },
} satisfies Record<string, CSSProperties>;
