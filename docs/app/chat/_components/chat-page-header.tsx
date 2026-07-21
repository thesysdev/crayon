"use client";

import { copyText } from "@/lib/copy-text";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft, Check, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import { COMPARISON_PAIRS, type ComparisonPair } from "./chat-types";

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
  pair: ComparisonPair;
  onPairChange: (pair: ComparisonPair) => void;
}

export function ChatPageHeader({ pair, onPairChange }: ChatPageHeaderProps) {
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
            value={pair}
            aria-label="Comparison pair"
            className={styles.modeGroup}
            onValueChange={(value) => {
              if (COMPARISON_PAIRS.some((option) => option.id === value)) {
                onPairChange(value as ComparisonPair);
              }
            }}
          >
            {COMPARISON_PAIRS.map((option) => (
              <ToggleItem
                key={option.id}
                id={`chat-pair-${option.id}`}
                value={option.id}
                className={styles.modeItem}
              >
                {option.label}
              </ToggleItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </header>
  );
}
