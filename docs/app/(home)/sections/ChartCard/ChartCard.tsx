"use client";

import { useState } from "react";
import styles from "./ChartCard.module.css";

/* The screen the how-it-works walkthrough ends on: step 2's answer, rendered.
   One component per line of that answer (Card, StatCard, BarChart, Button),
   drawn by hand and monochrome, with hover on the bars so it reads as live UI. */
const REGIONS = [
  { name: "N. America", sales: 6.1 },
  { name: "Europe", sales: 4.35 },
  { name: "APAC", sales: 3.91 },
  { name: "LATAM", sales: 1.83 },
];

export function ChartCard() {
  const [hover, setHover] = useState<number | null>(null);
  const max = 6.5;
  return (
    <div className={styles.card}>
      <div className={styles.kpi}>
        <span className={styles.kpiLabel}>Total sales</span>
        <span className={styles.kpiValue}>$16.19M</span>
        <span className={styles.kpiDelta}>+10.7%</span>
      </div>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>Sales by region</span>
      </div>
      <div className={styles.chart}>
        {REGIONS.map((region, index) => (
          <div
            key={region.name}
            className={`${styles.barGroup} ${hover === index ? styles.barGroupHover : ""}`.trim()}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === index && <span className={styles.barTip}>${region.sales.toFixed(2)}M</span>}
            <div className={styles.bars}>
              <span
                className={`${styles.bar} ${styles.barSales}`}
                style={{ height: `${(region.sales / max) * 100}%` }}
              />
            </div>
            <span className={styles.barLabel}>{region.name}</span>
          </div>
        ))}
      </div>
      <button type="button" className={styles.action}>
        Break it down by channel
      </button>
    </div>
  );
}
