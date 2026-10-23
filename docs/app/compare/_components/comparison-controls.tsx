"use client";

import {
  ArrowRight,
  ArrowUp,
  Footprints,
  Laptop,
  Moon,
  Plane,
  RotateCcw,
  Square,
  Sun,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import type { ComparisonPair } from "./chat-types";
import { useHasMounted } from "./use-has-mounted";

const COMPARISON_SUGGESTIONS = [
  {
    label: "Compare stock growth of MAANG companies",
    prompt: "Compare stock growth of MAANG companies?",
    icon: TrendingUp,
    color: "#067647",
    hiddenForPair: "oss-cloud",
  },
  {
    label: "Hidden travel gems to explore",
    prompt: "Hidden travel gems to explore",
    icon: Plane,
    color: "#dd517b",
  },
  {
    label: "Relive the FIFA World Cup 2026",
    prompt: "Relive the FIFA World Cup 2026.",
    icon: Trophy,
    color: "#175cd3",
    pairOnly: "oss-cloud",
  },
  {
    label: "How the world's electricity is generated",
    prompt: "How is the world's electricity generated? Break it down by source",
    icon: Zap,
    color: "#cd8200",
  },
  {
    label: "Lisbon vs Barcelona vs Berlin for remote work",
    prompt:
      "Compare Lisbon, Barcelona and Berlin for remote workers: cost of living, internet speed and weather",
    icon: Laptop,
    color: "#6941c6",
  },
  {
    label: "A 4-week beginner running plan",
    prompt: "Build me a 4-week beginner running plan",
    icon: Footprints,
    color: "#0e9384",
  },
] as const;

/** Query param a link can use to prefill the compare input. */
export const PROMPT_QUERY_PARAM = "prompt";

interface ComparisonControlsProps {
  comparisonPair: ComparisonPair;
  isReady: boolean;
  isRunning: boolean;
  hasStarted: boolean;
  onSubmit: (content: string) => void;
  onStop: () => void;
  onReset: () => void;
  isDegraded: boolean;
}

export function ComparisonControls({
  comparisonPair,
  isReady,
  isRunning,
  hasStarted,
  onSubmit,
  onStop,
  onReset,
  isDegraded,
}: ComparisonControlsProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // A link can hand over a prompt (?prompt=...), e.g. from the homepage demo
  // showcase, so the visitor lands with it typed in and only has to send it.
  // Read after mount so the server render and the first client render match.
  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get(PROMPT_QUERY_PARAM);
    if (!prompt) return;
    const frame = requestAnimationFrame(() => setText(prompt));
    return () => cancelAnimationFrame(frame);
  }, []);
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until mounted; gate the icon to avoid hydration mismatch.
  const mounted = useHasMounted();
  const isDark = mounted && resolvedTheme === "dark";

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const resize = () => {
      input.style.height = "0px";
      input.style.height = `${Math.max(24, Math.min(input.scrollHeight, 154))}px`;
    };

    resize();

    // A zero-width layout (e.g. the page loading in a hidden pane) wraps the
    // content onto one-character lines and locks in a bogus height, so
    // re-measure whenever the field's width changes.
    let lastWidth = input.getBoundingClientRect().width;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width === lastWidth) return;
      lastWidth = width;
      resize();
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [text]);

  const submit = (content: string) => {
    const next = content.trim();
    if (!next || !isReady || isRunning) return;

    onSubmit(next);
    setText("");
  };

  const reset = () => {
    setText("");
    onReset();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className={styles.comparisonControls}>
      {!hasStarted && (
        <div className={styles.suggestionScroller} aria-label="Try a comparison prompt">
          <div className={styles.suggestionRow}>
            {COMPARISON_SUGGESTIONS.filter(
              (suggestion) =>
                (!("pairOnly" in suggestion) || suggestion.pairOnly === comparisonPair) &&
                (!("hiddenForPair" in suggestion) || suggestion.hiddenForPair !== comparisonPair),
            ).map((suggestion) => {
              const SuggestionIcon = suggestion.icon;
              return (
                <button
                  key={suggestion.label}
                  type="button"
                  className={styles.suggestionButton}
                  onClick={() => submit(suggestion.prompt)}
                  disabled={!isReady || isRunning}
                >
                  <SuggestionIcon
                    size={15}
                    strokeWidth={1.9}
                    color={suggestion.color}
                    aria-hidden="true"
                  />
                  <span className={styles.suggestionLabel}>
                    {suggestion.label}
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={styles.suggestionArrow}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.composerRow}>
        <button
          type="button"
          className={styles.themeToggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? (
            <Sun size={17} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Moon size={17} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <div className={styles.sharedComposer} data-running={isRunning || undefined}>
          <label className={styles.srOnly} htmlFor="comparison-composer">
            {isDegraded
              ? "Ask all available comparison modes"
              : "Ask Rendered Markdown, OpenUI OSS, and OpenUI Cloud"}
          </label>
          <textarea
            ref={inputRef}
            id="comparison-composer"
            value={text}
            rows={1}
            className={styles.sharedComposerInput}
            placeholder={isReady ? "Ask anything" : "Preparing comparison…"}
            disabled={!isReady}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(text);
              }
            }}
          />
          <button
            type="button"
            className={styles.composerSubmit}
            onClick={isRunning ? onStop : () => submit(text)}
            disabled={!isRunning && (!isReady || text.trim().length === 0)}
            aria-label={
              isRunning
                ? "Stop all responses"
                : isDegraded
                  ? "Send to available comparison modes"
                  : "Send to all three modes"
            }
          >
            {isRunning ? (
              <Square size={16} fill="currentColor" aria-hidden="true" />
            ) : (
              <ArrowUp size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        <button
          type="button"
          className={styles.resetButton}
          onClick={reset}
          aria-label="Reset all comparison conversations"
          title="Reset all conversations"
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>

      {isDegraded ? (
        <p className={styles.degradedNotice} role="status">
          An unavailable mode will be skipped. Reload the page to retry it.
        </p>
      ) : (
        <p className={styles.srOnly}>
          One submission sends the prompt to Rendered Markdown, OpenUI OSS, and OpenUI Cloud.
        </p>
      )}
    </div>
  );
}
