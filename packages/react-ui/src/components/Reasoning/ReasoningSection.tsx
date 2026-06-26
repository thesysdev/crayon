import { BehindTheScenes } from "../ToolCall";
import { ReasoningContent } from "./ReasoningContent";

export interface ReasoningSectionProps {
  /** Accumulated reasoning/thinking text for the assistant turn, if any. */
  reasoning: string | undefined;
  /** True while the assistant turn is still streaming. */
  isStreaming: boolean;
  /** True once answer text has started — collapses the section. */
  hasContent: boolean;
}

/**
 * Standalone collapsible reasoning panel for assistant turns whose tool calls
 * are rendered outside a BehindTheScenes (the Shell / CopilotShell / BottomTray
 * surfaces). Renders nothing when there is no reasoning. The GenUI surface
 * instead nests `ReasoningContent` inside its shared tool-call panel.
 */
export const ReasoningSection = ({ reasoning, isStreaming, hasContent }: ReasoningSectionProps) => {
  if (!reasoning) return null;
  return (
    <BehindTheScenes isStreaming={isStreaming} toolCallsComplete={hasContent}>
      <ReasoningContent reasoning={reasoning} />
    </BehindTheScenes>
  );
};
