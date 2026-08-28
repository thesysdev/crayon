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
    headline: "See exactly what your user saw",
    description:
      "Replay conversations with the generative UI your users actually got, not just the text behind it, and follow the journey of queries, actions, and responses in the order they happened.",
  },
  {
    title: "Triage",
    shot: "insights",
    headline: "Find the sessions worth opening",
    description:
      "Ask for the sessions that went wrong and get them back grouped by what went wrong. The same view shows which capabilities users reach for most, and which they ask for and never find.",
  },
  {
    title: "Annotations",
    shot: "annotations",
    headline: "Turn a bad response into feedback",
    description:
      "Annotate the exact response that failed, set severity, and hand it to whoever can fix it with the session attached, so nobody has to reproduce it first.",
  },
  {
    title: "Evals",
    headline: "Stop it happening twice",
    description:
      "Turn the responses you flagged into eval cases and push them wherever your evals already live, like Braintrust or LangSmith.",
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
