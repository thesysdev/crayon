"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Browsers,
  Eye,
  Palette,
  PaperPlaneRight,
  Presentation,
  SealCheck,
  ShieldCheck,
  type Icon,
} from "@phosphor-icons/react";
import { BevelButton } from "../../components/Button/BevelButton";
import { ExpandChevron } from "../../components/ExpandChevron";
import { useSingleOpenAccordion } from "../../components/MobileAccordion/useSingleOpenAccordion";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

const FEATURES: {
  Icon: Icon;
  title: string;
  description: string;
  tags: string[];
}[] = [
  {
    Icon: Browsers,
    title: "Production-grade rendering",
    description:
      "Tested, responsive components that render consistently across browsers, devices, and screen sizes.",
    tags: [
      "Pre-tested components",
      "Cross-browser compatibility",
      "Built-in accessibility",
      "Responsive by default",
    ],
  },
  {
    Icon: Presentation,
    title: "Editable artifact generation",
    description:
      "Generate static artifacts like slides and reports, and live artifacts like dashboards and pages.",
    tags: [
      "Template support",
      "Editable text and charts",
      "Editable layouts",
      "Export as PPTX",
      "Export as PDF",
    ],
  },
  {
    Icon: Palette,
    title: "Bring your design system",
    description:
      "Apply your fonts, colors, spacing, and component styles across every generated interface.",
    tags: [
      "Design tokens",
      "Typography",
      "Component variants",
      "Brand configurations",
    ],
  },
  {
    Icon: SealCheck,
    title: "Output validation",
    description:
      "Detect and correct invalid model output before it turns into broken UI.",
    tags: ["Error correction", "Model normalization"],
  },
  {
    Icon: ShieldCheck,
    title: "Model & provider resilience",
    description:
      "Keep generated UI working across model quirks, upgrades, slowdowns, and provider failures.",
    tags: ["Version pinning", "Rollbacks", "Provider fallbacks"],
  },
  {
    Icon: Eye,
    title: "Observability & audit trail",
    description:
      "Track performance, failures, cost, and what was rendered across your deployment.",
    tags: [
      "Render success rates",
      "Latency percentiles",
      "Error frequency",
      "Audit trail",
    ],
  },
];

const CHIPS = FEATURES.flatMap((feature) => feature.tags);

export function CloudSection() {
  // Mobile-only: all rows collapsed by default; one expands at a time and the
  // open one can be tapped to collapse.
  const accordion = useSingleOpenAccordion();

  return (
    <section id={CLOUD_SECTION_ID} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <SectionHeader
            tone="dark"
            title={
              <>
                Introducing OpenUI{" "}
                <span className={styles.titleTag}>Cloud</span>
              </>
            }
            subtitle="Production-ready Generative UI"
          >
            <div className={styles.headerCtas}>
              <BevelButton
                className={styles.headerPrimaryCta}
                href="/compare"
                label="Try Demo"
                badge={<ArrowRight size={16} weight="bold" />}
              />
              <BevelButton
                variant="dark"
                className={styles.headerSecondaryCta}
                href="/docs/agent/getting-started/openui-cloud"
                label="View Documentation"
                badge={<ArrowUpRight size={16} weight="bold" />}
              />
            </div>
          </SectionHeader>
        </div>

        <div className={styles.grid}>
          {FEATURES.map(({ Icon, title, description }, index) => {
            return (
              <div
                className={styles.feature}
                key={index}
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
            );
          })}
        </div>

        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            {[...CHIPS, ...CHIPS].map((tag, index) => (
              <span
                className={styles.tag}
                key={index}
                aria-hidden={index >= CHIPS.length || undefined}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.contact}>
          <p className={styles.contactText}>
            Want to learn more, or need hands-on engineering support?
          </p>
          <BevelButton
            variant="dark"
            className={styles.contactCta}
            external
            href="https://zcal.co/t/thesys/demo"
            label="Talk to our team"
            badge={<PaperPlaneRight size={16} weight="bold" />}
          />
        </div>
      </div>
    </section>
  );
}
