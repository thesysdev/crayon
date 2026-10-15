/* ssr entry: this is a server component now that the grid's accordion is gone. */
import { ProductSection } from "../ProductSection/ProductSection";
import { GATEWAY_PRODUCT } from "../ProductSection/products";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

export function CloudSection() {
  return (
    /* No section header: the Gateway band carries its own label and headline,
       so the band opens straight onto it. */
    <section id={CLOUD_SECTION_ID} className={styles.section} aria-label="OpenUI Cloud">
      <div className={styles.inner}>
        {/* Wrapped rather than spaced by the bands themselves, so ProductSection
            stays free of layout it would carry into every other place it is
            used. */}
        <div className={styles.products}>
          <ProductSection {...GATEWAY_PRODUCT} />
        </div>
      </div>
    </section>
  );
}
