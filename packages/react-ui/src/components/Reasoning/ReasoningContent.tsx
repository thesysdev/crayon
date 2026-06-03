import { MarkDownRenderer } from "../MarkDownRenderer";

export interface ReasoningContentProps {
  /** The accumulated reasoning/thinking text for the assistant turn. */
  reasoning: string;
}

/**
 * Renders an assistant turn's reasoning/thinking content as markdown. Intended
 * to be placed inside a `BehindTheScenes` section, colocated with the assistant
 * message.
 */
export const ReasoningContent = ({ reasoning }: ReasoningContentProps) => (
  <MarkDownRenderer textMarkdown={reasoning} className="openui-reasoning" />
);
