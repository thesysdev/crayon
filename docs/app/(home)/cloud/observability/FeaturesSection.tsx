import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./FeaturesSection.module.css";

/* No docs to point at yet, so the copy column ends at the body text. Cloud's
   version closes with a "Read docs" button; add it back per feature once each
   has somewhere to go. */
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
      <div className={styles.bodyGroup}>
        <p className={styles.body}>{description}</p>
      </div>
    </div>
  );
}

/* Authored at 1440x800 and declared at half that, so the pair is sharp on a
   retina screen while occupying the 720x400 slot the layout expects. */
function FeatureShot({ shot, alt }: { shot: string; alt: string }) {
  return (
    <>
      <Image
        className={`${styles.featureImage} ${styles.featureImageLight}`}
        src={`/openui-observability/${shot}-light.webp`}
        alt={alt}
        width={720}
        height={400}
      />
      <Image
        className={`${styles.featureImage} ${styles.featureImageDark}`}
        src={`/openui-observability/${shot}-dark.webp`}
        alt=""
        aria-hidden="true"
        width={720}
        height={400}
      />
    </>
  );
}

type Feature = {
  title: string;
  headline: ReactNode;
  description: string;
  /* Basename under /public/openui-observability/, which the light and dark
     files hang off. */
  shot: string;
};

const FEATURES: Feature[] = [
  {
    title: "Session replay",
    shot: "session-replay",
    headline: "See every session as it happened",
    description:
      "Replay conversations with the exact generative UI your users saw, not just the text behind it.",
  },
  {
    title: "Annotations",
    shot: "annotations",
    headline: "Turn sessions into feedback",
    description:
      "Annotate responses, add comments, assign severity, and share feedback with your dev team right where the issue happened.",
  },
  {
    title: "Timeline",
    shot: "timeline",
    headline: "Understand the journey at a glance",
    description:
      "Follow a simplified timeline of queries, actions, responses, and issues without digging through complex traces.",
  },
  {
    title: "Insights",
    shot: "insights",
    headline: "Learn what users want next",
    description:
      "See the skills users rely on most, what\u2019s missing, and which new demands are starting to emerge.",
  },
];

export function FeaturesSection() {
  return (
    <section className={styles.section} aria-label="Features">
      {FEATURES.map((feature, index) => (
        /* Alternating sides, as on Cloud: art leads the odd cards, copy the
             even ones, so the page does not read as one column. */
        <article key={feature.title} className={styles.card}>
          {index % 2 === 0 ? (
            <>
              <FeatureShot shot={feature.shot} alt={`${feature.title} in OpenUI Observability`} />
              <FeatureCopy {...feature} />
            </>
          ) : (
            <>
              <FeatureCopy {...feature} />
              <FeatureShot shot={feature.shot} alt={`${feature.title} in OpenUI Observability`} />
            </>
          )}
        </article>
      ))}
    </section>
  );
}
