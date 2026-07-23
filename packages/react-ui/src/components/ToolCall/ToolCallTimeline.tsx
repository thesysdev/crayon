import { useThread, type ToolActivity } from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TimelineEntry } from "../_shared/tool-renderer/TimelineEntry";
import type { ToolDetailedViewPanel } from "../_shared/tool-renderer/ToolActivityRenderer";
import { defaultLabel } from "./ToolCallPrimitives";

const REVEAL_INTERVAL = 600;

/** Visually hidden but available to screen readers; inline so we don't depend on
 *  scss (a sibling agent owns the stylesheet). */
const VISUALLY_HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
  padding: 0,
  margin: -1,
} as const;

const isRunning = (a: ToolActivity) => a.status === "streaming" || a.status === "executing";

/**
 * The "Working… / Behind the scenes" timeline wrapper, driven by
 * {@link ToolActivity}[] from `useToolActivities`. Reveals the run's activities
 * one-by-one, holds the compact card open across the tool-result → first-token
 * gap (`awaitingResponse`), and lets a manual close stick for the rest of the
 * run. "Running" is read from each activity's status, not an `isThinking` prop.
 *
 * (Animations are CSS-only — framer-motion is intentionally not a dependency.)
 *
 * @category Components
 */
export function ToolCallTimeline({
  activities,
  isLast = false,
  detailedViewPanel,
  forceDefault = false,
  awaitingResponse = false,
}: {
  activities: ToolActivity[];
  isLast?: boolean;
  detailedViewPanel?: ToolDetailedViewPanel;
  /** Render every row as the raw default card (e.g. so matched tools' raw
   *  request/response stay inspectable here while their rich preview renders elsewhere). */
  forceDefault?: boolean;
  /** Hold the compact "Working…" tray open across the tool-result → first-token
   *  gap instead of collapsing the instant the last result lands. */
  awaitingResponse?: boolean;
}) {
  // "Thinking" while the last activity is still running (or its results are in
  // but the response hasn't started), on the live message, and the thread is
  // actually running — so a closed-args call with no result stops showing
  // "Working..." once the run ends.
  const isThreadRunning = useThread((s) => s.isRunning);
  const thinking =
    isThreadRunning &&
    isLast &&
    activities.length > 0 &&
    (isRunning(activities[activities.length - 1]!) || awaitingResponse);

  const [expanded, setExpanded] = useState(false);
  // A user close mid-run sticks until the next run.
  const [userCollapsed, setUserCollapsed] = useState(false);
  // Live message reveals from the first activity; historical reveals them all so
  // it never animates "Working…" on mount.
  const [revealedCount, setRevealedCount] = useState(() =>
    isLast ? 1 : Math.max(activities.length, 1),
  );

  // Reset on each run edge: a rising `thinking` restarts the reveal and clears
  // any prior expand/collapse; a falling `thinking` reveals everything.
  const prevThinking = useRef(thinking);
  useEffect(() => {
    if (!prevThinking.current && thinking) {
      setRevealedCount(1);
      setExpanded(false);
      setUserCollapsed(false);
    } else if (prevThinking.current && !thinking) {
      setExpanded(false);
      setRevealedCount(activities.length);
    }
    prevThinking.current = thinking;
  }, [thinking, activities.length]);

  // Advance the reveal once the current activity's args have closed (left
  // "streaming"); only the live message reveals incrementally.
  const revealingActivity = activities[revealedCount - 1];
  const currentReady = revealingActivity ? revealingActivity.status !== "streaming" : true;
  useEffect(() => {
    if (isLast && revealedCount < activities.length && currentReady) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), REVEAL_INTERVAL);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isLast, activities.length, revealedCount, currentReady]);

  if (activities.length === 0) return null;

  const revealing = revealedCount < activities.length;
  const showCompact = (thinking || revealing) && !expanded && !userCollapsed;
  const isOpen = expanded || showCompact;
  const current = activities[Math.min(revealedCount - 1, activities.length - 1)]!;

  // Persistent live announcement reflecting the current step's status — driven by
  // the same fallback the primitives use so SRs hear status changes as content
  // updates (the keyed reveal wrapper remounts and never announces on its own).
  const liveLabel = current.statusMessage ?? defaultLabel(current.status, current.toolName);

  // Once settled, surface a failure count on the toggle so errors aren't hidden
  // behind a collapsed "Behind the scenes".
  const settled = !thinking && !revealing;
  const failedCount = settled ? activities.filter((a) => a.status === "error").length : 0;
  const toggleLabel =
    thinking || revealing
      ? "Working..."
      : failedCount > 0
        ? `Behind the scenes · ${failedCount} failed`
        : "Behind the scenes";

  return (
    <div className="openui-behind-the-scenes">
      <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {liveLabel}
      </div>

      <button
        className="openui-behind-the-scenes__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => {
          // Anything open → close it (sticky for the rest of the run via
          // userCollapsed); otherwise reopen the full list.
          if (isOpen) {
            setExpanded(false);
            setUserCollapsed(true);
          } else {
            setExpanded(true);
          }
        }}
      >
        {isOpen ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
        {toggleLabel}
      </button>

      {isLast && !expanded && (
        <div
          className={clsx("openui-behind-the-scenes__compact", {
            "openui-behind-the-scenes__compact--closed": !showCompact,
          })}
          inert={!showCompact}
        >
          <div className="openui-behind-the-scenes__compact-inner">
            <div className="openui-behind-the-scenes__items">
              {/* key changes per reveal → remounts → re-triggers the CSS fade-in */}
              <div
                key={revealedCount}
                className="openui-behind-the-scenes__reveal-item"
                style={{ width: "100%" }}
              >
                <TimelineEntry
                  activity={current}
                  isLast
                  detailedViewPanel={detailedViewPanel}
                  forceDefault={forceDefault}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="openui-behind-the-scenes__items">
          {activities.map((a, idx) => (
            <div key={a.id} style={{ width: "100%" }}>
              <TimelineEntry
                activity={a}
                isLast={isLast && idx === activities.length - 1}
                detailedViewPanel={detailedViewPanel}
                forceDefault={forceDefault}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
