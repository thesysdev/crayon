"use client";

import { copyText } from "@/lib/copy-text";
import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft, Check, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import type { ChatMode, CloudAvailability } from "./chat-types";

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
      onClick={handleCopy}
      aria-label={copied ? `Copied: ${CREATE_COMMAND}` : `Copy command: ${CREATE_COMMAND}`}
      title={`Copy command: ${CREATE_COMMAND}`}
    >
      {copied ? (
        <Check size={17} strokeWidth={2} aria-hidden="true" />
      ) : (
        <SquareTerminal size={17} strokeWidth={1.8} aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "Copied" : CREATE_COMMAND}</span>
    </button>
  );
}

interface ChatPageHeaderProps {
  mode: ChatMode;
  availability: CloudAvailability;
  cloudFailed: boolean;
  isRunning: boolean;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatPageHeader({
  mode,
  availability,
  cloudFailed,
  isRunning,
  onModeChange,
}: ChatPageHeaderProps) {
  const cloudUnavailable = availability === "unavailable" || cloudFailed;
  const cloudDisabled = availability !== "available" || cloudFailed || isRunning;
  const modeStatusId = "chat-mode-status";
  const modeStatus = isRunning
    ? "Stop the current response before switching modes."
    : availability === "checking"
      ? "Checking OpenUI Cloud availability…"
      : cloudUnavailable
        ? OPENUI_CLOUD_UNAVAILABLE_MESSAGE
        : "";

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
            <ToggleItem
              id="chat-mode-oss"
              value="oss"
              disabled={isRunning}
              aria-describedby={isRunning ? modeStatusId : undefined}
              className={styles.modeItem}
            >
              OpenUI OSS
            </ToggleItem>
            <ToggleItem
              id="chat-mode-cloud"
              value="cloud"
              disabled={cloudDisabled}
              aria-describedby={cloudDisabled ? modeStatusId : undefined}
              className={styles.modeItem}
            >
              OpenUI Cloud
            </ToggleItem>
          </ToggleGroup>
        </div>
      </div>

      {modeStatus ? (
        <div className={styles.modeDetails}>
          <p id={modeStatusId} className={styles.modeStatus} aria-live="polite">
            {modeStatus}
          </p>
        </div>
      ) : null}
    </header>
  );
}
