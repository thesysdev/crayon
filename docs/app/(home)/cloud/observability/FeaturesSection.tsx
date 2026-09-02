import Image from "next/image";
import type { ReactNode } from "react";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
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
function FeatureShot({ shot, alt }: { shot?: string; alt: string }) {
  /* PLACEHOLDER — a step whose art has not been made yet. Dashed rather than a
     filled panel so it reads as missing rather than as a design choice, and
     sized to the same 720x400 slot so the layout does not move when the real
     pair lands. */
  if (!shot) {
    return (
      <div className={styles.shotPlaceholder} aria-hidden="true">
        <p className={styles.shotPlaceholderLabel}>{alt}</p>
      </div>
    );
  }

  const focalClass = shot.startsWith("triage")
    ? styles.featureImageTriage
    : shot.startsWith("evals")
      ? styles.featureImageEvals
      : "";

  return (
    <>
      <Image
        className={`${styles.featureImage} ${styles.featureImageLight} ${focalClass}`.trim()}
        src={`/openui-observability/${shot}-light.webp`}
        alt={alt}
        width={720}
        height={400}
        quality={95}
        unoptimized
        sizes="(max-width: 767px) calc(100vw - 32px), 720px"
      />
      <Image
        className={`${styles.featureImage} ${styles.featureImageDark} ${focalClass}`.trim()}
        src={`/openui-observability/${shot}-dark.webp`}
        alt=""
        aria-hidden="true"
        width={720}
        height={400}
        quality={95}
        unoptimized
        sizes="(max-width: 767px) calc(100vw - 32px), 720px"
      />
    </>
  );
}

type Feature = {
  title: string;
  headline: ReactNode;
  description: string;
  /* Basename under /public/openui-observability/, which the light and dark
     files hang off. Omitted while a step's art is still to be made. */
  shot?: string;
};

/* One loop, in order: see it, find the ones worth seeing, mark what is wrong,
   stop it recurring. Read as four steps rather than four capabilities, so each
   one hands to the next and the last leaves the product entirely.

   Timeline folded into step one — following the journey is part of seeing what
   the user saw, not a separate screen. Insights folded into step two as a single
   clause: the demand signal comes from the same view you triage in, and giving
   it its own step would break the loop. */
const FEATURES: Feature[] = [
  {
    title: "Session replay",
    shot: "session-replay",
    headline: (
      <>
        See exactly
        <br />
        what users saw
      </>
    ),
    description:
      "Replay conversations with the generated UI your users saw, not just the response text. Follow queries, actions, generated interface changes, and responses in order.",
  },
  {
    title: "Triage",
    shot: "triage-figma",
    headline: (
      <>
        Find the sessions
        <br />
        worth opening
      </>
    ),
    description:
      "Review issues by severity, compare what users asked with what they saw, and check related occurrences before opening a session.",
  },
  {
    title: "Annotations",
    shot: "annotations",
    headline: (
      <>
        Turn bad responses
        <br />
        into feedback
      </>
    ),
    description:
      "Annotate the exact response, set severity, and share it with the session attached. Your team can investigate without reproducing the issue.",
  },
  {
    title: "Evals",
    shot: "evals-figma",
    headline: "Catch repeat issues before users do",
    description:
      "Turn production failures into repeatable evals, rerun them after changes, and catch regressions before they reach users.",
  },
];

export function FeaturesSection() {
  return (
    <section className={styles.section} aria-labelledby="observability-features">
      <header className={styles.header}>
        <SectionHeader
          titleId="observability-features"
          title="Product analytics for AI agents"
          subtitle="not just traces"
          caption={
            <>
              Connect each response to what users saw, <br className={styles.captionBreak} />
              what they did, and whether it met their needs.
            </>
          }
        />
      </header>
      <div className={styles.featureList}>
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
      </div>
    </section>
  );
}
