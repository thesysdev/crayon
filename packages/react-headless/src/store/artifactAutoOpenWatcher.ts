import { useEffect } from "react";
import { shouldAutoOpen } from "../hooks/useArtifactAutoOpen";
import type { AssistantMessage, Message, ToolMessage } from "../types";
import { lookupArtifactRenderer, type ArtifactRendererRegistry } from "./ArtifactRenderersContext";
import type { ArtifactViewMode } from "./ArtifactViewModeContext";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { DetailedViewStore } from "./detailedViewTypes";
import { runArtifactRenderer } from "./runArtifactRenderer";
import type { ToolCallStatus } from "./toolActivity";

/** The store data one auto-open pass reads. @internal */
export interface AutoOpenSnapshot {
  messages: ReadonlyArray<Message>;
  executingToolCallIds: ReadonlySet<string>;
}

/**
 * One auto-open pass over a thread's messages: for every artifact tool call
 * that hasn't already auto-opened, decide per the view mode and open the
 * artifact's detailed view.
 *
 * Pure with respect to its inputs (all effects go through `detailedView`), so
 * it is unit-testable without React. Cost is bounded by the latch: a claimed
 * (or user-closed) call is skipped by the `_autoOpenedArtifactKeys` pre-check
 * before any parsing, so during streaming only the not-yet-opened call pays a
 * parser run per update — and only until its header (`meta`) arrives.
 *
 * Deliberate limits:
 * - A parser that never yields `meta` (inline-only renderers) cannot auto-open:
 *   its detailed-view id is minted by the rendering host (`useId`), which a
 *   store-level pass cannot know. Such hosts call `useArtifactAutoOpen`.
 * - An errored tool call never opens; a call that errors *after* opening keeps
 *   whatever the user sees (same as the previous host-side behavior).
 *
 * @internal
 */
export function evaluateArtifactAutoOpen(
  viewMode: ArtifactViewMode,
  registry: ArtifactRendererRegistry,
  snapshot: AutoOpenSnapshot,
  detailedView: Pick<
    DetailedViewStore,
    "_autoOpenedArtifactKeys" | "_markAutoOpened" | "setActiveDetailedView"
  >,
): void {
  if (viewMode === "overview") return;

  // toolCallId → result message, built lazily only when an unlatched artifact
  // call exists (the common steady state — everything latched — never builds it).
  let resultsByCallId: Map<string, ToolMessage> | null = null;

  for (const message of snapshot.messages) {
    if (message.role !== "assistant") continue;
    for (const toolCall of (message as AssistantMessage).toolCalls ?? []) {
      if (detailedView._autoOpenedArtifactKeys.has(toolCall.id)) continue;
      const renderer = lookupArtifactRenderer(registry, toolCall.function.name);
      if (!renderer) continue;

      if (resultsByCallId === null) {
        resultsByCallId = new Map();
        for (const m of snapshot.messages) {
          if (m.role === "tool") {
            const tm = m as ToolMessage;
            if (tm.toolCallId) resultsByCallId.set(tm.toolCallId, tm);
          }
        }
      }
      const toolMessage = resultsByCallId.get(toolCall.id) ?? null;
      if (toolMessage?.error) continue;

      const status: ToolCallStatus = toolMessage
        ? "complete"
        : snapshot.executingToolCallIds.has(toolCall.id)
          ? "executing"
          : "streaming";
      if (!shouldAutoOpen(viewMode, status === "streaming" || status === "executing")) continue;

      let meta: { id: string; version: number } | null = null;
      try {
        meta =
          runArtifactRenderer(renderer, {
            toolCall,
            result: toolMessage?.content ?? null,
            status,
          })?.meta ?? null;
      } catch {
        continue; // host renders the parse failure; nothing to open
      }
      // No header yet: leave the latch unclaimed so a later, fuller snapshot
      // gets to open it.
      if (!meta) continue;

      if (!detailedView._markAutoOpened(toolCall.id)) continue;
      detailedView.setActiveDetailedView(`${meta.id}:${meta.version}`);
    }
  }
}

/**
 * ChatProvider-internal driver for {@link ArtifactViewMode} on the tool-call
 * path: subscribes to the thread's messages and runs
 * {@link evaluateArtifactAutoOpen} on every change (and once on mount, which
 * is what opens the newest artifact of a freshly loaded thread in
 * `"open-on-mount"`). `"overview"` subscribes to nothing.
 *
 * Lives at the store layer so no rendering host has to wire auto-open —
 * any UI on top of ChatProvider gets it from the prop alone. Non-tool-call
 * artifact sources (which the chat store can't see) use `useArtifactAutoOpen`.
 *
 * @internal
 */
export function useArtifactAutoOpenWatcher(
  viewMode: ArtifactViewMode,
  registry: ArtifactRendererRegistry,
  chatStore: ReturnType<typeof createChatStore>,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): void {
  useEffect(() => {
    if (viewMode === "overview") return;
    const evaluate = () => {
      const { messages, executingToolCallIds } = chatStore.getState();
      evaluateArtifactAutoOpen(
        viewMode,
        registry,
        { messages, executingToolCallIds },
        detailedViewStore.getState(),
      );
    };
    return chatStore.subscribe((s) => s.messages, evaluate, { fireImmediately: true });
  }, [viewMode, registry, chatStore, detailedViewStore]);
}
