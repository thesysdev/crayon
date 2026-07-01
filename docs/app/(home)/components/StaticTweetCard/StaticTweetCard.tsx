"use client";

import { useState, type JSX, type MouseEvent } from "react";
import type { StaticTweet } from "../../data/home-tweets-static";
import styles from "./StaticTweetCard.module.css";

// Linkify @mentions, #hashtags, full URLs, and bare domains in the accent colour.
function renderText(text: string): (string | JSX.Element)[] {
  const re =
    /(@\w+|#\w+|https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+(?:com|dev|ai|org|io|co|net|app|xyz)(?:\/[^\s]*)?)/g;
  const out: (string | JSX.Element)[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={key++} className={styles.link}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#1d9bf0" aria-label="Verified account" className={styles.verified}>
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.68.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.26 2.52-.81 3.91c-1.31.66-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.26 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function StaticTweetCard({ tweet }: { tweet: StaticTweet }) {
  const url = `https://x.com/${tweet.handle}/status/${tweet.id}`;
  const [copied, setCopied] = useState(false);

  const copyLink = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <div className={styles.card}>
      {/* Stretched link: the whole card opens the tweet; footer controls sit above it. */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.stretchedLink}
        aria-label={`Tweet by ${tweet.name}`}
      />

      <div className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.avatar} src={tweet.avatar} alt="" width={40} height={40} loading="lazy" />
        <div className={styles.identity}>
          <span className={styles.name}>
            <span className={styles.nameText}>{tweet.name}</span>
            {tweet.verified && <VerifiedBadge />}
          </span>
          <span className={styles.handle}>@{tweet.handle}</span>
        </div>
        <span className={styles.xlogo} aria-hidden="true">
          <XLogo />
        </span>
      </div>

      <p className={styles.text}>{renderText(tweet.text)}</p>

      {tweet.media && (
        <div className={styles.media} data-type={tweet.media.type}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tweet.media.url} alt="" loading="lazy" />
          {tweet.media.type === "video" && (
            <span className={styles.playButton} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          )}
        </div>
      )}

      <span className={styles.date}>{tweet.date}</span>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={`${styles.stat} ${styles.statLike}`}>
            <HeartIcon />
            {formatCount(tweet.likes)}
          </span>
          <span className={`${styles.stat} ${styles.statReply}`}>
            <ReplyIcon />
            {formatCount(tweet.replies)}
          </span>
          <button type="button" className={styles.copyBtn} onClick={copyLink}>
            <LinkIcon />
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Read more on X
        </a>
      </div>
    </div>
  );
}
