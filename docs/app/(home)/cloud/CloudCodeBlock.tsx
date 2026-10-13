"use client";

import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";
import { useSyncExternalStore } from "react";
import styles from "./CloudCodeBlock.module.css";

const subscribeToHydration = () => () => {};

/* vsDark draws constants in rgb(100, 102, 149), only 3.3:1 on the panel's dark
   fill. Same hue, lifted to clear 4.5:1. */
const darkTheme = {
  ...themes.vsDark,
  styles: themes.vsDark.styles.map((entry) =>
    entry.types.includes("constant")
      ? { ...entry, style: { ...entry.style, color: "rgb(139, 141, 189)" } }
      : entry,
  ),
};

/* `highlightLines` are 0-based indices into the trimmed source. It defaults to
   the single line Cloud's integration section has always marked, so existing
   callers keep their highlight without passing anything. */
export function CloudCodeBlock({
  code,
  highlightLines = [4],
  dimUnchanged = false,
}: {
  code: string;
  highlightLines?: number[];
  dimUnchanged?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={`${styles.panel} ${dimUnchanged ? styles.dimUnchanged : ""}`.trim()}>
      <Highlight
        theme={isDark ? darkTheme : themes.github}
        code={code.trim()}
        language="typescript"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} ${styles.code}`}
            style={{ ...style, background: "transparent", backgroundColor: "transparent" }}
          >
            <code>
              {tokens.map((line, lineIndex) => (
                <span
                  key={lineIndex}
                  {...getLineProps({ line })}
                  className={`${styles.codeLine} ${
                    highlightLines.includes(lineIndex) ? styles.changedLine : ""
                  }`}
                >
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
