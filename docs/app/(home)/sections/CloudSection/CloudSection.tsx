/* ssr entry: this is a server component now that the grid's accordion is gone. */
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import { ProductSection } from "../ProductSection/ProductSection";
import { GATEWAY_PRODUCT } from "../ProductSection/products";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

export function CloudSection() {
  return (
    <section id={CLOUD_SECTION_ID} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.contact}>
          <p className={styles.contactEyebrow}>OpenUI Cloud</p>
          <h2 className={styles.contactText}>Ship with confidence in production.</h2>
          <p className={styles.contactDescription}>
            Gateway keeps generated UI reliable. Observability shows what users experienced and
            where your agent needs to improve.
          </p>
          <a className={styles.pricingLink} href="/pricing">
            View pricing
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </a>
        </div>

        {/* Wrapped rather than spaced by the bands themselves: .header and
            .contact already supply the outer margins, so only the gap between
            the two needs stating, and ProductSection stays free of layout it
            would carry into every other place it is used. */}
        <div className={styles.products}>
          <ProductSection {...GATEWAY_PRODUCT} />
        </div>

        <div className={styles.observabilityBand}>
          <div className={styles.observabilityCopy}>
            <p className={styles.observabilityEyebrow}>OpenUI Observability</p>
            <h3 className={styles.observabilityTitle}>
              Understand what users are doing with your agent.
            </h3>
            <p className={styles.observabilityDescription}>
              See what users saw, find the sessions worth opening, and turn problematic responses
              into feedback and evals.
            </p>
          </div>
          <BevelButton
            className={styles.observabilityCta}
            variant="dark"
            href="/cloud/observability"
            label="Get early access"
            badge={<ArrowRight size={16} weight="bold" />}
          />
        </div>
      </div>
    </section>
  );
}
