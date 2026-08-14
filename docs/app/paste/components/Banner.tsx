"use client";

import { Callout } from "@openuidev/react-ui";
import styles from "@paste/paste.module.css";

export function Banner({
  tone,
  children,
}: {
  tone: "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  return (
    <div className={styles.bannerSlot}>
      <Callout variant={tone} description={children} />
    </div>
  );
}
