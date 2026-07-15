"use client";

import { copyText } from "@/lib/copy-text";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft, Check, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import type { ChatMode } from "./chat-types";

const CREATE_COMMAND = "npx @openuidev/cli@latest create";
const COPY_FEEDBACK_MS = 1800;

function StartLocallyButton() {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!(await copyText(CREATE_COMMAND))) return;

    setCopied(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <button
      type="button"
      className={styles.startLocallyButton}
      data-copied={copied}
      onClick={handleCopy}
      aria-label={`Copy local setup command: ${CREATE_COMMAND}`}
    >
      {copied ? (
        <Check size={17} strokeWidth={2} aria-hidden="true" />
      ) : (
        <SquareTerminal size={17} strokeWidth={1.8} aria-hidden="true" />
      )}
      <span className={styles.startLocallyLabelGroup} aria-hidden="true">
        <span className={`${styles.startLocallyLabel} ${styles.startLocallyDefault}`}>
          Run on your machine
        </span>
        <span className={`${styles.startLocallyLabel} ${styles.startLocallyCommand}`}>
          {CREATE_COMMAND}
        </span>
        <span className={`${styles.startLocallyLabel} ${styles.startLocallyCopied}`}>Copied</span>
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {copied ? "Local setup command copied." : ""}
      </span>
    </button>
  );
}

interface ChatPageHeaderProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatPageHeader({ mode, onModeChange }: ChatPageHeaderProps) {
  return (
    <header className={styles.header} aria-label="OpenUI chat controls">
      <div className={styles.headerRow}>
        <Link className={styles.backLink} href="/" prefetch={false}>
          <ArrowLeft aria-hidden="true" size={17} />
          <span>Back to docs</span>
        </Link>

        <StartLocallyButton />

        <div className={styles.modeControl}>
          <ToggleGroup
            type="single"
            value={mode}
            aria-label="OpenUI implementation"
            className={styles.modeGroup}
            onValueChange={(value) => {
              if (value === "oss" || value === "cloud") onModeChange(value);
            }}
          >
            <ToggleItem id="chat-mode-oss" value="oss" className={styles.modeItem}>
              OpenUI OSS
            </ToggleItem>
            <ToggleItem id="chat-mode-cloud" value="cloud" className={styles.modeItem}>
              OpenUI Cloud
            </ToggleItem>
          </ToggleGroup>
        </div>
      </div>
    </header>
  );
}
