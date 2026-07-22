import { useThread, type ToolActivity } from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TimelineEntry } from "../_shared/tool-renderer/TimelineEntry";
import type { ToolDetailedViewPanel } from "../_shared/tool-renderer/ToolActivityRenderer";
import { defaultLabel } from "./ToolCallPrimitives";

const REVEAL_INTERVAL = 600;
const EXIT_DURATION = 200; // in sync with the __compact transition duration in toolCall.scss.

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
 * {@link ToolActivity}[] from `useToolActivities` instead of the branch's
 * `ThinkItem[]`. Keeps the staggered reveal + toggle; "running" is read from the
 * activity status (not an `isThinking` prop), and "current item ready" asks the
 * status union instead of peeking at magic `_request`/`_response` keys.
 *
 * (The compact reveal uses a CSS fade — framer-motion is intentionally not a
 * dependency of this package.)
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
  /** The run may still produce a response (no assistant text yet) — hold the
   *  compact "Working…" tray open across the tool-result → first-token gap
   *  instead of collapsing the instant the last result lands. */
  awaitingResponse?: boolean;
}) {
  // The timeline is "thinking" while its own last activity is still running (or
  // the results are in but the response hasn't started), it's the live message,
  // AND the thread is actually running — so a closed-args call that never
  // received a result stops showing "Working..." once the run ends.
  const isThreadRunning = useThread((s) => s.isRunning);
  const thinking =
    isThreadRunning &&
    isLast &&
    activities.length > 0 &&
    (isRunning(activities[activities.length - 1]!) || awaitingResponse);

  const [expanded, setExpanded] = useState(false);
  // User explicitly closed the tray mid-run — sticky until the next run's
  // thinking rises, so the auto open/hold logic can't fight the user's intent.
  const [userCollapsed, setUserCollapsed] = useState(false);
  // Live message → reveal one-by-one from the first; historical (not live) →
  // everything already revealed so it never animates "Working…" on mount.
  const [revealedCount, setRevealedCount] = useState(() =>
    isLast ? 1 : Math.max(activities.length, 1),
  );
  const prevThinking = useRef(thinking);

  useEffect(() => {
    if (!prevThinking.current && thinking) {
      setRevealedCount(1);
      setExpanded(false);
      setUserCollapsed(false);
    }
    if (prevThinking.current && !thinking) {
      setExpanded(false);
      setRevealedCount(activities.length);
    }
    prevThinking.current = thinking;
  }, [thinking, activities.length]);

  // Advance only when the current activity has left "streaming" (args closed) —
  // replaces the branch's `!!toolRequest || !!toolResponse` peek with the union.
  const currentReady = (() => {
    const a = activities[revealedCount - 1];
    return a ? a.status !== "streaming" : true;
  })();

  useEffect(() => {
    // Only the live message reveals incrementally; historical messages show all.
    if (isLast && revealedCount < activities.length && currentReady) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), REVEAL_INTERVAL);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isLast, activities.length, revealedCount, currentReady]);

  const revealing = revealedCount < activities.length;
  const showCompact = (thinking || revealing) && !expanded && !userCollapsed;
  const [exiting, setExiting] = useState(false);
  const [prevShowCompact, setPrevShowCompact] = useState(showCompact);
  if (prevShowCompact !== showCompact) {
    setPrevShowCompact(showCompact);
    if (!showCompact && !expanded) setExiting(true);
    if (showCompact) setExiting(false); // reopened mid-exit → cancel the close
  }

  useEffect(() => {
    // The timeout (not transitionend) drives the unmount
    if (!exiting) return undefined;
    const t = setTimeout(() => setExiting(false), EXIT_DURATION);
    return () => clearTimeout(t);
  }, [exiting]);

  if (activities.length === 0) return null;

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
        aria-expanded={expanded || showCompact}
        onClick={() => {
          if (expanded || showCompact) {
            // Anything open (full list or the live working card) → close it.
            // The close sticks for the rest of the run via userCollapsed.
            setExpanded(false);
            setUserCollapsed(true);
          } else {
            // Closed (settled or user-collapsed) → open the full list.
            setExpanded(true);
          }
        }}
      >
        {expanded || showCompact ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
        {toggleLabel}
      </button>

      {(showCompact || (exiting && !expanded)) && (
        <div
          className={clsx("openui-behind-the-scenes__compact", {
            "openui-behind-the-scenes__compact--closed": !showCompact,
          })}
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
