"use client";

import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useState } from "react";
import styles from "./CloudCodeBlock.module.css";

export function CloudCodeBlock({ code }: { code: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={styles.panel}>
      <Highlight
        theme={isDark ? themes.vsDark : themes.github}
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
                  className={`${styles.codeLine} ${lineIndex === 4 ? styles.changedLine : ""}`}
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
