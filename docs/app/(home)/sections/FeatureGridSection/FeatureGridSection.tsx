"use client";

import type { ReactNode } from "react";
import { ExpandChevron } from "../../components/ExpandChevron";
import {
  ArrowUpRight,
  Broadcast,
  CursorClick,
  Devices,
  Plugs,
  PuzzlePiece,
  ShieldCheck,
  type Icon,
} from "@phosphor-icons/react";
import { BevelButton } from "../../components/Button/BevelButton";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { useSingleOpenAccordion } from "../../components/MobileAccordion/useSingleOpenAccordion";
import { CompatibilitySection } from "../CompatibilitySection/CompatibilitySection";
import styles from "./FeatureGridSection.module.css";

export type GridFeature = { Icon: Icon; title: string; description: string };

const FEATURES: GridFeature[] = [
  {
    Icon: Plugs,
    title: "Live data",
    description:
      "Interfaces query your tools and MCP servers at runtime, so the data is always current.",
  },
  {
    Icon: Devices,
    title: "Cross-platform",
    description:
      "One spec renders natively to React, React Native, Vue, and more.",
  },
  {
    Icon: Broadcast,
    title: "Streaming-first",
    description:
      "UI renders progressively as the model responds, not after the full output.",
  },
  {
    Icon: CursorClick,
    title: "Interactive",
    description:
      "Reactive state, inputs, and actions wired straight to your tools.",
  },
  {
    Icon: ShieldCheck,
    title: "Safe by default",
    description:
      "The model only composes your components and never runs arbitrary code.",
  },
  {
    Icon: PuzzlePiece,
    title: "Bring your own components",
    description:
      "Build from the components and design system you already have.",
  },
];

export function FeatureGridSection({
  features = FEATURES,
  showHeader = true,
  showCompat = true,
  header,
  showBottomSeparator = true,
  fadeColumnLines = false,
}: {
  features?: GridFeature[];
  /** The benchmark header + CTA (OpenUI-specific). Off for sub-product pages. */
  showHeader?: boolean;
  /** The "Works with your stack" compatibility band (OpenUI-specific). */
  showCompat?: boolean;
  /** Custom headline above the grid (with a separator below it), e.g. a page tagline. */
  header?: ReactNode;
  /** The full-width separator at the very bottom of the section (default on). */
  showBottomSeparator?: boolean;
  /** Fade the grid's vertical column dividers out toward the bottom. */
  fadeColumnLines?: boolean;
} = {}) {
  // Mobile-only: all rows collapsed by default; one expands at a time and the
  // open one can be tapped to collapse. Desktop ignores this (CSS shows all).
  const accordion = useSingleOpenAccordion();

  return (
    <section className={styles.section}>
      {showHeader && (
        <>
          <div className={styles.header}>
            <SectionHeader
              title="Renders 3x faster"
              subtitle="with 67% fewer tokens"
              caption="when compared to JSON-Render"
            >
              <div className={styles.ctaWrap}>
                <BevelButton
                  href="/docs/openui-lang/benchmarks"
                  label="View benchmarks"
                  badge={<ArrowUpRight size={16} weight="bold" />}
                />
              </div>
            </SectionHeader>
          </div>
          <div className={styles.separator} />
        </>
      )}
      {header && (
        <>
          <p className={styles.taglineHeader}>{header}</p>
          <div className={styles.separator} />
        </>
      )}
      <div className={`${styles.grid} ${fadeColumnLines ? styles.gridFadeLines : ""}`.trim()}>
        {features.map(({ Icon, title, description }, index) => (
          <div
            className={styles.feature}
            key={title}
            {...accordion.getToggleProps(index)}
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon size={28} weight="light" />
            </span>
            <h3 className={styles.featureTitle}>{title}</h3>
            <ExpandChevron className={styles.chevron} />
            <p className={styles.featureDescription}>
              <span className={styles.featureDescriptionInner}>{description}</span>
            </p>
          </div>
        ))}
      </div>
      {showCompat && (
        <>
          <div className={styles.separator} />
          <div className={styles.compat}>
            <CompatibilitySection
              embedded
              title="OpenUI works with any stack"
              description="OpenUI works with any LLM, UI library, and agent framework. Add generative UI without changing your stack."
            />
          </div>
        </>
      )}
      {showBottomSeparator && (
        <div className={`${styles.separator} ${styles.separatorBottom}`} />
      )}
    </section>
  );
}
