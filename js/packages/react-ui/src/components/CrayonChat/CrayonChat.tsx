import {
  ChatProvider,
  CreateMessage,
  Message,
  processStreamedMessage,
  ResponseTemplate,
  Thread,
  ThreadListManager,
  ThreadManager,
  UserMessage,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { ThemeProvider } from "../ThemeProvider";
import { ComposedCopilot } from "./ComposedCopilot";
import { ComposedStandalone } from "./ComposedStandalone";

interface CrayonChatProps {
  processMessage?: (params: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }) => Promise<Response>;
  createThread?: (message: CreateMessage) => Promise<Thread>;
  threadManager?: ThreadManager;
  threadListManager?: ThreadListManager;
  logoUrl?: string;
  agentName?: string;
  responseTemplates?: ResponseTemplate[];
  type?: "copilot" | "standalone";
}

export const CrayonChat = ({
  processMessage,
  threadManager: userThreadManager,
  threadListManager: userThreadListManager,
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  responseTemplates,
  createThread,
  type = "standalone",
}: CrayonChatProps) => {
  invariant(processMessage || userThreadManager, "processMessage or threadManager is required");

  const threadMessages = useRef<{ [threadId: string]: Message[] }>({});
  const defaultThreadListManager = useThreadListManager({
    fetchThreadList: () => Promise.resolve([]),
    deleteThread: () => Promise.resolve(),
    updateThread: (t) => Promise.resolve(t),
    onSwitchToNew: () => {},
    onSelectThread: () => {},
    createThread: (message) => {
      if (createThread) {
        return createThread(message);
      }
      return Promise.resolve({
        threadId: crypto.randomUUID(),
        title: message.message!,
        createdAt: new Date(),
        messages: [message],
      });
    },
  });
  const threadListManager = userThreadListManager ?? defaultThreadListManager;

  const defaultThreadManager = useThreadManager({
    threadId: threadListManager.selectedThreadId,
    shouldResetThreadState: threadListManager.shouldResetThreadState,
    loadThread: (threadId) => {
      const messages = threadMessages.current[threadId] ?? [];
      return Promise.resolve(messages);
    },
    onProcessMessage: async ({ message, abortController, threadManager }) => {
      const newMessage: UserMessage = {
        id: crypto.randomUUID(),
        role: "user",
        type: "prompt",
        message: message.message,
      };
      threadManager.appendMessages(newMessage);

      let threadId = threadListManager.selectedThreadId;
      if (!threadId) {
        const newThread = await threadListManager.createThread(message as UserMessage);
        threadId = newThread.threadId;
        threadListManager.selectThread(threadId, false);
      }

      invariant(processMessage, "processMessage is required");

      const response = await processMessage({
        threadId,
        messages: [...threadManager.messages, newMessage],
        abortController,
      });
      await processStreamedMessage({
        response,
        createMessage: threadManager.appendMessages,
        updateMessage: threadManager.updateMessage,
        deleteMessage: (messageId: string) => {
          const newMessages = threadManager.messages.filter((message) => message.id !== messageId);
          threadManager.setMessages(newMessages);
        },
      });

      return [];
    },
    responseTemplates: responseTemplates ?? [],
  });

  const threadManager = userThreadManager ?? defaultThreadManager;

  useEffect(() => {
    if (threadListManager.selectedThreadId) {
      threadMessages.current[threadListManager.selectedThreadId] = threadManager.messages;
    }
  }, [threadManager.messages]);

  return (
    <ThemeProvider>
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        {type === "copilot" ? (
          <ComposedCopilot logoUrl={logoUrl} agentName={agentName} />
        ) : (
          <ComposedStandalone logoUrl={logoUrl} agentName={agentName} />
        )}
      </ChatProvider>
    </ThemeProvider>
  );
};
