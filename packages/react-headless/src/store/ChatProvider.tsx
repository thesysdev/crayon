import { useEffect, useRef, useState, type FC } from "react";
import { createDefaultInMemoryStorage } from "../adapters/_defaultStorage";
import { AppRenderersContext, buildAppRendererRegistry } from "./AppRenderersContext";
import { ChatContext } from "./ChatContext";
import { createChatStore } from "./createChatStore";
import { createDetailedViewStore } from "./createDetailedViewStore";
import { createThreadContextStore } from "./createThreadContextStore";
import { DetailedViewContext } from "./DetailedViewContext";
import { ThreadContextContext } from "./ThreadContextContext";
import type { ChatProviderProps } from "./types";

export const ChatProvider: FC<ChatProviderProps> = ({
  children,
  storage,
  llm,
  appRenderers,
}) => {
  const [chatStore] = useState(() =>
    createChatStore({
      storage: storage ?? createDefaultInMemoryStorage(),
      llm,
    }),
  );
  const [detailedViewStore] = useState(() => createDetailedViewStore());
  const [threadContextStore] = useState(() => createThreadContextStore());
  const [appRendererRegistry] = useState(() => buildAppRendererRegistry(appRenderers ?? []));

  // Dev-mode warning if appRenderers reference changes after mount —
  // captured registry is mount-only, so changes are silently ignored otherwise.
  const initialAppRenderersRef = useRef(appRenderers);
  const hasWarnedRef = useRef(false);
  useEffect(() => {
    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] !== "production" &&
      !hasWarnedRef.current &&
      initialAppRenderersRef.current !== appRenderers
    ) {
      console.warn(
        "[OpenUI] `appRenderers` prop changed after ChatProvider mount. " +
          "The original array is kept; new renderers will not be registered. " +
          "Memoize the array (useMemo) to avoid this warning.",
      );
      hasWarnedRef.current = true;
    }
  }, [appRenderers]);

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
          <AppRenderersContext.Provider value={appRendererRegistry}>
            {children}
          </AppRenderersContext.Provider>
        </ThreadContextContext.Provider>
      </DetailedViewContext.Provider>
    </ChatContext.Provider>
  );
};
