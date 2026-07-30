"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./brand-logo.module.css";

export type LogoVariant = "light" | "dark";

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function ThesysLogo({ variant = "light" }: { variant?: LogoVariant }) {
  const isDark = variant === "dark";

  return (
    <a
      href="https://thesys.dev"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Thesys"
      className={`${styles.thesysLink} ${isDark ? styles.thesysLinkDark : ""}`.trim()}
    >
      <span aria-hidden="true" className={styles.thesysGlow} />
      <svg className={styles.thesysMark} fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <rect className={styles.thesysRect} height="24" rx="4" width="24" />
        <path className={styles.thesysPath} d={svgPaths.p24ce2f00} />
      </svg>
    </a>
  );
}

export function OpenUILogo({ variant = "light" }: { variant?: LogoVariant }) {
  const isDark = variant === "dark";
  const textClass = `${styles.openuiText} ${isDark ? styles.openuiTextDark : ""}`.trim();

  return (
    <Link href="/" className={styles.openuiLink}>
      {/* Shiro mascot */}
      <div className={styles.openuiMascot}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/shiro-logo.svg" alt="" aria-hidden="true" className={styles.openuiMascotImage} />
      </div>
      <span className={textClass}>OpenUI</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// GitHub Star Button
// ---------------------------------------------------------------------------

// Module-level cache + in-flight dedup for the star count, keyed by repo. Every
// star button on the page (header, hero, tweet-wall stats) shares one request
// instead of each firing its own. Without this the home page made ~5 identical
// calls per load and exhausted GitHub's 60-req/hr unauthenticated limit, after
// which every counter fell back to the default. The cache also survives client-
// side navigation, so returning to a page doesn't refetch.
const starCountCache = new Map<string, number>();
const starCountInflight = new Map<string, Promise<number | null>>();

function fetchGitHubStarCount(repo: string): Promise<number | null> {
  const cached = starCountCache.get(repo);
  if (cached !== undefined) return Promise.resolve(cached);

  let inflight = starCountInflight.get(repo);
  if (!inflight) {
    inflight = fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub star count fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data): number | null => {
        const target: unknown = data.stargazers_count;
        if (typeof target !== "number") return null;
        starCountCache.set(repo, target);
        return target;
      })
      .catch(() => null)
      .finally(() => {
        starCountInflight.delete(repo);
      });
    starCountInflight.set(repo, inflight);
  }
  return inflight;
}

export function useGitHubStarCount(repo: string, enabled = true) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void fetchGitHubStarCount(repo).then((target) => {
      if (cancelled || target === null) return;
      setCount(target);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, repo]);

  return count;
}

export function GitHubIcon() {
  return (
    <div className={styles.githubIcon}>
      <div className={styles.githubIconInner}>
        <svg
          className="absolute block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 19.3333 18.8561"
        >
          <path d={svgPaths.p294daf00} fill="currentColor" stroke="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export function StarCountBadge({
  count,
  isHighlighted,
}: {
  count: number | null;
  isHighlighted: boolean;
}) {
  return (
    <div className={cx(styles.starBadge, isHighlighted && styles.starBadgeHighlighted)}>
      <span
        className={cx(styles.starCount, isHighlighted && styles.starCountHighlighted)}
        aria-hidden={count === null}
      >
        <span
          className={cx(
            styles.starCountValue,
            count === null ? styles.starCountHidden : styles.starCountVisible,
          )}
        >
          {count ?? "0000"}
        </span>
      </span>
    </div>
  );
}

/**
 * Self-contained GitHub star button. Manages its own hover and star count state.
 * Pass `isScrolled` to suppress the drop shadow when the page has scrolled.
 */
export function GitHubStarButton({
  repo,
  isScrolled = false,
}: {
  repo: string;
  isScrolled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const starCount = useGitHubStarCount(repo);

  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.githubButton}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        aria-hidden="true"
        className={cx(
          styles.githubButtonOverlay,
          (isScrolled || isHovered) && styles.githubButtonOverlayFlat,
        )}
      />
      <GitHubIcon />
      <StarCountBadge count={starCount} isHighlighted={isHovered} />
    </a>
  );
}
