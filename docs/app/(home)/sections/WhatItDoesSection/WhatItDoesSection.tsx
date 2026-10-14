import { DemoShowcase } from "./DemoShowcase";
import styles from "./WhatItDoesSection.module.css";

/* Fold 2: what OpenUI does, shown rather than told: three real OpenUI apps,
   right under the hero, each one a click away from its live demo. */
export function WhatItDoesSection() {
  return (
    <section className={styles.section} aria-label="Demos">
      <div className={styles.demo}>
        <DemoShowcase />
      </div>
    </section>
  );
}
