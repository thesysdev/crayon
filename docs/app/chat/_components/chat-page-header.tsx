"use client";

import { BuildForFreeMenu } from "@/app/_components/build-for-free-menu";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "../chat-page.module.css";
import type { ChatMode } from "./chat-types";

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

        <BuildForFreeMenu className={styles.buildForFreeMenu} />
      </div>
    </header>
  );
}
