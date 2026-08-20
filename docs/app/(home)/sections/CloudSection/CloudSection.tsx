"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Browsers,
  Palette,
  PaperPlaneRight,
  Presentation,
  SealCheck,
  ShieldCheck,
  type Icon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { BevelButton } from "../../components/Button/BevelButton";
import { ExpandChevron } from "../../components/ExpandChevron";
import { useSingleOpenAccordion } from "../../components/MobileAccordion/useSingleOpenAccordion";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

/* Reliability leads the grid two columns wide, with Reports beside it carrying
   the one piece of artwork — the capability worth showing rather than naming.
   Everything below is an icon + title line. The icon stays on every row for
   phones, where each card collapses to that line.

   `light` and `dark` name the page theme each tile was drawn for, matching how
   FeaturesSection labels them. Which one this band shows is inverted; see the
   stylesheet. */
const FEATURES: {
  Icon: Icon;
  image?: { light: string; dark: string };
  wide?: boolean;
  title: string;
  description: string;
  tags: string[];
}[] = [
  {
    Icon: SealCheck,
    /* Spans two columns on desktop, so its artwork is drawn wider and flatter
       than the other tiles — see the wide-card override in the stylesheet. */
    wide: true,
    image: {
      light: "/openui-cloud/reliability.svg",
      dark: "/openui-cloud/reliability-dark.svg",
    },
    title: "Reliability",
    description:
      "Every response is checked against your component library and corrected mid-stream, before it can render as broken UI. Track render success, errors, and what shipped across your deployment.",
    tags: [
      "Error correction",
      "Model normalization",
      "Render success rates",
      "Error frequency",
      "Audit trail",
    ],
  },
  {
    Icon: Presentation,
    image: {
      /* No ?v= cache-buster like FeaturesSection carries: next/image rejects a
         query string unless images.localPatterns allows one, and this is a new
         reference with no cached copy to bust. */
      light: "/openui-cloud/reports&presentation.png",
      dark: "/openui-cloud/reports&presentations-dark.png",
    },
    title: "Reports and Slides Generation",
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
    Icon: ShieldCheck,
    title: "Model & provider resilience",
    description:
      "Keep generated UI working across model quirks, upgrades, slowdowns, and provider failures.",
    tags: ["Version pinning", "Rollbacks", "Provider fallbacks"],
  },
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
    Icon: Palette,
    title: "Bring your design system",
    description:
      "Apply your fonts, colors, spacing, and component styles across every generated interface.",
    tags: ["Design tokens", "Typography", "Component variants", "Brand configurations"],
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
                Introducing OpenUI <span className={styles.titleTag}>Cloud</span>
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
          {FEATURES.map(({ Icon, image, wide, title, description }, index) => {
            return (
              <div
                className={`${styles.feature} ${wide ? styles.featureWide : ""}`.trim()}
                key={index}
                {...accordion.getToggleProps(index)}
              >
                {image && (
                  /* Both tiles ship; CSS picks one. Decorative either way: the
                     title and description already carry the meaning. */
                  <span className={styles.shot} aria-hidden="true">
                    <Image
                      className={`${styles.shotImage} ${styles.shotOnDark}`}
                      src={image.dark}
                      alt=""
                      width={720}
                      height={400}
                      loading="lazy"
                    />
                    <Image
                      className={`${styles.shotImage} ${styles.shotOnLight}`}
                      src={image.light}
                      alt=""
                      width={720}
                      height={400}
                      loading="lazy"
                    />
                  </span>
                )}
                {!wide && (
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={28} weight="light" />
                  </span>
                )}
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
