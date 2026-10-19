import type { ReactNode } from "react";
import styles from "./FoldHeader.module.css";

/* The opening of each homepage fold after the hero: one large statement with
   an optional quieter second line. Shared so every fold starts the same way. */
/* Put between two sentences of a headline to keep one per line on desktop. */
export function FoldBreak() {
  return <br className={styles.break} />;
}

export function FoldHeader({
  title,
  subtitle,
  id,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  id?: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <h2 className={styles.title} id={id}>
        {title}
      </h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </header>
  );
}
