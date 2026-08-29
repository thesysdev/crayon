import styles from "./CloudCtaSection.module.css";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function CloudCtaSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-cta-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="cloud-cta-title" className={styles.title}>
            Join the waitlist
          </h2>
          {/* The cost answer lives here rather than in a section of its own: it
              is a reason to act, and it belongs where the acting happens. What
              happens after early access is left to the FAQ, so the last thing
              read before the form is not a future bill. */}
          <p className={styles.note}>
            Free while in early access.{" "}
            <a className={styles.pricingLink} href="/pricing">
              View all pricing
            </a>
          </p>
        </div>
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
