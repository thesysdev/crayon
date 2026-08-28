/* ssr entry: this is a server component now that the grid's accordion is gone. */
import { ProductSection } from "../ProductSection/ProductSection";
import { GATEWAY_PRODUCT } from "../ProductSection/products";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

export function CloudSection() {
  return (
    <section id={CLOUD_SECTION_ID} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.contact}>
          {/* Opens the production half of the page. The demo booking that used to
              sit here has moved onto the Gateway band below, next to Learn more,
              so this block is a heading rather than a heading plus an ask. */}
          <p className={styles.contactText}>Ship with confidence in production.</p>
        </div>

        {/* Wrapped rather than spaced by the bands themselves: .header and
            .contact already supply the outer margins, so only the gap between
            the two needs stating, and ProductSection stays free of layout it
            would carry into every other place it is used. */}
        <div className={styles.products}>
          <ProductSection {...GATEWAY_PRODUCT} />
        </div>

        {/* Observability is deliberately a line rather than a band: it is in
            early access, and giving it equal weight here would promise more than
            it can currently deliver. Promote it back to a ProductSection (the
            props are still in products.ts) when it ships. */}
        <p className={styles.aside}>
          Understanding how those responses landed is{" "}
          <a className={styles.asideLink} href="/cloud/observability">
            OpenUI Observability
          </a>
          , now in early access.
        </p>
      </div>
    </section>
  );
}
