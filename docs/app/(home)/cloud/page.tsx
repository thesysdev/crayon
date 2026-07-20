import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { LogoStrip } from "../sections/LogoStrip/LogoStrip";
import { CloudIntegrationSection } from "./CloudIntegrationSection";
import { FeaturesSection } from "./FeaturesSection";
import cloudStyles from "./page.module.css";

export const metadata: Metadata = {
  title: "OpenUI Cloud - Managed Generative UI Infrastructure",
  description:
    "Build production agent interfaces with managed conversations, generative UI, artifacts, theming, resilience, and observability.",
  alternates: { canonical: "/cloud" },
  openGraph: {
    title: "OpenUI Cloud — Generative UI, ready for production",
    description:
      "The managed backend for production agent interfaces, powered by the open-source OpenUI rendering engine.",
    url: "/cloud",
    type: "website",
  },
};

export default function OpenUICloudPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          title={
            <span className={cloudStyles.titleBlock}>
              <span className={cloudStyles.eyebrow}>
                OpenUI <span className={cloudStyles.cloudTag}>Cloud</span>
              </span>
              <span className={cloudStyles.title}>API for running OpenUI in Production</span>
            </span>
          }
          subtitle={
            <span className={cloudStyles.subtitle}>
              One API for models, fallbacks, validation, rendering, and observability.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={
            <div className={cloudStyles.ctaGroup}>
              <BevelButton
                href="https://console.thesys.dev/keys"
                external
                variant="primary"
                label="Get API Key"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
              <BevelButton
                href="https://zcal.co/t/thesys/demo"
                external
                variant="secondary"
                label="Get a demo"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={<div className={cloudStyles.heroPlaceholder} aria-hidden="true" />}
          mobilePreviewSlot={<div className={cloudStyles.heroPlaceholder} aria-hidden="true" />}
        />
        <LogoStrip label="Powering AI experiences at:" />
        <FeaturesSection />
        <CloudIntegrationSection />
      </div>
      <Footer />
    </div>
  );
}
