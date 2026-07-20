import type { ReactNode } from "react";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import styles from "./FeaturesSection.module.css";

const SUPPORTING_FEATURES: GridFeature[] = [
  {
    title: "Production grade rendering",
    description:
      "Render with production-tested, responsive components built to behave consistently across browsers, devices, and screen sizes.",
  },
  {
    title: "Stateful experiences",
    description:
      "Preserve conversation context, actions, user input, and interface state across multi-step experiences.",
  },
  {
    title: "Observability",
    description:
      "Understand how models and rendered interfaces behave in production from a single operational view.",
  },
];

function FeatureCopy({
  title,
  headline,
  description,
}: {
  title: string;
  headline: ReactNode;
  description: string;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.headingGroup}>
        <h2 className={styles.primaryHeading}>{title}</h2>
        <p className={styles.secondaryHeading}>{headline}</p>
      </div>
      <p className={styles.body}>{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <>
      <section className={styles.section} aria-label="OpenUI Cloud features">
        <article className={styles.card}>
          <div className={styles.imagePlaceholder} aria-hidden="true" />
          <FeatureCopy
            title="Reliable model access"
            headline={
              <>
                Every model.
                <br />
                One reliable API.
              </>
            }
            description="Access leading models across providers through a single API. OpenUI Cloud handles fallbacks when a model or provider becomes unavailable."
          />
        </article>

        <article className={styles.card}>
          <FeatureCopy
            title="Built-in validation"
            headline="Broken model output shouldn’t become broken UI"
            description="Make sure broken responses never reach your user. OpenUI Cloud detects invalid responses, corrects issues, and safely renders the result, in real-time."
          />
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        </article>

        <article className={styles.card}>
          <div className={styles.imagePlaceholder} aria-hidden="true" />
          <FeatureCopy
            title="Slides, Reports and Dashboards"
            headline="Generate more than chat responses"
            description="Turn model output into complete, polished artifacts, from interactive dashboards and reports to polished & editable presentations & reports."
          />
        </article>
      </section>

      <div className={styles.supportingFeatures}>
        <FeatureGridSection
          features={SUPPORTING_FEATURES}
          showHeader={false}
          showCompat={false}
          showTopSeparator
          showBottomSeparator={false}
        />
      </div>
    </>
  );
}
