"use client";
import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import styles from "./Footer.module.css";

// A segmented control rather than the header's single swap button: down here the
// current choice is worth showing, and "system" has no opposite to swap to.
// System sits in the middle, between the two it can resolve to.
const THEMES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "system", label: "System", Icon: Monitor },
  { id: "dark", label: "Dark", Icon: Moon },
] as const;

// Never fires: the value we want differs only between the server snapshot and
// the client one, which is precisely the "have we hydrated yet" signal.
const NEVER_CHANGES = () => () => {};

export function ThemeTabs() {
  // `theme`, not `resolvedTheme`: the latter resolves "system" to light or dark,
  // which would light up the wrong segment.
  const { setTheme, theme } = useTheme();
  // The server has no theme to render, so nothing is marked active until mount.
  // Read as an external store rather than set from an effect, which would kick
  // off a second render on every mount.
  const mounted = useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
  const active = mounted ? theme : undefined;

  return (
    <div className={styles.themeTabs} role="group" aria-label="Colour theme">
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`${styles.themeTab} ${active === id ? styles.themeTabActive : ""}`.trim()}
          aria-pressed={active === id}
          aria-label={`Use ${label.toLowerCase()} theme`}
          title={`Use ${label.toLowerCase()} theme`}
          onClick={() => setTheme(id)}
        >
          {/* Line weight rather than fill: at 16px the solid shapes read as
              blobs, and the outline matches the social row below. */}
          <Icon className={styles.themeTabIcon} weight="regular" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
