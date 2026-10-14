import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BlockRace } from "./BlockRace";
import styles from "./HeroProof.module.css";

/* The hero's closing row: the headline speed claim, and a block race beside it.
   The two numbers are the speed benchmark's contact-form screen against
   json-render; the race shows the wider benchmark's average per screen across
   OpenUI, A2UI and json-render, and says so in its own footnote. */
export function HeroProof() {
  return (
    <div className={styles.proof}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>3x</span>
          <span className={styles.statLabel}>faster generation</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>67%</span>
          <span className={styles.statLabel}>fewer tokens</span>
        </div>
        <p className={styles.statNote}>
          Fewer tokens means every generation finishes sooner and costs less.
        </p>
        <Link href="/benchmarks?view=formats" className={styles.link}>
          See the benchmark <ArrowUpRight size={14} weight="bold" />
        </Link>
      </div>
      <div className={styles.race}>
        <BlockRace />
      </div>
    </div>
  );
}
