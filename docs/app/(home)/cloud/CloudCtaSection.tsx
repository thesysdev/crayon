import { ArrowUpRight } from "lucide-react";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "./CloudCtaSection.module.css";

export function CloudCtaSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-cta-title">
      <div className={styles.inner}>
        <h2 id="cloud-cta-title" className={styles.title}>
          Turn your OpenUI application into a production-grade experience.
        </h2>
        <div className={styles.actions}>
          <BevelButton
            href="https://console.thesys.dev/keys"
            external
            variant="primary"
            label="Get API Key"
            badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
          />
          <BevelButton
            href="https://zcal.co/t/thesys/demo"
            external
            variant="secondary"
            label="Talk to our team"
            badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
          />
        </div>
      </div>
      <div className={styles.separator} aria-hidden="true" />
    </section>
  );
}
