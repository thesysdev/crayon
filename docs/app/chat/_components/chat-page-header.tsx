"use client";

import { ClipboardCommandButton } from "@/app/(home)/components/Button/Button";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import type { ChatMode } from "./chat-types";

const CLI_COMMANDS = [
  { id: "pnpm", runner: "pnpx", command: "pnpx @openuidev/cli@latest create" },
  { id: "bun", runner: "bunx", command: "bunx @openuidev/cli@latest create" },
  { id: "yarn", runner: "yarn dlx", command: "yarn dlx @openuidev/cli@latest create" },
  { id: "npm", runner: "npx", command: "npx @openuidev/cli@latest create" },
] as const;

function BuildForFreeMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  const handleHoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelScheduledClose();
    setOpen(true);
  };

  const handleHoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      className={styles.ctaWrap}
      ref={wrapRef}
      onPointerEnter={handleHoverOpen}
      onPointerLeave={handleHoverClose}
    >
      <button
        type="button"
        ref={triggerRef}
        className={styles.ctaButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Build for free</span>
        <ArrowRight
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className={styles.ctaArrow}
          data-open={open}
        />
      </button>

      <div className={`${styles.ctaMenu} ${open ? styles.ctaMenuOpen : ""}`.trim()}>
        <div
          className={styles.ctaMenuCard}
          role="menu"
          aria-label="Copy the setup command for a package manager"
        >
          {CLI_COMMANDS.map((item) => (
            <ClipboardCommandButton
              key={item.id}
              command={item.command}
              className={styles.ctaMenuItem}
              iconContainerClassName={styles.ctaMenuItemIcon}
              copyIconColor="currentColor"
            >
              <span className={styles.ctaMenuItemLabel}>
                <span className={styles.ctaMenuItemRunner}>{item.runner}</span>
                {item.command.slice(item.runner.length)}
              </span>
            </ClipboardCommandButton>
          ))}
        </div>
      </div>
    </div>
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
        <Link className={styles.backLink} href="/" prefetch={false} aria-label="Back to docs">
          <ArrowLeft aria-hidden="true" size={15} strokeWidth={2} />
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
            <ToggleItem id="chat-mode-oss" value="oss" className={styles.modeItem}>
              OpenUI OSS
            </ToggleItem>
            <ToggleItem id="chat-mode-cloud" value="cloud" className={styles.modeItem}>
              OpenUI Cloud
            </ToggleItem>
          </ToggleGroup>
        </div>

        <BuildForFreeMenu />
      </div>
    </header>
  );
}
