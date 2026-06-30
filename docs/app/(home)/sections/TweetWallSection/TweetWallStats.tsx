"use client";

import { useEffect, useState } from "react";
import { GitHubMark, useGitHubStars } from "../../components/GitHubButton/GitHubButton";
import styles from "./TweetWallSection.module.css";

const GITHUB_REPO = "thesysdev/openui";

// Package whose monthly npm downloads are shown as the npm stat.
const NPM_PACKAGE = "@openuidev/lang-core";

function useNpmMonthlyDownloads(pkg: string): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.npmjs.org/downloads/point/last-month/${pkg}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.downloads === "number") {
          setCount(data.downloads);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pkg]);
  return count;
}

function NpmMark() {
  return (
    <svg
      viewBox="0 7 24 10"
      width="36"
      height="15"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
    </svg>
  );
}

export function TweetWallStats() {
  const stars = useGitHubStars(GITHUB_REPO);
  const downloads = useNpmMonthlyDownloads(NPM_PACKAGE);

  return (
    <div className={styles.stats}>
      <span className={styles.statChip}>
        <GitHubMark size={16} />
        <span className={styles.statNumber}>{stars.toLocaleString()}</span>
        <span className={styles.statLabel}>stars</span>
      </span>
      <span className={styles.statChip}>
        <NpmMark />
        <span className={styles.statNumber}>
          {(downloads ?? 0).toLocaleString()}
        </span>
        <span className={styles.statLabel}>monthly downloads</span>
      </span>
    </div>
  );
}
