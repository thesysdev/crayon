import { CloudFeatureCard } from "../FeaturesSection";
import cloudStyles from "../FeaturesSection.module.css";
import styles from "./sections.module.css";

export function UsageSection() {
  return (
    <section
      className={`${cloudStyles.section} ${styles.usageSection}`}
      aria-label="Gateway usage, cost, and correction reporting"
    >
      <CloudFeatureCard
        image="/images/gateway/usage-light.png"
        imageDark="/images/gateway/usage-dark.png"
        imageAlt="Gateway activity dashboard showing requests, token volume, estimated cost, and usage by model"
        title="Usage, cost, and corrections"
        headline="in a single view"
        description="See usage and costs across generation and delivery, along with how often Gateway repairs invalid output."
        unoptimized
      />
    </section>
  );
}
