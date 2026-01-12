import {
  ChatProvider,
  Message,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import { Sparkles } from "lucide-react";
import {
  Composer,
  Container,
  ConversationStarter,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
} from "../../CopilotShell";
// @ts-ignore
import styles from "./style.module.scss";
import logoUrl from "./thesysdev_logo.jpeg";

export default {
  title: "Components/CopilotShell",
  tags: ["dev"],
  argTypes: {
    variant: {
      control: "select",
      options: ["short", "long"],
      description: "Conversation starter variant",
    },
  },
};

const SAMPLE_STARTERS = [
  {
    displayText: "Tell me about my portfolio",
    prompt: "Tell me about the latest stock market trends and how they affect my portfolio",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "Who is the president of Venezuela and where is he currently located?",
    prompt: "Who is the president of Venezuela and where is he currently located?",
    // icon undefined = shows default lightbulb
  },
  {
    displayText: "Tell me about major stock (no icon)",
    prompt: "Tell me about major stock",
    icon: "", // Empty string = no icon
  },
];

export const Default = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => {
    const threadListManager = useThreadListManager({
      createThread: async () => {
        return {
          threadId: crypto.randomUUID(),
          title: "test",
          createdAt: new Date(),
          isRunning: false,
        };
      },
      fetchThreadList: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return [
          {
            threadId: "1",
            title: "test",
            createdAt: new Date(),
            isRunning: false,
          },
          {
            threadId: "2",
            title: "test 2",
            createdAt: new Date(),
            isRunning: false,
          },
          {
            threadId: "3",
            title: "test 3",
            createdAt: new Date(),
            isRunning: false,
          },
        ];
      },
      deleteThread: async () => {},
      updateThread: async (t) => t,
      onSwitchToNew: () => {},
      onSelectThread: () => {},
    });

    const threadManager = useThreadManager({
      threadId: threadListManager.selectedThreadId,
      loadThread: async (threadId) => {
        if (!threadId) return [];
        return [
          {
            id: crypto.randomUUID(),
            role: "user",
            type: "prompt",
            message: "Hello",
          },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "response",
            message: [{ type: "text", text: "Hello! How can I help you today?" }],
          },
        ];
      },
      onProcessMessage: async ({ message, threadManager }) => {
        const newMessage = Object.assign({}, message, {
          id: crypto.randomUUID(),
        }) as Message;
        threadManager.appendMessages(newMessage);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "response",
            message: [{ type: "text", text: "This is a response from the AI assistant." }],
          },
        ];
      },
      responseTemplates: [],
    });

    return (
      <div className={styles.container}>
        <div className={styles.left} />
        <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
          <Container logoUrl={logoUrl} agentName="Crayon">
            <ThreadContainer>
              <Header />
              <ScrollArea>
                <Messages loader={<MessageLoading />} />
              </ScrollArea>
              <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
              <Composer />
            </ThreadContainer>
          </Container>
        </ChatProvider>
      </div>
    );
  },
};

export const LongVariant = {
  args: {
    variant: "long",
  },
  render: ({ variant }: { variant: "short" | "long" }) => {
    const threadListManager = useThreadListManager({
      createThread: async () => ({
        threadId: crypto.randomUUID(),
        title: "New Chat",
        createdAt: new Date(),
        isRunning: false,
      }),
      fetchThreadList: async () => [],
      deleteThread: async () => {},
      updateThread: async (t) => t,
      onSwitchToNew: () => {},
      onSelectThread: () => {},
    });

    const threadManager = useThreadManager({
      threadId: threadListManager.selectedThreadId,
      loadThread: async () => [], // Start with empty thread to show starters
      onProcessMessage: async ({ message, threadManager }) => {
        const newMessage = Object.assign({}, message, {
          id: crypto.randomUUID(),
        }) as Message;
        threadManager.appendMessages(newMessage);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "response",
            message: [{ type: "text", text: `You asked: "${message.message}"` }],
          },
        ];
      },
      responseTemplates: [],
    });

    return (
      <div className={styles.container}>
        <div className={styles.left} />
        <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
          <Container logoUrl={logoUrl} agentName="Crayon">
            <ThreadContainer>
              <Header />
              <ScrollArea>
                <Messages loader={<MessageLoading />} />
              </ScrollArea>
              <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
              <Composer />
            </ThreadContainer>
          </Container>
        </ChatProvider>
      </div>
    );
  },
};
