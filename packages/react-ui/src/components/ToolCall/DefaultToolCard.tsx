import type { ToolActivity } from "@openuidev/react-headless";
import { ChevronDown } from "lucide-react";
import { memo } from "react";
import { ToolCall } from "./ToolCallPrimitives";

/**
 * Batteries-included default tool card — the chevron-header composition of the
 * compound {@link ToolCall} parts. Status comes from the data, the collapsible
 * is aria-correct, and it's memoized. Used by `<ToolCallEntry>` for flat
 * (non-timeline) threads, sidebars, debug panels, etc.
 *
 * @category Components
 */
export const DefaultToolCard = memo(function DefaultToolCard({
  activity,
  isLast,
}: {
  activity: ToolActivity;
  isLast: boolean;
}) {
  return (
    <ToolCall.Root activity={activity} isLast={isLast} className="openui-tool-call--card">
      <ToolCall.Trigger className="openui-tool-call__header">
        <ToolCall.StatusIcon />
        <ToolCall.StatusText />
        <ChevronDown size={14} className="openui-tool-call__chevron" />
      </ToolCall.Trigger>
      <ToolCall.Content className="openui-tool-call__panel">
        <ToolCall.Parameters className="openui-tool-call__request openui-tool-code-block__code" />
        <ToolCall.Result className="openui-tool-call__response openui-tool-code-block__code" />
      </ToolCall.Content>
    </ToolCall.Root>
  );
});
