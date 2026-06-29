import {
  pairToolActivity,
  useArtifactRenderer,
  type AssistantMessage,
  type ToolCall,
  type ToolMessage,
} from "@openuidev/react-headless";
import type { ReactNode } from "react";
import { ToolActivityRenderer, type ToolDetailedViewPanel } from "./ToolActivityRenderer";

/**
 * Props for {@link ToolMessageRenderer}.
 *
 * @category Components
 */
export type ToolMessageRendererProps = {
  /**
   * The tool message containing the response payload, or `null` while the tool
   * call is still streaming. The matched renderer sees `controls.isStreaming = true`.
   */
  toolMessage: ToolMessage | null;
  /** The matching tool call from the parent assistant message. */
  toolCall: ToolCall;
  /** Rendered when no renderer matches `toolCall.function.name`. */
  fallback: ReactNode;
  /** Optional detailed-view panel (defaults to the shared one). */
  detailedViewPanel?: ToolDetailedViewPanel;
};

/**
 * Dispatches a tool call to a matching renderer, else renders `fallback`.
 *
 * @deprecated Prefer `useToolActivities` + `<ToolCallEntry>` / `<ToolCallTimeline>`,
 * which pair calls↔results by id, carry real status, and render the matched
 * renderer xor the default card. This wrapper now builds a single
 * {@link ToolActivity} from `toolCall`/`toolMessage` and delegates to
 * {@link ToolActivityRenderer}, so existing imports keep working.
 *
 * @category Components
 */
export const ToolMessageRenderer = ({
  toolMessage,
  toolCall,
  fallback,
  detailedViewPanel,
}: ToolMessageRendererProps) => {
  const renderer = useArtifactRenderer(toolCall.function.name);
  if (!renderer) return <>{fallback}</>;

  const syntheticAssistant: AssistantMessage = {
    id: `__tool_message_renderer__${toolCall.id}`,
    role: "assistant",
    content: "",
    toolCalls: [toolCall],
  };
  const [activity] = pairToolActivity(syntheticAssistant, toolMessage ? [toolMessage] : []);
  if (!activity) return <>{fallback}</>;

  return (
    <ToolActivityRenderer
      renderer={renderer}
      activity={activity}
      detailedViewPanel={detailedViewPanel}
    />
  );
};
