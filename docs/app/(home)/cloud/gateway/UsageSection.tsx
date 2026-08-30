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
        image="/openui-cloud/reliability.svg"
        imageDark="/openui-cloud/reliability-dark.svg"
        imageAlt="OpenUI Gateway usage, cost, and correction dashboard"
        title="Usage, cost, and corrections"
        headline="in a single view"
        description="See how generations are delivered, what they cost, and how often Gateway corrects them."
      />
    </section>
  );
}
