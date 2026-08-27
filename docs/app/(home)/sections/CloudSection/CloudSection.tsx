/* ssr entry: this is a server component now that the grid's accordion is gone. */
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import { ProductSection } from "../ProductSection/ProductSection";
import { GATEWAY_PRODUCT, OBSERVABILITY_PRODUCT } from "../ProductSection/products";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

export function CloudSection() {
  return (
    <section id={CLOUD_SECTION_ID} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.contact}>
          <p className={styles.contactText}>Upgrade your Generative UI agent.</p>
          <BevelButton
            variant="dark"
            className={styles.contactCta}
            external
            href="https://zcal.co/t/thesys/demo"
            label="Talk to our team"
            badge={<PaperPlaneRight size={16} weight="bold" />}
          />
        </div>

        {/* Wrapped rather than spaced by the bands themselves: .header and
            .contact already supply the outer margins, so only the gap between
            the two needs stating, and ProductSection stays free of layout it
            would carry into every other place it is used. */}
        <div className={styles.products}>
          <ProductSection {...GATEWAY_PRODUCT} />
          <ProductSection {...OBSERVABILITY_PRODUCT} />
        </div>
      </div>
    </section>
  );
}
