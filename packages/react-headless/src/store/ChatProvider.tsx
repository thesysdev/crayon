import { useEffect, useRef, useState, type FC } from "react";
import { createDefaultInMemoryStorage } from "../adapters/_defaultStorage";
import { ArtifactCategoriesContext } from "./ArtifactCategoriesContext";
import {
  ArtifactRenderersContext,
  buildArtifactRendererRegistry,
} from "./ArtifactRenderersContext";
import { ArtifactStorageContext } from "./ArtifactStorageContext";
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

  return (
    <ChatContext.Provider value={chatStore}>
      <DetailedViewContext.Provider value={detailedViewStore}>
        <ThreadContextContext.Provider value={threadContextStore}>
          <ArtifactRenderersContext.Provider value={artifactRendererRegistry}>
            <ArtifactStorageContext.Provider value={resolvedStorage.artifact ?? null}>
              <ArtifactCategoriesContext.Provider value={artifactCategories ?? EMPTY_CATEGORIES}>
                {children}
              </ArtifactCategoriesContext.Provider>
            </ArtifactStorageContext.Provider>
          </ArtifactRenderersContext.Provider>
        </ThreadContextContext.Provider>
      </DetailedViewContext.Provider>
    </ChatContext.Provider>
  );
};
