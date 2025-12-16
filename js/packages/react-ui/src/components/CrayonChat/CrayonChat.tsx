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
import { ScrollVariant } from "../../hooks/useScrollToBottom";
import { ThemeProps, ThemeProvider } from "../ThemeProvider";
import { ComposedBottomTray } from "./ComposedBottomTray";
import { ComposedCopilot } from "./ComposedCopilot";
import { ComposedStandalone } from "./ComposedStandalone";

export enum CrayonChatType {
  COPILOT = "copilot",
  STANDALONE = "standalone",
  BOTTOM_TRAY = "bottom-tray",
}

type BaseCrayonChatProps = {
  // options used when threadManager not provided
  processMessage?: (params: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }) => Promise<Response>;
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
  scrollVariant?: ScrollVariant;

  messageLoadingComponent?: () => React.ReactNode;
  disableThemeProvider?: boolean;

  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
};

type BottomTrayProps = {
  type: CrayonChatType.BOTTOM_TRAY;
  /** Control the open state of the bottom tray */
  isOpen?: boolean;
  /** Callback when bottom tray open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Default open state for bottom tray (uncontrolled) */
  defaultOpen?: boolean;
};

type OtherTypeProps = {
  type?: CrayonChatType.COPILOT | CrayonChatType.STANDALONE;
};

type CrayonChatProps = BaseCrayonChatProps & (BottomTrayProps | OtherTypeProps);

const DummyThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export const CrayonChat = (props: CrayonChatProps) => {
  const {
    processMessage,
    threadManager: userThreadManager,
    threadListManager: userThreadListManager,
    logoUrl = "https://crayonai.org/img/logo.png",
    agentName = "My Agent",
    responseTemplates,
    createThread,
    onUpdateMessage,
    processStreamedMessage: userProcessStreamedMessage,
    messageLoadingComponent,
    type = CrayonChatType.STANDALONE,
    theme,
    scrollVariant = "user-message-anchor",
    disableThemeProvider,
    isArtifactActive,
    renderArtifact,
  } = props;

  // Extract bottom-tray specific props if type is bottom-tray
  const isOpen =
    type === CrayonChatType.BOTTOM_TRAY
      ? (props as BottomTrayProps & BaseCrayonChatProps).isOpen
      : undefined;
  const onOpenChange =
    type === CrayonChatType.BOTTOM_TRAY
      ? (props as BottomTrayProps & BaseCrayonChatProps).onOpenChange
      : undefined;
  const defaultOpen =
    type === CrayonChatType.BOTTOM_TRAY
      ? (props as BottomTrayProps & BaseCrayonChatProps).defaultOpen
      : undefined;

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
    onProcessMessage: async ({ message, abortController, threadManager }) => {
      const newMessage: UserMessage = {
        id: crypto.randomUUID(),
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
            isArtifactActive={isArtifactActive}
            renderArtifact={renderArtifact}
          />
        ) : type === "bottom-tray" ? (
          <ComposedBottomTray
            logoUrl={logoUrl}
            agentName={agentName}
            messageLoadingComponent={messageLoadingComponent}
            scrollVariant={scrollVariant}
            isArtifactActive={isArtifactActive}
            renderArtifact={renderArtifact}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            defaultOpen={defaultOpen}
          />
        ) : (
          <ComposedStandalone
            logoUrl={logoUrl}
            agentName={agentName}
            messageLoadingComponent={messageLoadingComponent}
            scrollVariant={scrollVariant}
            isArtifactActive={isArtifactActive}
            renderArtifact={renderArtifact}
          />
        )}
      </ChatProvider>
    </ThemeProviderComponent>
  );
};
