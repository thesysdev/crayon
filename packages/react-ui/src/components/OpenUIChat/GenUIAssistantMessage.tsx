"use client";

import type { AssistantMessage, ToolActivity } from "@openuidev/react-headless";
import {
  lookupArtifactRenderer,
  useArtifactRendererRegistry,
  useThread,
  useToolActivities,
} from "@openuidev/react-headless";
import type { ActionEvent, Library } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { useCallback, useMemo } from "react";
import {
  separateContentAndContext,
  wrapContent,
  wrapContentWithHeader,
  wrapContext,
} from "../../utils/sentinelParser";
import { ToolCallTimeline } from "../ToolCall";
import { TimelineEntry } from "../_shared/tool-renderer";
import { AssistantMessageContainer } from "./AssistantMessageContainer";

export const GenUIAssistantMessage = ({
  message,
  library,
}: {
  message: AssistantMessage;
  library: Library;
}) => {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const updateMessage = useThread((s) => s.updateMessage);

  const isStreaming = useMemo(() => {
    if (!isRunning) return false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") {
        return messages[i]?.id === message.id;
      }
    }
    return false;
  }, [isRunning, messages, message.id]);

  // Separate openui-lang code from persisted form state
  const {
    content: openuiCode,
    contextString,
    contentHeader,
  } = useMemo(() => {
    if (!message.content) return { content: null, contextString: null, contentHeader: undefined };
    return separateContentAndContext(message.content);
  }, [message.content]);

  const initialState = useMemo(() => {
    if (!contextString) return undefined;
    try {
      const parsed = JSON.parse(contextString);
      if (Array.isArray(parsed) && typeof parsed[0] === "object") return parsed[0];
      if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      return undefined;
    } catch {
      return undefined;
    }
  }, [contextString]);

  // One id-keyed pairing of calls↔results with real status (streaming /
  // executing / complete / error).
  const activities = useToolActivities(message, messages);

  // The "Behind the scenes" timeline shows the RAW request/response for EVERY
  // tool call (forceDefault), so matched tools (artifacts, web search) stay
  // inspectable there. Matched renderers additionally render their rich preview
  // OUTSIDE the timeline so it's always visible and its detailed-view panel
  // stays mounted even after the message completes.
  const registry = useArtifactRendererRegistry();
  const isMatched = (a: ToolActivity) =>
    !!(registry && lookupArtifactRenderer(registry, a.toolName));
  const matchedActivities = activities.filter(isMatched);

  // Persist form state into the inline-wrapped message content. The original
  // header line (which may include `libraryVersion` and telemetry tags emitted
  // by the backend) is reused so attrs survive the persist round-trip.
  const handleStateUpdate = useCallback(
    (state: Record<string, any>) => {
      const code = openuiCode ?? "";
      const hasState = Object.keys(state).length > 0;
      const contentPart = wrapContentWithHeader(code, contentHeader);
      const fullMessage = hasState
        ? contentPart + wrapContext(JSON.stringify([state]))
        : contentPart;
      updateMessage({ ...message, content: fullMessage });
    },
    [updateMessage, message, openuiCode, contentHeader],
  );

  // Build LLM-friendly message from action + form state, then dispatch
  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const contentPart = event.humanFriendlyMessage
          ? wrapContent(event.humanFriendlyMessage)
          : "";
        const messageCtx: (string | object)[] = [`User clicked: ${event.humanFriendlyMessage}`];
        if (event.formState) {
          messageCtx.push(event.formState);
        }
        const contextPart = wrapContext(JSON.stringify(messageCtx));
        const llmMessage = `${contentPart}${contextPart}`;

        processMessage({
          role: "user",
          content: llmMessage,
        });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"] as string | undefined;
        if (typeof window !== "undefined" && url) {
          window.open(url, "_blank");
        }
      }
    },
    [processMessage],
  );

  return (
    <AssistantMessageContainer>
      {activities.length > 0 && (
        // Raw request/response for ALL tool calls, collapsed by default.
        <ToolCallTimeline
          activities={activities}
          isLast={isStreaming}
          forceDefault
          awaitingResponse={isStreaming && !message.content}
        />
      )}
      {matchedActivities.map((activity) => (
        // Matched renderers (artifact previews, web search) — always visible.
        // No raw fallback here: the forceDefault timeline above already shows the
        // raw card, so a null-parser renderer shouldn't double it.
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={isStreaming}
          fallbackToDefault={false}
        />
      ))}
      <Renderer
        response={openuiCode}
        library={library}
        isStreaming={isStreaming}
        onAction={handleAction}
        onStateUpdate={handleStateUpdate}
        initialState={initialState}
      />
    </AssistantMessageContainer>
  );
};
