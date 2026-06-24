import { useArtifactRenderer, useThread, type ToolActivity } from "@openuidev/react-headless";
import { memo } from "react";
import { DefaultToolCard } from "../../ToolCall/DefaultToolCard";
import { ToolActivityRenderer, type ToolDetailedViewPanel } from "./ToolActivityRenderer";

export interface ToolCallEntryProps {
  activity: ToolActivity;
  /** Whether this entry belongs to the live (last assistant) message — drives the running shimmer. */
  isLast?: boolean;
  /** Optional detailed-view panel for matched renderers (defaults to the shared one). */
  detailedViewPanel?: ToolDetailedViewPanel;
}

const propsEqual = (a: ToolCallEntryProps, b: ToolCallEntryProps) =>
  a.activity.status === b.activity.status &&
  a.activity.toolCall.function.arguments === b.activity.toolCall.function.arguments &&
  a.activity.result === b.activity.result &&
  a.activity.isError === b.activity.isError &&
  a.isLast === b.isLast &&
  a.detailedViewPanel === b.detailedViewPanel;

/**
 * Renders one tool call: a matched artifact renderer (exact → RegExp → `"*"`)
 * **xor** the batteries-included {@link DefaultToolCard} — never both. The
 * single render path that replaces the copy-pasted call-card + result-renderer
 * blocks across the thread components. Memoized so it only re-renders when the
 * activity actually changes.
 *
 * @category Components
 */
export const ToolCallEntry = memo(function ToolCallEntry({
  activity,
  isLast = false,
  detailedViewPanel,
}: ToolCallEntryProps) {
  const renderer = useArtifactRenderer(activity.toolName);
  // Run-gate the in-progress animation (see TimelineEntry).
  const isRunning = useThread((s) => s.isRunning);
  const defaultCard = <DefaultToolCard activity={activity} isLast={isLast} isRunning={isRunning} />;
  if (!renderer) return defaultCard;
  // Matched renderer; fall back to the default card if its parser returns null.
  return (
    <ToolActivityRenderer
      renderer={renderer}
      activity={activity}
      detailedViewPanel={detailedViewPanel}
      fallback={defaultCard}
    />
  );
}, propsEqual);
