"use client";

import type { AssistantMessage, Message, ToolActivity } from "@openuidev/react-headless";
import {
  lookupArtifactRenderer,
  useArtifactRendererRegistry,
  useThread,
  useToolActivities,
} from "@openuidev/react-headless";
import type { ActionEvent, Library } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { useCallback, useMemo, useRef } from "react";
import {
  narrationPrefix,
  separateContentAndContext,
  wrapContent,
  wrapContentWithHeader,
  wrapContext,
} from "../../utils/sentinelParser";
import { ToolCallTimeline, type TimelineStep } from "../ToolCall";
import { TimelineEntry } from "../_shared/tool-renderer";
import { AssistantMessageContainer } from "./AssistantMessageContainer";

export const GenUIAssistantMessage = ({
  message,
  library,
  messageGroup,
}: {
  message: AssistantMessage;
  library: Library;
  /**
   * The TURN this message belongs to (contiguous assistant/tool block),
   * pre-computed by the thread and passed down. This component renders
   * dumbly from it — no thread-structure derivation of its own. Absent →
   * plain single-message rendering.
   */
  messageGroup?: Message[];
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

  // ── Turn roles ─────────────────────────────────────────────────────────────
  // A stored interleaved run loads as SEVERAL assistant messages (thinking +
  // its tool calls each, then the answer). The thread pre-computes the turn
  // and hands it down as `messageGroup`; the LAST segment hosts everything —
  // the single ToolCallTimeline for the whole turn (thinking prose between
  // the tool rows) AND, once the turn closes with pure text, the Lang
  // renderer — so tray and answer share one message container. Earlier
  // segments render nothing (the thread filters them out). Single-segment
  // turns (or no `messageGroup`) keep today's per-message behavior exactly.
  const turnSegments = useMemo(() => {
    const turn = messageGroup?.length ? messageGroup : [message];
    return turn.filter((m): m is AssistantMessage => m.role === "assistant");
  }, [messageGroup, message]);

  const interleaved = turnSegments.length >= 2;
  const firstSegment = turnSegments[0] ?? message;
  const lastSegment = turnSegments[turnSegments.length - 1] ?? message;
  const turnLive = isRunning && lastAssistantId === lastSegment.id;

  // The ANSWER is the segment that closes the turn with pure text. While the
  // newest segment still carries tool calls on a live run, the model is
  // mid-work — everything stays in the timeline. A settled turn always
  // surfaces the last segment so no text is ever lost. Single-segment turns
  // treat the message itself as the answer (today's behavior).
  const lastIsPureText = (lastSegment.toolCalls?.length ?? 0) === 0;
  const answerSegment = !interleaved ? message : lastIsPureText || !turnLive ? lastSegment : null;
  const isAnswerSegment = answerSegment?.id === message.id;

  // Separate openui-lang code from persisted form state. `narrationSections`
  // are the thinking sections BEFORE the last one; `content` is the last
  // section — the response, or the newest thinking while it streams.
  const {
    content: openuiCode,
    contextString,
    contentHeader,
    narrationSections,
  } = useMemo(() => {
    if (!message.content) {
      return {
        content: null,
        contextString: null,
        contentHeader: undefined,
        narrationSections: undefined,
      };
    }
    return separateContentAndContext(message.content);
  }, [message.content]);

  // Has the RESPONSE section started (single-segment live runs)? The response
  // is Lang code — recognized by its fence when present, or by the mandatory
  // `root = …` assignment when the backend emits it UNFENCED (otherwise
  // unfenced Lang classifies as thinking and streams into the tray). A reply
  // without tool calls IS the response from its first byte, and a settled run
  // always surfaces whatever it has (no text is ever lost).
  const looksLikeLang =
    !!openuiCode &&
    (openuiCode.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(openuiCode));
  const singleResponseStarted =
    !!openuiCode && ((message.toolCalls?.length ?? 0) === 0 || looksLikeLang || !isRunning);

  // While the response hasn't started, the LAST section is thinking too —
  // it belongs in the timeline, not the Lang renderer.
  const pendingThinking = !interleaved && !singleResponseStarted && openuiCode ? openuiCode : null;

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

  // ONE id-keyed pairing of calls↔results (with real status) for the whole
  // turn: a synthetic message carrying every segment's tool calls in order.
  // (useToolActivities only reads id/toolCalls and keys its memo on the args,
  // so the merge stays live.)
  const turnMessage = useMemo(
    () => ({ ...firstSegment, toolCalls: turnSegments.flatMap((s) => s.toolCalls ?? []) }),
    [firstSegment, turnSegments],
  );
  const turnActivities = useToolActivities(turnMessage, messages);

  // This instance's own activities are the subset whose calls belong to
  // `message` — identical to turnActivities when the turn is just us, so no
  // second pairing pass is needed.
  const activities = useMemo(() => {
    if (!interleaved) return turnActivities;
    const ownIds = new Set((message.toolCalls ?? []).map((t) => t.id));
    return turnActivities.filter((a) => ownIds.has(a.toolCall.id));
  }, [interleaved, turnActivities, message.toolCalls]);

  // Single-segment (live) timeline rows: thinking sections as text steps
  // before the tool rows. `undefined` keeps the tray's plain activities-only
  // rendering when there is no thinking to show.

  // ── Arrival-order ledger ──
  // The flat message records no interleave between its content sections and
  // its tool calls — but this component re-renders on every stream delta, so
  // it can OBSERVE the order things arrive in: a second thought that starts
  // after the first tool call renders beneath it, matching the wire.
  const arrival = useRef<{
    messageId: string;
    textCount: number;
    toolIds: Set<string>;
    order: ({ kind: "text"; index: number } | { kind: "tool"; id: string })[];
  }>({ messageId: message.id, textCount: 0, toolIds: new Set(), order: [] });
  if (arrival.current.messageId !== message.id) {
    arrival.current = { messageId: message.id, textCount: 0, toolIds: new Set(), order: [] };
  }
  {
    const ledger = arrival.current;
    // New text section(s) first: within one batched render, narration
    // precedes the tool calls it narrates (protocol order).
    const textCountNow = (narrationSections?.length ?? 0) + (pendingThinking ? 1 : 0);
    while (ledger.textCount < textCountNow) {
      ledger.order.push({ kind: "text", index: ledger.textCount++ });
    }
    for (const toolCall of message.toolCalls ?? []) {
      if (!ledger.toolIds.has(toolCall.id)) {
        ledger.toolIds.add(toolCall.id);
        ledger.order.push({ kind: "tool", id: toolCall.id });
      }
    }
  }

  const ownSteps = useMemo<TimelineStep[] | undefined>(() => {
    if (interleaved) return undefined;
    const texts = [...(narrationSections ?? [])];
    if (pendingThinking) texts.push(pendingThinking);
    if (texts.length === 0) return undefined;
    const byCallId = new Map(activities.map((a) => [a.toolCall.id, a]));
    const rows: TimelineStep[] = [];
    for (const entry of arrival.current.order) {
      if (entry.kind === "text") {
        const text = texts[entry.index];
        // Index-based ids stay stable when the pending section is later
        // promoted into narrationSections (same position → same key).
        if (text) rows.push({ type: "text", id: `${message.id}::thinking-${entry.index}`, text });
      } else {
        const activity = byCallId.get(entry.id);
        if (activity) rows.push({ type: "activity", activity });
      }
    }
    return rows;
  }, [interleaved, narrationSections, pendingThinking, activities, message.id]);

  // Display rows for the merged timeline, in run order: each thinking segment
  // contributes its prose (sentinel-stripped) followed by its tool rows. The
  // answer's text never appears here — it renders below via the Lang renderer.
  const turnSteps = useMemo<TimelineStep[]>(() => {
    const byCallId = new Map(turnActivities.map((a) => [a.toolCall.id, a]));
    const rows: TimelineStep[] = [];
    for (const segment of turnSegments) {
      if (segment.id !== answerSegment?.id) {
        const { content } = separateContentAndContext(segment.content ?? "");
        if (content) rows.push({ type: "text", id: segment.id, text: content });
      }
      for (const toolCall of segment.toolCalls ?? []) {
        const activity = byCallId.get(toolCall.id);
        if (activity) rows.push({ type: "activity", activity });
      }
    }
    return rows;
  }, [turnSegments, turnActivities, answerSegment?.id]);

  // The "Behind the scenes" timeline shows the RAW request/response for EVERY
  // tool call (forceDefault), so matched tools (artifacts, web search) stay
  // inspectable there. Matched renderers additionally render their rich preview
  // OUTSIDE the timeline so it's always visible and its detailed-view panel
  // stays mounted even after the message completes. The turn host surfaces the
  // WHOLE turn's matched previews — earlier segments render nothing themselves.
  const isTurnHost = interleaved && lastSegment.id === message.id;
  const registry = useArtifactRendererRegistry();
  const isMatched = (a: ToolActivity) =>
    !!(registry && lookupArtifactRenderer(registry, a.toolName));
  const matchedActivities = (isTurnHost ? turnActivities : activities).filter(isMatched);

  // Persist form state into the inline-wrapped message content. The original
  // header line (which may include `libraryVersion` and telemetry tags emitted
  // by the backend) is reused so attrs survive the persist round-trip.
  const handleStateUpdate = useCallback(
    (state: Record<string, any>) => {
      const code = openuiCode ?? "";
      const hasState = Object.keys(state).length > 0;
      // Rebuild only the LAST section; the thinking sections before it are
      // displayed now, so they must round-trip verbatim.
      const contentPart =
        narrationPrefix(message.content ?? "") + wrapContentWithHeader(code, contentHeader);
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

  const rendersOwnTimeline = !interleaved && activities.length > 0;
  const rendersTurnTimeline = isTurnHost && turnActivities.length > 0;

  // A middle thinking segment with nothing of its own to show (its prose and
  // tool rows live in the first segment's timeline) must mount NOTHING — an
  // empty message container otherwise paints as a stray divider between the
  // timeline and the answer.
  if (
    !rendersOwnTimeline &&
    !rendersTurnTimeline &&
    !isAnswerSegment &&
    matchedActivities.length === 0
  ) {
    return null;
  }

  return (
    <AssistantMessageContainer>
      {rendersOwnTimeline && (
        // Raw request/response for ALL tool calls, collapsed by default, with
        // thinking prose as text steps. Held open until the RESPONSE section
        // starts — thinking bytes alone must not collapse it.
        <ToolCallTimeline
          activities={activities}
          steps={ownSteps}
          isLast={isStreaming}
          forceDefault
          awaitingResponse={isStreaming && !singleResponseStarted}
        />
      )}
      {rendersTurnTimeline && (
        // Interleaved turn: ONE timeline for the whole turn, hosted at the
        // turn's LAST segment so it sits in the same container as the answer.
        // Thinking prose renders between the raw tool rows.
        <ToolCallTimeline
          activities={turnActivities}
          steps={turnSteps}
          isLast={turnLive}
          forceDefault
        />
      )}
      {matchedActivities.map((activity: ToolActivity) => (
        // Matched renderers (artifact previews, web search) — always visible,
        // for thinking segments too. No raw fallback here: the forceDefault
        // timeline above already shows the raw card, so a null-parser renderer
        // shouldn't double it.
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={isStreaming}
          fallbackToDefault={false}
        />
      ))}
      {(interleaved ? isAnswerSegment : singleResponseStarted) && (
        // Thinking prose lives in the timeline; the Lang renderer only gets
        // the actual response — no extra bubble per thinking section.
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
