/* ssr entry: this is a server component now that the grid's accordion is gone. */
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { ProductLabel, ProductSection } from "../ProductSection/ProductSection";
import { GATEWAY_PRODUCT } from "../ProductSection/products";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

export function CloudSection() {
  return (
    <section id={CLOUD_SECTION_ID} className={styles.section} aria-labelledby="openui-cloud-title">
      <div className={styles.inner}>
        <div className={styles.contact}>
          <ProductLabel name="OpenUI" tag="Cloud" />
          <div className={styles.contactHeading}>
            <SectionHeader
              titleId="openui-cloud-title"
              title="Production reliability"
              subtitle="and user insights"
              caption="Gateway repairs invalid UI before users see it. Observability shows what users experienced and what to improve next."
              tone="dark"
            />
          </div>
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

        <div id="openui-observability-card" className={styles.observabilityBand}>
          <div className={styles.observabilityCopy}>
            <ProductLabel
              name="OpenUI"
              tag="Observability"
              className={styles.observabilityEyebrow}
            />
            <h3 className={styles.observabilityTitle}>
              Understand how users experience your agent
            </h3>
            <p className={styles.observabilityDescription}>
              See what users saw, find issues and unmet needs, and turn failed responses into
              feedback and evals.
            </p>
          </div>
          <BevelButton
            className={styles.observabilityCta}
            variant="dark"
            href="/cloud/observability"
            label="Join the waitlist"
            badge={<ArrowRight size={16} weight="bold" />}
          />
        </div>
      </div>
    </section>
  );
}
