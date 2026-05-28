import { useAppRenderer, type ToolCall, type ToolMessage } from "@openuidev/react-headless";
import type { ReactNode } from "react";
import { RendererInstance } from "./RendererInstance";

/**
 * Props for {@link ToolMessageRenderer}.
 *
 * @category Components
 */
export type ToolMessageRendererProps = {
  /**
   * The tool message containing the response payload, or `null` while the tool
   * call is still streaming (args have not finished arriving and no result yet).
   * The matched renderer is rendered with `controls.isStreaming = true` in that case.
   */
  toolMessage: ToolMessage | null;
  /** The matching tool call from the parent assistant message (provides `name` + `arguments`). */
  toolCall: ToolCall;
  /** Rendered when no AppRenderer matches `toolCall.function.name`. */
  fallback: ReactNode;
};

/**
 * Dispatches a tool call (streaming or completed) to a matching AppRenderer if
 * one is registered, otherwise renders `fallback` (typically the default
 * `<ToolResult>`).
 *
 * Looks up `toolCall.function.name` against the AppRenderer registry provided
 * by `<ChatProvider appRenderers={...}>`. On match, hands off to
 * {@link RendererInstance} which runs the parser, registers in ThreadContext,
 * and renders the inline preview + detailed-view panel.
 *
 * Tool args (`toolCall.function.arguments`) and response (`toolMessage.content`,
 * or `null` while streaming) are passed to the renderer's `parser` raw — the
 * SDK does not pre-parse JSON. The renderer's `parser` is responsible for
 * handling partial-JSON args during streaming.
 *
 * @category Components
 */
export const ToolMessageRenderer = ({
  toolMessage,
  toolCall,
  fallback,
}: ToolMessageRendererProps) => {
  const renderer = useAppRenderer(toolCall.function.name);

  if (!renderer) return <>{fallback}</>;

  return (
    <RendererInstance
      renderer={renderer}
      args={toolCall.function.arguments}
      response={toolMessage?.content ?? null}
      isStreaming={toolMessage === null}
    />
  );
};
