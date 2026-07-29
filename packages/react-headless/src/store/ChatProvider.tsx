import { useEffect, useRef, useState, type FC } from "react";
import { createDefaultInMemoryStorage } from "../adapters/_defaultStorage";
import { useArtifactAutoOpenWatcher } from "./artifactAutoOpenWatcher";
import { ArtifactCategoriesContext } from "./ArtifactCategoriesContext";
import {
  ArtifactRenderersContext,
  buildArtifactRendererRegistry,
} from "./ArtifactRenderersContext";
import { ArtifactStorageContext } from "./ArtifactStorageContext";
import { ArtifactViewModeContext, DEFAULT_ARTIFACT_VIEW_MODE } from "./ArtifactViewModeContext";
import { ChatContext } from "./ChatContext";
import { createChatStore } from "./createChatStore";
import { createDetailedViewStore } from "./createDetailedViewStore";
import { createThreadContextStore } from "./createThreadContextStore";
import { DetailedViewContext } from "./DetailedViewContext";
import { ThreadContextContext } from "./ThreadContextContext";
import type { ChatProviderProps } from "./types";

const EMPTY_CATEGORIES: never[] = [];

export const ChatProvider: FC<ChatProviderProps> = ({
  children,
  storage,
  llm,
  artifactRenderers,
  artifactCategories,
  artifactViewMode,
}) => {
  const [resolvedStorage] = useState(() => storage ?? createDefaultInMemoryStorage());
  const [chatStore] = useState(() => createChatStore({ storage: resolvedStorage, llm }));
  const [detailedViewStore] = useState(() => createDetailedViewStore());
  const [threadContextStore] = useState(() => createThreadContextStore());
  const [artifactRendererRegistry] = useState(() =>
    buildArtifactRendererRegistry(artifactRenderers ?? []),
  );

  // Dev-mode warning if artifactRenderers reference changes after mount —
  // captured registry is mount-only, so changes are silently ignored otherwise.
  const initialRenderersRef = useRef(artifactRenderers);
  const hasWarnedRef = useRef(false);
  useEffect(() => {
    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] !== "production" &&
      !hasWarnedRef.current &&
      initialRenderersRef.current !== artifactRenderers
    ) {
      console.warn(
        "[OpenUI] `artifactRenderers` prop changed after ChatProvider mount. " +
          "The original array is kept; new renderers will not be registered. " +
          "Memoize the array (useMemo) to avoid this warning.",
      );
      hasWarnedRef.current = true;
    }
  }, [artifactRenderers]);

  // Cross-store subscription: reset detailed-view + thread-context state when the active thread changes.
  // useEffect (not inline) so the cleanup function unsubscribes on unmount.
  useEffect(() => {
    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => {
        detailedViewStore.getState().reset();
        threadContextStore.getState().reset();
      },
    );
    return unsubscribe;
  }, [chatStore, detailedViewStore, threadContextStore]);

  // Drives artifactViewMode for tool-call artifacts entirely at the store
  // layer — no rendering host involved. Declared AFTER the reset subscription
  // so on a thread switch the latch clears before this pass sees the new
  // thread's messages.
  useArtifactAutoOpenWatcher(
    artifactViewMode ?? DEFAULT_ARTIFACT_VIEW_MODE,
    artifactRendererRegistry,
    chatStore,
    detailedViewStore,
  );

  return (
    <ChatContext.Provider value={chatStore}>
      <DetailedViewContext.Provider value={detailedViewStore}>
        <ThreadContextContext.Provider value={threadContextStore}>
          <ArtifactRenderersContext.Provider value={artifactRendererRegistry}>
            <ArtifactStorageContext.Provider value={resolvedStorage.artifact ?? null}>
              <ArtifactCategoriesContext.Provider value={artifactCategories ?? EMPTY_CATEGORIES}>
                <ArtifactViewModeContext.Provider
                  value={artifactViewMode ?? DEFAULT_ARTIFACT_VIEW_MODE}
                >
                  {children}
                </ArtifactViewModeContext.Provider>
              </ArtifactCategoriesContext.Provider>
            </ArtifactStorageContext.Provider>
          </ArtifactRenderersContext.Provider>
        </ThreadContextContext.Provider>
      </DetailedViewContext.Provider>
    </ChatContext.Provider>
  );
};
