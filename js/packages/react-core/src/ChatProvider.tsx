import { FC, useMemo } from "react";
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

  const ctxValue = useMemo(
    () => ({
      threadListManager: threadListManagerStore,
      threadManager: threadManagerStore,
    }),
    [threadListManagerStore, threadManagerStore],
  );

  return <ChatContext.Provider value={ctxValue}>{children}</ChatContext.Provider>;
};
