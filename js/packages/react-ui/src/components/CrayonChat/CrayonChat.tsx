import {
  ChatProvider,
  CreateMessage,
  Message,
  processStreamedMessage,
  ResponseTemplate,
  Thread,
  ThreadListManager,
  ThreadManager,
  UploadedFile,
  UserMessage,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { ScrollVariant } from "../../hooks/useScrollToBottom";
import { ThemeProps, ThemeProvider } from "../ThemeProvider";
import { ComposedCopilot } from "./ComposedCopilot";
import { ComposedStandalone } from "./ComposedStandalone";

type CrayonChatProps = {
  // options used when threadManager not provided
  processMessage?: (params: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }) => Promise<Response>;
  processFileUpload?: (params: { files: File[] }) => Promise<UploadedFile[]>;
  onUpdateMessage?: (props: { message: Message }) => void;
  processStreamedMessage?: typeof processStreamedMessage;
  responseTemplates?: ResponseTemplate[];

  theme?: ThemeProps;

  // options used when threadListManager is not provided
  createThread?: (message: CreateMessage) => Promise<Thread>;

  threadManager?: ThreadManager;
  threadListManager?: ThreadListManager;

  logoUrl?: string;
  agentName?: string;
  type?: "copilot" | "standalone";
  scrollVariant?: ScrollVariant;

  messageLoadingComponent?: () => React.ReactNode;
  disableThemeProvider?: boolean;
};

const DummyThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export const CrayonChat = ({
  processMessage,
  processFileUpload,
  threadManager: userThreadManager,
  threadListManager: userThreadListManager,
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  responseTemplates,
  createThread,
  onUpdateMessage,
  processStreamedMessage: userProcessStreamedMessage,
  messageLoadingComponent,
  type = "standalone",
  theme,
  scrollVariant = "user-message-anchor",
  disableThemeProvider,
}: CrayonChatProps) => {
  invariant(processMessage || userThreadManager, "processMessage or threadManager is required");
  const ThemeProviderComponent = disableThemeProvider ? DummyThemeProvider : ThemeProvider;

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
    onUpdateMessage: onUpdateMessage,
    onProcessMessage: async ({ message, abortController, threadManager, filesUploaded }) => {
      const newMessage: UserMessage = {
        id: crypto.randomUUID(),
        files: filesUploaded,
        ...message,
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
      await (userProcessStreamedMessage || processStreamedMessage)({
        response,
        createMessage: threadManager.appendMessages,
        updateMessage: threadManager.updateMessage,
        deleteMessage: threadManager.deleteMessage,
      });

      return [];
    },
    onProcessFileUpload: async ({ files }) => {
      invariant(processFileUpload, "processFileUpload is required");

      const response = await processFileUpload({ files });
      return response;
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
    <ThemeProviderComponent {...theme}>
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        {type === "copilot" ? (
          <ComposedCopilot
            logoUrl={logoUrl}
            agentName={agentName}
            messageLoadingComponent={messageLoadingComponent}
            scrollVariant={scrollVariant}
          />
        ) : (
          <ComposedStandalone
            logoUrl={logoUrl}
            agentName={agentName}
            messageLoadingComponent={messageLoadingComponent}
            scrollVariant={scrollVariant}
          />
        )}
      </ChatProvider>
    </ThemeProviderComponent>
  );
};
