"use client";

import { Button } from "@openuidev/react-ui";
import styles from "./ProAccessBanner.module.css";

interface ProAccessBannerProps {
  title?: string;
  ctaLabel?: string;
}

export default function ProAccessBanner({
  title = "Access these beautifully curated components along with a suite of other benefits to power-up your Generative UI stack with Thesys C1.",
  ctaLabel = "Learn more",
}: ProAccessBannerProps) {
  return (
    <div className={styles.banner}>
      <p className={styles.title}>{title}</p>
      <Button type="button" variant="primary" size="small" className={styles.ctaButton}>
        {ctaLabel}
      </Button>
    </div>
  );
}
