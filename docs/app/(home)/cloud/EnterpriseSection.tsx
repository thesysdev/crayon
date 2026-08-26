import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import styles from "./EnterpriseSection.module.css";

const ENTERPRISE_FEATURES: GridFeature[] = [
  {
    icon: "shield",
    title: "Enterprise-grade security",
    description: "SOC 2, ISO 27001, and GDPR compliant.",
  },
  {
    icon: "database",
    title: "Zero data retention for training",
    description: "Your data is never used to train models.",
  },
  {
    icon: "cloud",
    title: "Flexible deployment options",
    description: "Choose fully managed cloud or deployment in your own environment.",
  },
  {
    icon: "chart",
    title: "Enterprise observability",
    description:
      "Monitor usage, latency, failures, and rendered output across teams and environments.",
  },
  {
    icon: "pulse",
    title: "Enterprise support & reliability",
    description: "SLAs, proactive monitoring, and 24/7 support.",
  },
  {
    icon: "handshake",
    title: "Hands-on support & co-building",
    description:
      "Work directly with our team to design, build, and launch your production OpenUI experience.",
  },
];

export function EnterpriseSection() {
  return (
    <section className={styles.section} aria-labelledby="enterprise-section-title">
      <div className={styles.header}>
        <h2 id="enterprise-section-title" className={styles.title}>
          Built for production-scale enterprise use
        </h2>
        <Link className={styles.link} href="https://trust.thesys.dev/" target="_blank" rel="noopener noreferrer">
          View trust center
          <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
        </Link>
      </div>
      <FeatureGridSection
        features={ENTERPRISE_FEATURES}
        showHeader={false}
        showCompat={false}
        showBottomSeparator={false}
        flushOuterCards
      />
    </section>
  );
}
