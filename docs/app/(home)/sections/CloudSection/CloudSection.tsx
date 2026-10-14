/* ssr entry: this is a server component now that the grid's accordion is gone. */
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
              tone="dark"
            />
          </div>
        </div>

        {/* Wrapped rather than spaced by the bands themselves: .header and
            .contact already supply the outer margins, so only the gap between
            the two needs stating, and ProductSection stays free of layout it
            would carry into every other place it is used. */}
        <div className={styles.products}>
          <ProductSection {...GATEWAY_PRODUCT} />
        </div>
      </div>
    </section>
  );
}
