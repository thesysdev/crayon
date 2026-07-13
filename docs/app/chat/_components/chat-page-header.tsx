"use client";

import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "../chat-page.module.css";
import type { ChatMode, CloudAvailability } from "./chat-types";

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
        ? "OpenUI Cloud is unavailable."
        : "";

  return (
    <header className={styles.header} aria-label="OpenUI chat controls">
      <div className={styles.headerRow}>
        <Link className={styles.backLink} href="/" prefetch={false}>
          <ArrowLeft aria-hidden="true" size={17} />
          <span>Back to docs</span>
        </Link>

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
