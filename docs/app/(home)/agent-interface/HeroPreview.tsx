"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import styles from "./page.module.css";

type HeroPreviewProps = {
  desktopImage: string;
  desktopWidth: number;
  desktopHeight: number;
  mobileImage: string;
  mobileWidth: number;
  mobileHeight: number;
};

export function HeroPreview({
  desktopImage,
  desktopWidth,
  desktopHeight,
  mobileImage,
  mobileWidth,
  mobileHeight,
}: HeroPreviewProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Tracks scroll progress from when the section enters the viewport
  // (start = 0) to when its top hits the top of the viewport (end = 1).
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Starts zoomed-out at 0.65, ramps to natural size by 40% scroll progress, slight overshoot to 1.2.
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.65, 1, 1.2]);

  return (
    <div ref={sectionRef} className={styles.previewSection}>
      <motion.div
        className={`${styles.previewFrame} ${styles.previewFrameMobile}`}
        style={{ scale }}
      >
        <img
          alt="Agent Interface preview"
          className={styles.previewImage}
          decoding="async"
          fetchPriority="high"
          height={mobileHeight}
          loading="eager"
          src={mobileImage}
          width={mobileWidth}
        />
      </motion.div>
      <motion.div
        className={`${styles.previewFrame} ${styles.previewFrameDesktop}`}
        style={{ scale }}
      >
        <img
          alt="Agent Interface preview"
          className={styles.previewImage}
          decoding="async"
          fetchPriority="high"
          height={desktopHeight}
          loading="eager"
          src={desktopImage}
          width={desktopWidth}
        />
      </motion.div>
    </div>
  );
}
