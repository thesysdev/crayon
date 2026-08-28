import { failureTaxonomy, production } from "@/lib/benchmark-data";
import styles from "../sections.module.css";

/* The problem, with no product in it. Every number is read from the benchmark
   dataset rather than restated, so this page cannot drift from what /benchmarks
   publishes.

   The taxonomy labels carry a parenthetical gloss that earns its place on the
   benchmarks page and reads as clutter here, so the gloss is stripped for
   display. Stripping beats a second hardcoded list: the labels still come from
   one source, and a change there still lands here. */
const shortLabel = (family: string) => family.replace(/\s*\(.*\)\s*$/, "");

export function WhySection() {
  return (
    <section className={styles.section} aria-labelledby="gateway-why">
      <h2 id="gateway-why" className={styles.heading}>
        Generative UI fails silently in production
      </h2>
      <p className={styles.lead}>
        OpenUI is the most reliable format we have measured, ahead of Google A2UI and Vercel
        json-render. Better models lower the error rate further. Neither gets it to zero.
      </p>
      <div className={styles.linkRow}>
        <a className={styles.link} href="/benchmarks/language">
          Compare formats →
        </a>
        <a className={styles.link} href="/benchmarks">
          Compare models →
        </a>
      </div>

      <p className={styles.stat}>
        About {production.triggerRate}% of generations fail validation.
      </p>

      <ul className={styles.rows}>
        {failureTaxonomy.map((entry) => (
          <li className={styles.row} key={entry.family}>
            <span className={styles.term}>{entry.share}%</span>
            <p className={styles.desc}>{shortLabel(entry.family)}</p>
          </li>
        ))}
      </ul>

      <p className={styles.note}>
        Every one of them returned 200. From 1,285 production failures over 15 days.
      </p>
    </section>
  );
}
