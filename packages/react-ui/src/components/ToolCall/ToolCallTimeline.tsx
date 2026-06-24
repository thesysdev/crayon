import { useThread, type ToolActivity } from "@openuidev/react-headless";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TimelineEntry } from "../_shared/tool-renderer/TimelineEntry";
import type { ToolDetailedViewPanel } from "../_shared/tool-renderer/ToolActivityRenderer";

const REVEAL_INTERVAL = 600;

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
}: {
  activities: ToolActivity[];
  isLast?: boolean;
  detailedViewPanel?: ToolDetailedViewPanel;
  /** Render every row as the raw default card (e.g. so matched tools' raw
   *  request/response stay inspectable here while their rich preview renders elsewhere). */
  forceDefault?: boolean;
}) {
  // The timeline is "thinking" while its own last activity is still running, it's
  // the live message, AND the thread is actually running — so a closed-args call
  // that never received a result stops showing "Working..." once the run ends.
  const isThreadRunning = useThread((s) => s.isRunning);
  const thinking =
    isThreadRunning &&
    isLast &&
    activities.length > 0 &&
    isRunning(activities[activities.length - 1]!);

  const [expanded, setExpanded] = useState(false);
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

  if (activities.length === 0) return null;

  const revealing = revealedCount < activities.length;
  const showCompact = (thinking || revealing) && !expanded;
  const current = activities[Math.min(revealedCount - 1, activities.length - 1)]!;

  return (
    <div className="openui-behind-the-scenes">
      <button
        className="openui-behind-the-scenes__toggle"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
        {thinking || revealing ? "Working..." : "Behind the scenes"}
      </button>

      {showCompact && (
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
