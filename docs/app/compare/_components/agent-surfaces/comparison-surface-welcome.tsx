"use client";

import { AlignLeft, Blocks, Sparkles } from "lucide-react";
import styles from "../../chat-page.module.css";
import type { ComparisonMode } from "../comparison-mode-controller";

const CONTENT = {
  markdown: {
    icon: AlignLeft,
    description: "AI responses without OpenUI.",
  },
  oss: {
    icon: Blocks,
    description: "AI responses with OpenUI OSS.",
  },
  cloud: {
    icon: Sparkles,
    description: "AI responses with OpenUI Cloud.",
  },
} as const;

export function ComparisonSurfaceWelcome({ mode }: { mode: ComparisonMode }) {
  const { icon: Icon, description } = CONTENT[mode];

  return (
    <div className={styles.surfaceWelcome}>
      <span className={styles.surfaceWelcomeIcon} aria-hidden="true">
        <Icon size={24} strokeWidth={1.6} />
      </span>
      <p>{description}</p>
    </div>
  );
}
