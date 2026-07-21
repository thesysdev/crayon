"use client";

import {
  ArrowUp,
  Clapperboard,
  Plane,
  RotateCcw,
  Square,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";

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
    label: "Greatest blockbusters of all time",
    prompt:
      "Show me a chart of the highest-grossing movies of all time with key milestones and release details.",
    icon: Clapperboard,
    color: "#6941c6",
  },
  {
    label: "Tell me about global street food",
    prompt:
      "Give me a world map of street foods with charts of popularity and regional highlights.",
    icon: Utensils,
    color: "#cd8200",
  },
] as const;

interface ComparisonControlsProps {
  isReady: boolean;
  isRunning: boolean;
  hasStarted: boolean;
  onSubmit: (content: string) => void;
  onStop: () => void;
  onReset: () => void;
  isDegraded: boolean;
}

export function ComparisonControls({
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

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "0px";
    input.style.height = `${Math.max(24, Math.min(input.scrollHeight, 154))}px`;
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
            {COMPARISON_SUGGESTIONS.map((suggestion) => {
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
                  <span>{suggestion.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.composerRow}>
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
