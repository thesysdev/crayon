import { useState, type ButtonHTMLAttributes, type CSSProperties } from "react";

/**
 * The widget's square icon buttons — header actions, close crosses, the
 * settings trigger. They sit on their tray with no chrome until pointed at,
 * then take a fill; keeping that in one component means every one of them
 * behaves the same without threading hover state through each call site.
 */
export function IconButton({
  active = false,
  outlined = false,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Held open, e.g. the settings trigger while its menu shows. */
  active?: boolean;
  /** Carries its own border, for buttons that sit on a busy surface. */
  outlined?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      {...props}
      style={{
        ...styles.button,
        ...(outlined ? styles.outlined : null),
        ...(hovered || active ? styles.filled : null),
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}

const styles = {
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    width: 26,
    height: 26,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: 8,
    background: "transparent",
    color: "var(--oui-dt-fg-muted)",
    cursor: "pointer",
    padding: 0,
    transition: "background 150ms ease, color 150ms ease",
  },
  outlined: {
    borderColor: "var(--oui-dt-control-border)",
    background: "var(--oui-dt-control-bg)",
    color: "var(--oui-dt-fg)",
  },
  filled: {
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg)",
  },
} satisfies Record<string, CSSProperties>;
