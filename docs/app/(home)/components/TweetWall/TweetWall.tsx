"use client";

import { useTheme } from "next-themes";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { HOME_TWEETS, type HomeTweetEmbed } from "../../data/home-tweet-embeds";
import styles from "./TweetWall.module.css";

const DESKTOP_COLUMNS = 4;
const MOBILE_COLUMNS = 3;
const DESKTOP_QUERY = "(min-width: 900px)";
const DESKTOP_EMBED_WIDTH = 360;
// Twitter clamps embeds to a 250px minimum; render at 250 (no cropping) and scale
// the rendered card down with CSS on mobile.
const MOBILE_EMBED_WIDTH = 250;

// Per-column scroll duration (s), direction, and a starting phase offset so the
// columns never line up. The marquee itself is pure CSS (translateY 0 -> -50% over
// two duplicated copies), so there is no measurement to drift or flicker.
const COLUMNS_META = [
  { duration: 36, reverse: false, delay: -4 },
  { duration: 30, reverse: true, delay: -13 },
  { duration: 42, reverse: false, delay: -8 },
  { duration: 33, reverse: true, delay: -19 },
] as const;

function splitIntoColumns(items: HomeTweetEmbed[], count: number): HomeTweetEmbed[][] {
  const columns = Array.from({ length: count }, () => [] as HomeTweetEmbed[]);
  items.forEach((item, index) => columns[index % count]!.push(item));
  return columns;
}

export function TweetWall() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [scriptReady, setScriptReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [columnCount, setColumnCount] = useState(DESKTOP_COLUMNS);
  const [ready, setReady] = useState(false);
  // The last column count an embed pass ran for. Lets us tell a "fresh slots"
  // pass (first mount / column-count change → empty slots) from a theme re-embed
  // (slots already hold tweets), so a theme switch never blanks the wall.
  const lastColumnCount = useRef<number | null>(null);

  // Always a defined "light" | "dark" (resolvedTheme is undefined until next-themes
  // resolves on the client), so the embed effect's dependency never changes shape.
  const embedTheme = resolvedTheme === "dark" ? "dark" : "light";

  // Resolve the column count on the client only. The columns render after mount
  // (the outer root still server-renders to reserve height), so there is no
  // SSR/hydration column-count swap and the embed pass runs exactly once.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setColumnCount(query.matches ? DESKTOP_COLUMNS : MOBILE_COLUMNS);
    update();
    setMounted(true);
    // If widgets.js is already loaded (e.g. a client-side navigation back to this
    // page, where next/script won't re-fire onLoad), mark it ready now. Otherwise
    // scriptReady stays false on return and the wall renders permanently blank.
    if (window.twttr?.widgets?.createTweet) setScriptReady(true);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Embed every slot once the columns are mounted and the widget script is ready.
  // Re-runs if the column count changes (which swaps the slots and their target
  // width). The wall stays hidden until all embeds resolve, so it never flickers in.
  useEffect(() => {
    if (!mounted || !scriptReady) return;
    const root = rootRef.current;
    const createTweet = window.twttr?.widgets?.createTweet;
    if (!root || !createTweet) return;

    let cancelled = false;
    const width = columnCount >= DESKTOP_COLUMNS ? DESKTOP_EMBED_WIDTH : MOBILE_EMBED_WIDTH;
    const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-tweet-id]"));

    // Hide the wall only when the slots are empty — i.e. the first mount or a
    // column-count change re-rendered fresh slots. A theme switch re-embeds into
    // slots that already hold tweets, so keep those visible; otherwise a slow or
    // Twitter-throttled re-embed would leave the whole opacity:0 wall hidden.
    const slotsAreFresh = lastColumnCount.current !== columnCount;
    lastColumnCount.current = columnCount;
    if (slotsAreFresh) setReady(false);

    // Twitter throttles bursts of embed creation (every theme toggle fires one),
    // and a throttled createTweet can hang indefinitely. Cap each one so the
    // readiness promise always settles and the wall can never get stuck hidden.
    const EMBED_TIMEOUT_MS = 7000;
    const withTimeout = <T,>(promise: Promise<T>) =>
      Promise.race([promise, new Promise<void>((resolve) => setTimeout(resolve, EMBED_TIMEOUT_MS))]);

    void Promise.allSettled(
      slots.map(async (slot) => {
        const id = slot.dataset.tweetId;
        if (!id) return;
        // Build the new embed in a detached node and swap it in only once it
        // resolves, so the currently-visible tweet isn't cleared mid-re-embed
        // (no blank flash on theme switch). On timeout, the old tweet stays.
        const staging = document.createElement("div");
        await withTimeout(
          createTweet(id, staging, {
            align: "center",
            conversation: slot.dataset.conversation === "all" ? "all" : "none",
            dnt: true,
            // White card in light mode; dark card in dark mode. Twitter's "dark"
            // theme is a bluish near-black (#15202b) — a CSS filter on the iframe
            // (see the [data-theme="dark"] .slot rule) neutralises the blue to gray.
            theme: embedTheme,
            width,
          }),
        );
        if (cancelled || staging.childNodes.length === 0) return;
        slot.replaceChildren(...staging.childNodes);
      }),
    ).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [mounted, scriptReady, columnCount, embedTheme]);

  const columns = splitIntoColumns(HOME_TWEETS, columnCount);

  return (
    <>
      <Script
        id="twitter-widgets-js"
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div
        ref={rootRef}
        className={`${styles.root} ${ready ? styles.ready : ""}`.trim()}
        role="region"
        aria-label="What people are saying on X"
      >
        {mounted && (
        <div className={styles.columns}>
          {columns.map((column, columnIndex) => {
            const meta = COLUMNS_META[columnIndex % COLUMNS_META.length]!;
            // On mobile (3 columns) the centre column scrolls up and the outer
            // columns scroll down; desktop keeps the COLUMNS_META directions.
            const reverse =
              columnCount === MOBILE_COLUMNS ? columnIndex !== 1 : meta.reverse;
            return (
              <div className={styles.column} key={columnIndex}>
                <div
                  className={styles.track}
                  style={{
                    animationDuration: `${meta.duration}s`,
                    animationDelay: `${meta.delay}s`,
                    animationDirection: reverse ? "reverse" : "normal",
                  }}
                >
                  {[0, 1].map((copy) =>
                    column.map((tweet, index) => (
                      <div
                        key={`${columnIndex}-${index}-${copy}`}
                        className={styles.slot}
                        data-tweet-id={tweet.id}
                        data-conversation={tweet.conversation ?? "none"}
                        aria-hidden={copy === 1 || undefined}
                      />
                    )),
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </>
  );
}
