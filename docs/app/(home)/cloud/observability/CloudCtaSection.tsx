import styles from "./CloudCtaSection.module.css";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function CloudCtaSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-cta-title">
      <div className={styles.inner}>
        <h2 id="cloud-cta-title" className={styles.title}>
          Join waitlist for early access.
        </h2>
        {/* The same capture as the hero, so the page opens and closes on the
            one action. */}
        <div className={styles.actions}>
          <EarlyAccessForm />
        </div>
      </div>
      <div className={styles.separator} aria-hidden="true" />
    </section>
  );
}
