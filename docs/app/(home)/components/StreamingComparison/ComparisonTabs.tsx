"use client";

import { useState } from "react";
import { StreamingComparison } from "./StreamingComparison";
import styles from "./StreamingComparison.module.css";
import type { ComparisonExample } from "./types";

export interface ComparisonTab {
  id: string;
  label: string;
  example: ComparisonExample;
}

/* The comparison with the homepage pill tabs floating over its bottom edge; picking a
   tab swaps in that example and streams it from the start. */
export function ComparisonTabs({ tabs, initial = 0 }: { tabs: ComparisonTab[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  const tab = tabs[active];

  return (
    <div className={styles.tabsHost}>
      <div role="tabpanel" id={`comparison-${tab.id}`} aria-labelledby={`comparison-tab-${tab.id}`}>
        {/* Keyed by tab, so switching remounts it and the stream restarts. */}
        <StreamingComparison key={tab.id} example={tab.example} />
      </div>
      <div className={styles.tabsBar}>
        <div className={styles.tabs} role="tablist" aria-label="Examples">
          {tabs.map((item, index) => (
            <button
              key={item.id}
              id={`comparison-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-controls={`comparison-${item.id}`}
              className={`${styles.tab} ${index === active ? styles.tabActive : ""}`.trim()}
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
