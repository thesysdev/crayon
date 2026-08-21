"use client";

import { copyText } from "@/lib/copy-text";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    if (!(await copyText(command))) return;

    setCopied(true);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      aria-label={copied ? "Command copied" : "Copy command"}
      className={styles.copyCommand}
      onClick={handleCopy}
      type="button"
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
