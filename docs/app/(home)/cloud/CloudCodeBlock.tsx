"use client";

import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useState } from "react";
import styles from "./CloudCodeBlock.module.css";

export function CloudCodeBlock({ code }: { code: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.language}>TypeScript</span>
        <button type="button" className={styles.copyButton} onClick={copyCode}>
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <Highlight
        theme={isDark ? themes.vsDark : themes.github}
        code={code.trim()}
        language="typescript"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} ${styles.code}`}
            style={{ ...style, background: "transparent" }}
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
