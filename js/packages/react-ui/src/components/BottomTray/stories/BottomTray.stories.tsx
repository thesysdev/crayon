import {
  ChatProvider,
  Message,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import { MessageSquare, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import {
  Composer,
  Container,
  ConversationStarter,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  Trigger,
  WelcomeScreen,
} from "../../BottomTray";
// @ts-ignore
import styles from "./style.module.scss";
import logoUrl from "./thesysdev_logo.jpeg";

export default {
  title: "Components/BottomTray",
  tags: ["dev"],
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Whether the tray starts open",
    },
    variant: {
      control: "select",
      options: ["short", "long"],
      description: "Conversation starter variant",
    },
  },
};

const BottomTrayStory = ({
  defaultOpen = false,
  variant = "short",
}: {
  defaultOpen?: boolean;
  variant?: "short" | "long";
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
      // Return empty for new thread (null), otherwise return existing messages
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
    onProcessMessage: async ({ message, threadManager, abortController }) => {
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
          message: [{ type: "text", text: "This is a response from the bottom tray assistant!" }],
        },
      ];
    },
    responseTemplates: [],
  });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Bottom Tray Example (Composable)</h1>
        <p>
          The chat interface uses a <strong>composition pattern</strong>. The trigger button is
          separate from the container, giving you full control over placement and styling.
        </p>
        <p>
          <strong>Try it:</strong> Click the pill button (bottom-right) or the custom button below
          to toggle the tray.
        </p>
        <button onClick={() => setIsOpen(!isOpen)} className={styles.toggleButton}>
          {isOpen ? "Close" : "Open"} Tray
        </button>
      </div>

      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        {/* Trigger is always visible - toggles the tray (hidden on mobile when open) */}
        <Trigger onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />

        {/* Container is controlled externally */}
        <Container logoUrl={logoUrl} agentName="Crayon Assistant" isOpen={isOpen}>
          <ThreadContainer>
            <Header onMinimize={() => setIsOpen(false)} />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter
              variant={variant}
              starters={[
                {
                  displayText: "Tell me about my portfolio",
                  prompt:
                    "Tell me about the latest stock market trends and how they affect my portfolio",
                  icon: <Sparkles size={16} />,
                },
                {
                  displayText:
                    "Who is the president of Venezuela and where is he currently located (icon was not passed)",
                  prompt: "Who is the president of Venezuela and where is he currently located?",
                  // icon undefined = shows default lightbulb
                },
                {
                  displayText: "Tell me about major stock (no icon empty string''",
                  prompt: "Tell me about major stock",
                  icon: "",
                },
              ]}
            />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  );
};

export const Default = {
  args: {
    defaultOpen: false,
    variant: "short",
  },
  render: (args: any) => <BottomTrayStory {...args} />,
};

export const OpenByDefault = {
  args: {
    defaultOpen: true,
    variant: "short",
  },
  render: (args: any) => <BottomTrayStory {...args} />,
};

export const LongVariant = {
  args: {
    defaultOpen: true,
    variant: "long",
  },
  render: (args: any) => <BottomTrayStory {...args} />,
};

// Example with custom trigger
const CustomTriggerStory = ({
  defaultOpen = false,
  variant = "short",
}: {
  defaultOpen?: boolean;
  variant?: "short" | "long";
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const threadListManager = useThreadListManager({
    createThread: async () => ({
      threadId: crypto.randomUUID(),
      title: "test",
      createdAt: new Date(),
      isRunning: false,
    }),
    fetchThreadList: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [
        { threadId: "1", title: "test", createdAt: new Date(), isRunning: false },
        { threadId: "2", title: "test 2", createdAt: new Date(), isRunning: false },
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
      // Return empty for new thread (null), otherwise return existing messages
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
      const newMessage = Object.assign({}, message, { id: crypto.randomUUID() }) as Message;
      threadManager.appendMessages(newMessage);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          type: "response",
          message: [{ type: "text", text: "This is a response from the assistant!" }],
        },
      ];
    },
    responseTemplates: [],
  });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Custom Trigger Example</h1>
        <p>Use a fully custom trigger with your own styling and content.</p>
      </div>

      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        {/* Custom trigger - always visible, toggles tray (hidden on mobile when open) */}
        <Trigger
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
          className={styles.customTrigger}
        >
          💬 Need Help?
        </Trigger>

        <Container logoUrl={logoUrl} agentName="Support" isOpen={isOpen}>
          <ThreadContainer>
            <Header onMinimize={() => setIsOpen(false)} />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter
              variant={variant}
              starters={[
                {
                  displayText:
                    "Help me understand what features are available and how to get started with this application",
                  prompt:
                    "Help me understand what features are available and how to get started with this application",
                  icon: <Zap size={16} />,
                },
                {
                  displayText:
                    "What can you help me with today? I need assistance with multiple tasks",
                  prompt: "What can you help me with today? I need assistance with multiple tasks",
                  icon: <MessageSquare size={16} />,
                },
                {
                  displayText: "No icon example - this is a shorter prompt",
                  prompt: "No icon example - this is a shorter prompt",
                  icon: "", // Empty string = no icon
                },
              ]}
            />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  );
};

