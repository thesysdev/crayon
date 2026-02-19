import { useRef } from "react";
import { processStreamedMessage } from "./stream/processStreamedMessage";
import { ChatManager, Message, StreamProtocolAdapter, Thread, UserMessage } from "./types";
import { useThreadListManager } from "./useThreadListManager";
import { useThreadManager } from "./useThreadManager";

type ThreadParams =
  | {
      threadApiUrl: string;
      fetchThreadList?: never;
      createThread?: never;
      deleteThread?: never;
      updateThread?: never;
      loadThread?: never;
    }
  | {
      threadApiUrl?: never;
      fetchThreadList?: () => Promise<Thread[]>;
      createThread?: (firstMessage: UserMessage) => Promise<Thread>;
      deleteThread?: (id: string) => Promise<void>;
      updateThread?: (updated: Thread) => Promise<Thread>;
      loadThread?: (threadId: string) => Promise<Message[]>;
    };

type ApiParams =
  | {
      apiUrl: string;
      processMessage?: never;
    }
  | {
      apiUrl?: never;
      processMessage: (params: {
        threadId: string;
        messages: Message[];
        abortController: AbortController;
      }) => Promise<Response>;
    };

export type UseChatParams = ThreadParams &
  ApiParams & {
    // Protocol
    streamProtocol?: StreamProtocolAdapter;
  };

export const useChat = ({
  apiUrl,
  threadApiUrl,
  processMessage: userProcessMessage,
  fetchThreadList,
  createThread,
  deleteThread,
  updateThread,
  loadThread,
  streamProtocol,
}: UseChatParams): ChatManager => {
  const paramsRef = useRef({ apiUrl, threadApiUrl });
  paramsRef.current = { apiUrl, threadApiUrl };

  const defaultFetchThreadList = async () => {
    if (!threadApiUrl) return [];
    const res = await fetch(`${threadApiUrl}/get`);
    return res.json();
  };

  const defaultCreateThread = async (firstMessage: UserMessage) => {
    if (!threadApiUrl) throw new Error("threadApiUrl or createThread must be provided");
    const res = await fetch(`${threadApiUrl}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: firstMessage }),
    });
    return res.json();
  };

  const defaultDeleteThread = async (id: string) => {
    if (!threadApiUrl) return;
    await fetch(`${threadApiUrl}/delete/${id}`, { method: "DELETE" });
  };

  const defaultUpdateThread = async (updated: Thread) => {
    if (!threadApiUrl) return updated;
    const res = await fetch(`${threadApiUrl}/update/${updated.threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    return res.json();
  };

  const defaultLoadThread = async (threadId: string) => {
    if (!threadApiUrl) return [];
    const res = await fetch(`${threadApiUrl}/get/${threadId}`);
    return res.json();
  };

  const defaultProcessMessage = async ({
    threadId,
    messages,
    abortController,
  }: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }) => {
    if (!apiUrl) throw new Error("apiUrl or processMessage must be provided");
    return fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, messages }),
      signal: abortController.signal,
    });
  };

  const threadListManager = useThreadListManager({
    fetchThreadList: fetchThreadList || defaultFetchThreadList,
    createThread: createThread || defaultCreateThread,
    deleteThread: deleteThread || defaultDeleteThread,
    updateThread: updateThread || defaultUpdateThread,
    onSwitchToNew: () => {},
    onSelectThread: () => {},
  });

  const threadManager = useThreadManager({
    threadId: threadListManager.selectedThreadId,
    shouldResetThreadState: threadListManager.shouldResetThreadState,
    loadThread: loadThread || defaultLoadThread,
    onProcessMessage: async ({ message, threadManager, abortController }) => {
      // 1. Optimistically append user message
      const optimisticMessage: UserMessage = {
        ...message,
        id: crypto.randomUUID(),
        role: "user",
      };
      threadManager.appendMessages(optimisticMessage);

      let threadId = threadListManager.selectedThreadId;

      // 2. If no thread selected, create one
      if (!threadId) {
        // If createThread is available (either provided or default via threadApiUrl)
        if (createThread || threadApiUrl) {
          try {
            const createdThread = await threadListManager.createThread(optimisticMessage);
            threadId = createdThread.threadId;
            threadListManager.selectThread(threadId, false);
          } catch (e) {
            console.error("Failed to create thread", e);
            throw e;
          }
        } else {
          // No thread management, maybe just ephemeral chat?
          // If apiUrl handles it, maybe it returns threadId?
          // For now, assume ephemeral if no threadApiUrl.
          threadId = "ephemeral";
        }
      }

      // 3. Process message
      const response = await (userProcessMessage || defaultProcessMessage)({
        threadId,
        messages: [...threadManager.messages, optimisticMessage],
        abortController,
      });

      // 4. Stream response
      await processStreamedMessage({
        response,
        createMessage: threadManager.appendMessages,
        updateMessage: threadManager.updateMessage,
        deleteMessage: threadManager.deleteMessage,
        adapter: streamProtocol,
      });

      return [];
    },
  });

  return { threadManager, threadListManager };
};
