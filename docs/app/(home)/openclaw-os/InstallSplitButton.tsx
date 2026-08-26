"use client";

import { copyText } from "@/lib/copy-text";
import { useState } from "react";
import { PLATFORMS, type Platform } from "../components/PlatformLogos";
import styles from "./InstallSplitButton.module.css";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Dedicated install split button for /openclaw-os.
 *
 * One pill (with the white-button bevel) split into two segments by a separator:
 *  - left: platform selection — chips with their own hover + select states
 *  - right: the active command + a copy button (clicking anywhere copies)
 *
 * Only the whole unit has a press hover; the command and copy badge have none.
 */
export function InstallSplitButton({
  macCommand,
  winCommand,
  className,
}: {
  macCommand: string;
  winCommand: string;
  className?: string;
}) {
  const [platform, setPlatform] = useState<Platform>("macos");
  const [copied, setCopied] = useState(false);
  const command = platform === "windows" ? winCommand : macCommand;

  const handleCopy = async () => {
    const ok = await copyText(command);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.unit} ${className ?? ""}`.trim()}>
      <div className={styles.platforms} role="tablist" aria-label="Install platform">
        {PLATFORMS.map(({ id, label, Logo }) => {
          const isActive = platform === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              title={label}
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`.trim()}
              onClick={() => setPlatform(id)}
            >
              <Logo className={styles.chipIcon} />
            </button>
          );
        })}
      </div>

      <span className={styles.separator} aria-hidden="true" />

      <button
        type="button"
        className={styles.command}
        onClick={handleCopy}
        aria-label={copied ? "Command copied" : "Copy install command"}
      >
        <span className={styles.commandText}>
          <span className={styles.commandTicker}>
            <span className={styles.commandTickerText}>{command}</span>
            <span className={styles.commandTickerText} aria-hidden="true">
              {command}
            </span>
          </span>
        </span>
        <span className={styles.copyBadge} aria-hidden="true">
          {copied ? (
            <CheckIcon className={styles.copyIcon} />
          ) : (
            <CopyIcon className={styles.copyIcon} />
          )}
        </span>
      </button>

      <div
        className={`${styles.copyToast} ${copied ? styles.copyToastVisible : ""}`.trim()}
        role="status"
        aria-live="polite"
      >
        Copied. Paste in your terminal to install.
      </div>
    </div>
  );
}
