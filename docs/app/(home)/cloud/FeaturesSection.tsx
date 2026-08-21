import { Button } from "@/components/button";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import styles from "./FeaturesSection.module.css";

const SUPPORTING_FEATURES: GridFeature[] = [
  {
    icon: "devices",
    title: "Production grade rendering",
    description:
      "Render with production-tested, responsive components built to behave consistently across browsers, devices, and screen sizes.",
  },
  {
    icon: "interaction",
    title: "Stateful experiences",
    description:
      "Preserve conversation context, actions, user input, and interface state across multi-step experiences.",
  },
  {
    icon: "signal",
    title: "Observability",
    description:
      "Understand how models and rendered interfaces behave in production from a single operational view.",
  },
  {
    icon: "shield",
    title: "Secure by default",
    description:
      "Protect production workloads with enterprise-grade security, compliance, and data controls.",
  },
];

function FeatureCopy({
  title,
  headline,
  description,
  docsHref,
}: {
  title: string;
  headline: ReactNode;
  description: string;
  docsHref: string;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.headingGroup}>
        <h2 className={styles.primaryHeading}>{title}</h2>
        <p className={styles.secondaryHeading}>{headline}</p>
      </div>
      <div className={styles.bodyGroup}>
        <p className={styles.body}>{description}</p>
        <Button href={docsHref} text="Read docs" variant="tertiary" />
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <>
      <section className={styles.section} aria-label="OpenUI Cloud features">
        <article className={styles.card}>
          <Image
            className={`${styles.featureImage} ${styles.featureImageLight}`}
            src="/openui-cloud/validation.svg"
            alt="OpenUI Cloud validating and correcting model output"
            width={720}
            height={400}
          />
          <Image
            className={`${styles.featureImage} ${styles.featureImageDark}`}
            src="/openui-cloud/validation-dark.svg"
            alt=""
            aria-hidden="true"
            width={720}
            height={400}
          />
          <FeatureCopy
            title="Reliability"
            headline="Broken model output shouldn’t become broken UI"
            description="Every response is validated against your component library and corrected in the streaming path, not as a retry your user waits through."
            docsHref="https://www.openui.com/docs/openui-cloud/production-readiness"
          />
        </article>

        <article className={styles.card}>
          <FeatureCopy
            title="Managed model access"
            headline={
              <>
                Every model.
                <br />
                One API.
              </>
            }
            description="Access leading models across providers through a single API. OpenUI Cloud handles fallbacks when a model or provider becomes unavailable."
            docsHref="https://www.openui.com/docs/openui-cloud/production-readiness"
          />
          <Image
            className={`${styles.featureImage} ${styles.featureImageLight}`}
            src="/openui-cloud/llm-gateway.svg"
            alt="OpenUI Cloud routing requests across model providers"
            width={720}
            height={400}
          />
          <Image
            className={`${styles.featureImage} ${styles.featureImageDark}`}
            src="/openui-cloud/llm-gateway-dark.svg"
            alt=""
            aria-hidden="true"
            width={720}
            height={400}
          />
        </article>

        <article className={styles.card}>
          <Image
            className={`${styles.featureImage} ${styles.featureImageLight}`}
            src="/openui-cloud/reports&presentation.png?v=20260723-1444"
            alt="OpenUI Cloud reports and presentation artifacts"
            width={720}
            height={400}
            unoptimized
          />
          <Image
            className={`${styles.featureImage} ${styles.featureImageDark}`}
            src="/openui-cloud/reports&presentations-dark.png"
            alt=""
            aria-hidden="true"
            width={720}
            height={400}
            unoptimized
          />
          <FeatureCopy
            title="Live & Static Artifacts"
            headline="Generate more than chat responses"
            description="Turn model output into complete, polished artifacts, from interactive dashboards and reports to polished & editable presentations & reports."
            docsHref="https://www.openui.com/docs/openui-cloud/build/slides"
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
          desktopColumns={4}
        />
      </div>
    </>
  );
}
