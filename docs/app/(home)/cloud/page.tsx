import type { Metadata } from "next";
import styles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { LogoStrip } from "../sections/LogoStrip/LogoStrip";
import { CloudCtaSection } from "./CloudCtaSection";
import { CloudHero } from "./CloudHero";
import { CloudIntegrationSection } from "./CloudIntegrationSection";
import { ComparisonSection } from "./ComparisonSection";
import { EnterpriseSection } from "./EnterpriseSection";
import { FeaturesSection } from "./FeaturesSection";
import { ThemeImageController } from "./ThemeImageController";

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
    images: [
      {
        url: "/meta-image.png?v=20260725-1708",
        width: 1800,
        height: 942,
        alt: "OpenUI Cloud preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenUI Cloud — Generative UI, ready for production",
    description:
      "The managed backend for production agent interfaces, powered by the open-source OpenUI rendering engine.",
    images: ["/meta-image.png?v=20260725-1708"],
  },
};

export default function OpenUICloudPage() {
  return (
    <>
      <main className={styles.page}>
        <div className={styles.heroShell}>
          <CloudHero />
          <LogoStrip label="Powering AI experiences at:" variant="cloud" />
          <FeaturesSection />
          <CloudIntegrationSection />
          <ComparisonSection />
          <EnterpriseSection />
          <CloudCtaSection />
        </div>
      </main>
      <Footer />
      <ThemeImageController />
    </>
  );
}
