import { FC, useEffect, useMemo } from "react";
import { createArtifactStore } from "./internal/ArtifactContext";
import { ChatContext } from "./internal/ChatContext";
import { useThreadListManagerStore } from "./internal/useThreadListManagerStore";
import { useThreadManagerStore } from "./internal/useThreadManagerStore";
import { ChatManager } from "./types";

/**
 * @category Components
 */
export const ChatProvider: FC<React.PropsWithChildren<ChatManager>> = ({
  threadManager: inputThreadManager,
  threadListManager: inputThreadListManager,
  children,
}: React.PropsWithChildren<ChatManager>) => {
  const threadManagerStore = useThreadManagerStore(inputThreadManager);
  const threadListManagerStore = useThreadListManagerStore(inputThreadListManager);
  const artifactStore = useMemo(() => createArtifactStore(), []);

  useEffect(() => {
    let prevThreadId = threadListManagerStore.getState().selectedThreadId;
    const unsub = threadListManagerStore.subscribe((state) => {
      if (state.selectedThreadId !== prevThreadId) {
        artifactStore.getState().clearActiveArtifact();
        prevThreadId = state.selectedThreadId;
      }
    });
    return unsub;
  }, [threadListManagerStore, artifactStore]);

  const ctxValue = useMemo(
    () => ({
      threadListManager: threadListManagerStore,
      threadManager: threadManagerStore,
      artifactStore,
    }),
    [threadListManagerStore, threadManagerStore, artifactStore],
  );

  return <ChatContext.Provider value={ctxValue}>{children}</ChatContext.Provider>;
};
