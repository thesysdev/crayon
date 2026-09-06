import { GatewayPlans } from "./GatewayPlans";
import styles from "./sections.module.css";

export function PricingSection() {
  return (
    <div className={styles.pricingBand}>
      <section
        className={`${styles.section} ${styles.pricingSection}`}
        aria-labelledby="gateway-pricing"
      >
        <div className={styles.sectionLockup}>
          <div>
            <h2 id="gateway-pricing" className={styles.heading}>
              Built to scale
              <br />
              with your usage
            </h2>
          </div>
          <p className={styles.lead}>
            Each plan includes monthly API calls and all correction calls. Every response uses an
            API call plus LLM tokens. Tokens are billed separately at model provider rates.
          </p>
        </div>
        <div className={styles.diagram}>
          <GatewayPlans />
        </div>
      </section>
    </div>
  );
}
