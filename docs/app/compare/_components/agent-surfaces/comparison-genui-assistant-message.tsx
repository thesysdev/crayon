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
import { TimelineEntry, ToolCallTimeline, type ToolDetailedViewPanel } from "@openuidev/react-ui";
import { useCallback, useMemo } from "react";
import {
  separateContentAndContext,
  wrapContent,
  wrapContentWithHeader,
  wrapContext,
} from "./message-sentinel";

interface ComparisonGenUIAssistantMessageProps {
  message: AssistantMessage;
  library: Library;
  detailedViewPanel?: ToolDetailedViewPanel;
}

export function ComparisonGenUIAssistantMessage({
  message,
  library,
  detailedViewPanel,
}: ComparisonGenUIAssistantMessageProps) {
  const messages = useThread((state) => state.messages);
  const isRunning = useThread((state) => state.isRunning);
  const processMessage = useThread((state) => state.processMessage);
  const updateMessage = useThread((state) => state.updateMessage);

  const isStreaming = useMemo(() => {
    if (!isRunning) return false;
    for (let index = messages.length - 1; index >= 0; index--) {
      if (messages[index]?.role === "assistant") return messages[index]?.id === message.id;
    }
    return false;
  }, [isRunning, message.id, messages]);

  const {
    content: openuiCode,
    contextString,
    contentHeader,
  } = useMemo(() => {
    if (!message.content) {
      return { content: "", contextString: null, contentHeader: undefined };
    }
    return separateContentAndContext(message.content);
  }, [message.content]);

  const initialState = useMemo(() => {
    if (!contextString) return undefined;
    try {
      const parsed: unknown = JSON.parse(contextString);
      if (Array.isArray(parsed) && isRecord(parsed[0])) return parsed[0];
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [contextString]);

  const activities = useToolActivities(message, messages);
  const registry = useArtifactRendererRegistry();
  const matchedActivities = activities.filter((activity: ToolActivity) =>
    Boolean(registry && lookupArtifactRenderer(registry, activity.toolName)),
  );

  const handleStateUpdate = useCallback(
    (state: Record<string, unknown>) => {
      const contentPart = wrapContentWithHeader(openuiCode, contentHeader);
      const nextContent =
        Object.keys(state).length > 0
          ? contentPart + wrapContext(JSON.stringify([state]))
          : contentPart;
      updateMessage({ ...message, content: nextContent });
    },
    [contentHeader, message, openuiCode, updateMessage],
  );

  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const humanFriendlyMessage = event.humanFriendlyMessage ?? "Continue";
        const contentPart = event.humanFriendlyMessage
          ? wrapContent(event.humanFriendlyMessage)
          : "";
        const messageContext: (string | object)[] = [`User clicked: ${humanFriendlyMessage}`];
        if (event.formState) messageContext.push(event.formState);

        void processMessage({
          role: "user",
          content: `${contentPart}${wrapContext(JSON.stringify(messageContext))}`,
        });
        return;
      }

      if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"];
        if (typeof url === "string") window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [processMessage],
  );

  return (
    <div className="openui-agent-thread-message-assistant">
      <div className="openui-agent-thread-message-assistant__content">
        {activities.length > 0 ? (
          <ToolCallTimeline activities={activities} isLast={isStreaming} forceDefault />
        ) : null}
        {matchedActivities.map((activity) => (
          <TimelineEntry
            key={activity.id}
            activity={activity}
            isLast={isStreaming}
            fallbackToDefault={false}
            detailedViewPanel={detailedViewPanel}
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
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
