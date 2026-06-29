"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import {
  BellIcon,
  BrowserIcon,
  EyeIcon,
  MagicWandIcon,
  PushPinIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { PillLink } from "../../components/Button/Button";
import { FeatureList, type FeatureListItem } from "../../components/FeatureList/FeatureList";
import styles from "./FeaturesSection.module.css";

const PHOSPHOR_ICON_SIZE = 18;

function SvgPathIcon({ path, index }: { path: string; index: number }) {
  const clipId = `clip_feat_${index}`;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath={`url(#${clipId})`}>
        <path d={path} fill="currentColor" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect fill="white" height="18" width="18" />
        </clipPath>
      </defs>
    </svg>
  );
}

const DEFAULT_FEATURES: FeatureListItem[] = [
  {
    title: "Live data",
    description: "Query your tools and MCP servers at runtime",
    icon: <SvgPathIcon path={svgPaths.p10e86100} index={0} />,
  },
  {
    title: "Works across platforms",
    description: "React, React Native, Vue, etc",
    icon: <SvgPathIcon path={svgPaths.p2cbb5d00} index={1} />,
  },
  {
    title: "Native Streaming",
    description: "UI renders in real time",
    icon: <SvgPathIcon path={svgPaths.p33780400} index={2} />,
  },
  {
    title: "Interactive",
    description: "Reactive state, inputs, and tool-connected actions",
    icon: <SvgPathIcon path={svgPaths.p17c7f700} index={3} />,
  },
  {
    title: "Safe by Default",
    description: "No arbitrary code execution",
    icon: <SvgPathIcon path={svgPaths.p16eec200} index={4} />,
  },
];

export const OPENCLAW_FEATURES: FeatureListItem[] = [
  {
    title: "Generative UI",
    description: "Build apps, dashboards, and artifacts on demand",
    icon: <MagicWandIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Persistent apps",
    description: "Apps stay in place and refresh with live data automatically",
    icon: <PushPinIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Structured workspace",
    description: "Agents, sessions, artifacts, and apps in one organized space",
    icon: <SquaresFourIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Full visibility",
    description: "Inspect tool calls, context, and agent actions in real time",
    icon: <EyeIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Direct control",
    description: "Permissions, schedules, and execution from one interface",
    icon: <SlidersHorizontalIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Live notifications",
    description: "Cron jobs notifications",
    icon: <BellIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Elegant interface",
    description: "Built for clarity with responsive layouts and themes",
    icon: <BrowserIcon size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
];

export function FeaturesSection({
  features = DEFAULT_FEATURES,
  showCta = true,
}: {
  features?: FeatureListItem[];
  showCta?: boolean;
} = {}) {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        {showCta && (
          <div className={styles.header}>
            <h2 className={styles.title}>Renders 3 times faster</h2>
            <p className={styles.subtitle}>With 67% fewer tokens</p>
            <p className={styles.caption}>when compared to JSON-Render</p>
            <div className={styles.ctaWrap}>
              <PillLink
                href="/docs/openui-lang/benchmarks"
                className={`${styles.ctaLink} ${styles.ctaButton}`}
              >
                <span>View benchmarks</span>
              </PillLink>
            </div>
          </div>
        )}

        <FeatureList items={features} />
      </div>
    </div>
  );
}
