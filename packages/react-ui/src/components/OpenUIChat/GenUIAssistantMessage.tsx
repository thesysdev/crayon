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
import { ToolCallTimeline, type TimelineStep } from "../ToolCall";
import { TimelineEntry } from "../_shared/tool-renderer";
import { AssistantMessageContainer } from "./AssistantMessageContainer";

/**
 * Renders a SINGLE assistant message: its tool timeline (with its thinking
 * prose as the leading step) and, once the response section has begun, the
 * OpenUI-lang answer.
 *
 * Multi-segment turns (thinking… then answer, split across messages by the
 * stream layer) are assembled ONE level up, in the thread's `InterleavedTurn`,
 * which owns the single merged tray and calls this component only for the
 * answer segment. So there is no turn/grouping logic here — one message in,
 * one message rendered.
 */
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

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i]!.id;
    }
    return null;
  }, [messages]);
  const isStreaming = isRunning && lastAssistantId === message.id;

  // The stream layer emits one content section per message, so this entry holds
  // a single section — its thinking prose, or the final response. Strip the
  // sentinels and separate any inline form-state.
  const { content, contextString, contentHeader } = useMemo(
    () =>
      message.content
        ? separateContentAndContext(message.content)
        : { content: null, contextString: null, contentHeader: undefined },
    [message.content],
  );

  // Is this section the RESPONSE (Lang), not thinking? Lang carries a fence, or
  // (unfenced) the mandatory `root =`. A reply with no tool calls is the
  // response from its first byte; a settled run always surfaces what it has.
  const looksLikeLang =
    !!content && (content.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(content));
  const singleResponseStarted =
    !!content && ((message.toolCalls?.length ?? 0) === 0 || looksLikeLang || !isRunning);
  const openuiCode = singleResponseStarted ? content : null;
  // Otherwise the section is thinking — it belongs in the timeline, not the
  // Lang renderer.
  const pendingThinking = !singleResponseStarted ? content : null;

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

  const activities = useToolActivities(message, messages);

  // Timeline rows: this message's thinking prose (if any) followed by its tools.
  const ownSteps = useMemo<TimelineStep[] | undefined>(() => {
    if (!pendingThinking) return undefined;
    return [
      { type: "text" as const, id: `${message.id}::thinking`, text: pendingThinking },
      ...activities.map((activity) => ({ type: "activity" as const, activity })),
    ];
  }, [pendingThinking, activities, message.id]);

  // Matched renderers (artifact previews, web search) render OUTSIDE the tray
  // so they stay visible after it collapses.
  const registry = useArtifactRendererRegistry();
  const matchedActivities = activities.filter(
    (a) => !!(registry && lookupArtifactRenderer(registry, a.toolName)),
  );

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
        // Raw request/response for ALL tool calls, collapsed by default, with
        // thinking prose as the leading step. Held open until the response
        // section starts — thinking bytes alone must not collapse it.
        <ToolCallTimeline
          activities={activities}
          steps={ownSteps}
          isLast={isStreaming}
          forceDefault
          awaitingResponse={isStreaming && !singleResponseStarted}
        />
      )}
      {matchedActivities.map((activity: ToolActivity) => (
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
      {singleResponseStarted && (
        <Renderer
          response={openuiCode}
          library={library}
          isStreaming={isStreaming}
          onAction={handleAction}
          onStateUpdate={handleStateUpdate}
          initialState={initialState}
        />
      )}
    </AssistantMessageContainer>
  );
};
