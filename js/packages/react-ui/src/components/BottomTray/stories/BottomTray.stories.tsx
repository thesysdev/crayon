import {
  ChatProvider,
  Message,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
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
  },
};

const BottomTrayStory = ({ defaultOpen = false }: { defaultOpen?: boolean }) => {
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
              starters={[
                { displayText: "Help me get started", prompt: "Help me get started" },
                { displayText: "What can you do?", prompt: "What can you do?" },
                {
                  displayText: "Tell me about your features",
                  prompt: "Tell me about your features",
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
  },
  render: (args: any) => <BottomTrayStory {...args} />,
};

export const OpenByDefault = {
  args: {
    defaultOpen: true,
  },
  render: (args: any) => <BottomTrayStory {...args} />,
};

// Example with custom trigger
const CustomTriggerStory = ({ defaultOpen = false }: { defaultOpen?: boolean }) => {
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
              starters={[
                { displayText: "Help me get started", prompt: "Help me get started" },
                { displayText: "What can you do?", prompt: "What can you do?" },
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
  },
  render: (args: any) => <CustomTriggerStory {...args} />,
};
