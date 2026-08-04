"use client";

import { BuildForFreeMenu } from "@/app/_components/build-for-free-menu";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import styles from "../chat-page.module.css";
import { isViewportPreset, type ViewportPreset } from "./viewport-presets";

interface ChatPageHeaderProps {
  viewport: ViewportPreset;
  onViewportChange: (viewport: ViewportPreset) => void;
}

export function ChatPageHeader({ viewport, onViewportChange }: ChatPageHeaderProps) {
  return (
    <header className={styles.header} aria-label="OpenUI chat controls">
      <div className={styles.headerRow}>
        <Link className={styles.backLink} href="/" prefetch={false} aria-label="Back to docs">
          <ArrowLeft aria-hidden="true" size={15} strokeWidth={2} />
        </Link>

        <div className={styles.viewportControl}>
          <ToggleGroup
            type="single"
            value={viewport}
            aria-label="Preview width"
            className={styles.viewportGroup}
            onValueChange={(value) => {
              if (isViewportPreset(value)) onViewportChange(value);
            }}
          >
            <ToggleItem
              id="chat-viewport-mobile"
              value="mobile"
              className={styles.viewportItem}
              aria-label="Preview mobile width"
              title="Mobile preview"
            >
              <Smartphone aria-hidden="true" size={15} />
              <span className={styles.viewportItemLabel}>Mobile</span>
            </ToggleItem>
            <ToggleItem
              id="chat-viewport-tablet"
              value="tablet"
              className={styles.viewportItem}
              aria-label="Preview tablet width"
              title="Tablet preview"
            >
              <Tablet aria-hidden="true" size={15} />
              <span className={styles.viewportItemLabel}>Tablet</span>
            </ToggleItem>
            <ToggleItem
              id="chat-viewport-desktop"
              value="desktop"
              className={styles.viewportItem}
              aria-label="Preview desktop width"
              title="Desktop preview"
            >
              <Monitor aria-hidden="true" size={15} />
              <span className={styles.viewportItemLabel}>Desktop</span>
            </ToggleItem>
          </ToggleGroup>
        </div>

        <BuildForFreeMenu analyticsSource="chat_navbar" className={styles.buildForFreeMenu} />
      </div>
    </header>
  );
}
