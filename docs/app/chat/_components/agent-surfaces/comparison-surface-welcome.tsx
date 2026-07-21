"use client";

import { Cloud, LayoutTemplate, TextQuote } from "lucide-react";
import styles from "../../chat-page.module.css";
import type { ComparisonMode } from "../comparison-mode-controller";

const CONTENT = {
  markdown: {
    icon: TextQuote,
    description: "AI responses rendered as standard Markdown.",
  },
  oss: {
    icon: LayoutTemplate,
    description: "Interactive responses rendered with the open-source OpenUI library.",
  },
  cloud: {
    icon: Cloud,
    description: "Managed generative responses with tools and full-page artifacts.",
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
