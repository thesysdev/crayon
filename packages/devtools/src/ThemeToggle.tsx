import { Moon, Sun } from "lucide-react";
import type { CSSProperties } from "react";
import { IconButton } from "./IconButton";
import type { ColorScheme } from "./theme";

const OPTIONS: { id: ColorScheme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

/**
 * Two icon buttons for the Inspect settings menu, where the row has a label
 * and room to show both choices. The selected one is filled; the other is
 * chrome-less until pointed at.
 */
export function ThemeSegmented({
  value,
  onChange,
}: {
  value: ColorScheme;
  onChange: (value: ColorScheme) => void;
}) {
  return (
    <div style={styles.segmented} role="radiogroup" aria-label="Theme">
      {OPTIONS.map((option) => {
        const active = value === option.id;
        const Icon = option.icon;
        return (
          <IconButton
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            style={active ? styles.selected : undefined}
            onClick={() => onChange(option.id)}
            aria-label={option.label}
            title={option.label}
          >
            <Icon size={14} />
          </IconButton>
        );
      })}
    </div>
  );
}

/**
 * Single-button flip for the Debug header, which is a row of icon buttons with
 * no room for a labelled pair. It shows the theme you would get, not the one
 * you are in — the icon is the outcome of pressing it.
 */
export function ThemeToggle({
  value,
  onChange,
}: {
  value: ColorScheme;
  onChange: (value: ColorScheme) => void;
}) {
  const next: ColorScheme = value === "dark" ? "light" : "dark";
  const label = next === "dark" ? "Switch to dark theme" : "Switch to light theme";
  const Icon = next === "dark" ? Moon : Sun;

  return (
    <IconButton onClick={() => onChange(next)} aria-label={label} title={label}>
      <Icon size={14} />
    </IconButton>
  );
}

const styles = {
  segmented: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  selected: {
    background: "var(--oui-dt-inverted)",
    color: "var(--oui-dt-inverted-fg)",
    borderColor: "var(--oui-dt-inverted)",
  },
} satisfies Record<string, CSSProperties>;
