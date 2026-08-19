import { useState, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { useStyles, type ThemeTokens } from "../theme";

/**
 * The widget's square icon buttons — header actions, close crosses, the
 * settings trigger. They sit on their tray unfilled until pointed at,
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
  const styles = useStyles(buttonStyles);
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

function buttonStyles(t: ThemeTokens) {
  return {
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
      color: t.fgMuted,
      cursor: "pointer",
      padding: 0,
      transition: "background 150ms ease, color 150ms ease",
    },
    outlined: {
      borderColor: t.controlBorder,
      background: t.controlBg,
      color: t.fg,
    },
    filled: {
      background: t.bgSubtle,
      color: t.fg,
    },
  } satisfies Record<string, CSSProperties>;
}