export const CustomTrigger = {
  args: {
    defaultOpen: false,
    variant: "short",
  },
  render: (args: any) => <CustomTriggerStory {...args} />,
};

export const CustomTriggerLongVariant = {
  args: {
    defaultOpen: true,
    variant: "long",
  },
  render: (args: any) => <CustomTriggerStory {...args} />,
};

// Example with WelcomeScreen
const WelcomeScreenStory = ({
  defaultOpen = true,
  variant = "short",
}: {
  defaultOpen?: boolean;
  variant?: "short" | "long";
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
    loadThread: async () => [], // Start with empty thread to show welcome screen
    onProcessMessage: async ({ message, threadManager }) => {
      const newMessage = Object.assign({}, message, { id: crypto.randomUUID() }) as Message;
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
      <div className={styles.content}>
        <h1>Welcome Screen Example</h1>
        <p>This example shows the WelcomeScreen component with title, description, and logo.</p>
      </div>

      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Trigger onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />

        <Container logoUrl={logoUrl} agentName="Crayon Assistant" isOpen={isOpen}>
          <ThreadContainer>
            <Header onMinimize={() => setIsOpen(false)} />

            <WelcomeScreen
              title="Hi, I'm Crayon Assistant"
              description="I can help you with questions about your account, products, and more."
              logoUrl={logoUrl}
            />

            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter
              variant={variant}
              starters={[
                {
                  displayText: "Help me get started",
                  prompt: "Help me get started",
                  icon: <Sparkles size={16} />,
                },
                {
                  displayText: "What can you do?",
                  prompt: "What can you do?",
                },
              ]}
            />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  );
};

export const WithWelcomeScreen = {
  args: {
    defaultOpen: true,
    variant: "short",
  },
  render: (args: any) => <WelcomeScreenStory {...args} />,
};

export const WithWelcomeScreenLongVariant = {
  args: {
    defaultOpen: true,
    variant: "long",
  },
  render: (args: any) => <WelcomeScreenStory {...args} />,
};

// Example with custom children in WelcomeScreen
const CustomWelcomeScreenStory = ({
  defaultOpen = true,
  variant = "short",
}: {
  defaultOpen?: boolean;
  variant?: "short" | "long";
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
    loadThread: async () => [],
    onProcessMessage: async ({ message, threadManager }) => {
      const newMessage = Object.assign({}, message, { id: crypto.randomUUID() }) as Message;
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
      <div className={styles.content}>
        <h1>Custom Welcome Screen Example</h1>
        <p>This example shows WelcomeScreen with custom children instead of props.</p>
      </div>

      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Trigger onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />

        <Container logoUrl={logoUrl} agentName="Crayon Assistant" isOpen={isOpen}>
          <ThreadContainer>
            <Header onMinimize={() => setIsOpen(false)} />

            <WelcomeScreen>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Sparkles size={40} color="white" />
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600 }}>
                  Welcome to AI Assistant
                </h2>
                <p style={{ margin: 0, color: "rgba(0,0,0,0.5)", fontSize: 14 }}>
                  Your personal AI helper for all your questions
                </p>
              </div>
            </WelcomeScreen>

            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter
              variant={variant}
              starters={[
                {
                  displayText: "Help me get started",
                  prompt: "Help me get started",
                  icon: <Sparkles size={16} />,
                },
                {
                  displayText: "What can you do?",
                  prompt: "What can you do?",
                },
              ]}
            />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  );
};

export const WithCustomWelcomeScreen = {
  args: {
    defaultOpen: true,
    variant: "short",
  },
  render: (args: any) => <CustomWelcomeScreenStory {...args} />,
};
