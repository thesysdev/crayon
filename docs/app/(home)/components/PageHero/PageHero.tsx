import type { ReactNode } from "react";
import styles from "./PageHero.module.css";

/**
 * Lightweight, left-aligned page hero for directory/list pages (Projects, Blog)
 * that have no product screenshot. Shares the home family's type scale, container,
 * and dark-mode behaviour (all driven by .homeTheme tokens / --openui-* swatches),
 * so it reads as part of the same family as the full HeroSection without the
 * command pill / GitHub star / preview art.
 *
 * Render it inside a `.homeTheme` ancestor so the --home-* tokens resolve.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  smallSubtitle = false,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Render the subheadline at a smaller size than the title (instead of matching it). */
  smallSubtitle?: boolean;
  actions?: ReactNode;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? (
          <p className={`${styles.subtitle} ${smallSubtitle ? styles.subtitleSmall : ""}`.trim()}>
            {subtitle}
          </p>
        ) : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </section>
  );
}

/** Muted accent span for a word inside the hero title (matches the hero wordmark accent). */
export function PageHeroAccent({ children }: { children: ReactNode }) {
  return <span className={styles.titleAccent}>{children}</span>;
}
