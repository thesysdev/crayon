"use client";

import {
  ArrowRight,
  ArrowUp,
  FileText,
  LayoutDashboard,
  ListChecks,
  Moon,
  Plane,
  Presentation,
  RotateCcw,
  Square,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import type { ComparisonPair } from "./chat-types";
import { useHasMounted } from "./use-has-mounted";

const COMPARISON_SUGGESTIONS = [
  {
    label: "Exciting stocks to look out for this year",
    prompt:
      "Show me a chart of the top 5 US stocks outperforming the market in 2025 with key trendlines.",
    icon: TrendingUp,
    color: "#067647",
  },
  {
    label: "Hidden travel gems to explore",
    prompt:
      "Give me travel ideas for underrated destinations with notable landmarks and cultural highlights.",
    icon: Plane,
    color: "#dd517b",
  },
  {
    label: "Create an executive dashboard",
    prompt:
      "Visualize following SaaS metrics: MRR $1.28M, growth 8.4%, NRR 112%, churn 2.1%, CAC $740, and pipeline $3.6M. Highlight trends, risks, and the three actions leadership should take.",
    icon: LayoutDashboard,
    color: "#b54708",
  },
  {
    label: "Create an editable launch plan",
    prompt:
      "Create an editable launch plan for a developer tool. Include owner, phase, deadline, status, dependency, and risk. Let me update statuses and show the next three actions.",
    icon: ListChecks,
    color: "#175cd3",
    tag: "Only on Cloud",
    cloudOnly: true,
    pairOnly: "oss-cloud",
  },
  {
    label: "Create a report on Electric vehicles",
    prompt:
      "Create a report on electric vehicles covering adoption trends, key manufacturers, and market outlook.",
    icon: FileText,
    color: "#6941c6",
    tag: "Only on Cloud",
    cloudOnly: true,
  },
  {
    label: "Create a presentation on coffee culture",
    prompt:
      "Create a presentation on global coffee culture covering regions, brewing styles, and cafe trends.",
    icon: Presentation,
    color: "#cd8200",
    tag: "Only on Cloud",
    cloudOnly: true,
  },
] as const;

interface ComparisonControlsProps {
  comparisonPair: ComparisonPair;
  isReady: boolean;
  isRunning: boolean;
  hasStarted: boolean;
  onSubmit: (content: string) => void;
  onStop: () => void;
  onReset: () => void;
  isDegraded: boolean;
  /** Whether the currently selected comparison pair includes OpenUI Cloud. */
  cloudEnabled: boolean;
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
  cloudEnabled,
}: ComparisonControlsProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
              (suggestion) => !("pairOnly" in suggestion) || suggestion.pairOnly === comparisonPair,
            ).map((suggestion) => {
              const SuggestionIcon = suggestion.icon;
              const needsCloud = "cloudOnly" in suggestion && suggestion.cloudOnly;
              return (
                <button
                  key={suggestion.label}
                  type="button"
                  className={styles.suggestionButton}
                  onClick={() => submit(suggestion.prompt)}
                  disabled={!isReady || isRunning || (needsCloud && !cloudEnabled)}
                  title={
                    needsCloud && !cloudEnabled
                      ? "Switch to a comparison that includes OpenUI Cloud to try this"
                      : undefined
                  }
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
                  {"tag" in suggestion && suggestion.tag ? (
                    <span className={styles.suggestionTag}>{suggestion.tag}</span>
                  ) : null}
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
