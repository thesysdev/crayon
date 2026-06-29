"use client";

import { useEffect, useState } from "react";
import styles from "./TweetWallSection.module.css";

const GITHUB_REPO = "thesysdev/openui";

// Package whose monthly npm downloads are shown as the npm stat.
const NPM_PACKAGE = "@openuidev/lang-core";

function useGitHubStars(repo: string): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.stargazers_count === "number") {
          setCount(data.stargazers_count);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [repo]);
  return count;
}

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

function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
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
        <GitHubMark />
        <span className={styles.statNumber}>{(stars ?? 0).toLocaleString()}</span>
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
