import { Message, useThreadListManager, useThreadManager } from "@crayonai/react-core";
import { Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import logoUrl from "../../BottomTray/stories/thesysdev_logo.jpeg";
import { CrayonChat } from "../CrayonChat";
import { ConversationStartersConfig, WelcomeMessageConfig } from "../types";

export default {
  title: "Components/CrayonChat",
  tags: ["dev"],
  argTypes: {
    type: {
      control: "select",
      options: ["standalone", "copilot", "bottom-tray"],
    },
    defaultOpen: {
      control: "boolean",
      description: "Default open state for bottom-tray type",
      if: { arg: "type", eq: "bottom-tray" },
    },
  },
};

// Sample welcome message config
const SAMPLE_WELCOME_MESSAGE: WelcomeMessageConfig = {
  title: "Hi, I'm Crayon Assistant",
  description: "I can help you with questions about your account, products, and more.",
  image: { url: logoUrl },
};

// Sample conversation starters
const SAMPLE_STARTERS: ConversationStartersConfig = {
  variant: "short",
  options: [
    {
      displayText: "Help me get started",
      prompt: "Help me get started with Crayon",
      icon: <Sparkles size={16} />,
    },
    {
      displayText: "What can you do?",
      prompt: "What can you do?",
    },
    {
      displayText: "Tell me about features",
      prompt: "Tell me about your features",
      icon: <Zap size={16} />,
    },
  ],
};

// Sample long variant starters
const LONG_STARTERS: ConversationStartersConfig = {
  variant: "long",
  options: [
    {
      displayText: "Help me get started with this application and guide me through the features",
      prompt: "Help me get started",
      icon: <Sparkles size={16} />,
    },
    {
      displayText: "What can you do? I'd like to know all your capabilities",
      prompt: "What can you do?",
    },
    {
      displayText: "Tell me about your advanced features and how I can use them effectively",
      prompt: "Tell me about your features",
      icon: <Zap size={16} />,
    },
  ],
};

const CrayonChatStory = (args: any) => {
  const [isOpen, setIsOpen] = useState(args.defaultOpen ?? false);
  const threadListManager = useThreadListManager({
    createThread: async () => {
      return {
        threadId: crypto.randomUUID(),
        title: "New Chat",
        createdAt: new Date(),
        isRunning: false,
      };
    },
    fetchThreadList: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [
        { threadId: "1", title: "Previous Chat 1", createdAt: new Date(), isRunning: false },
        { threadId: "2", title: "Previous Chat 2", createdAt: new Date(), isRunning: false },
        { threadId: "3", title: "Previous Chat 3", createdAt: new Date(), isRunning: false },
      ];
    },
    deleteThread: async () => {},
    updateThread: async (t) => t,
    onSwitchToNew: () => {},
    onSelectThread: () => {},
  });

  const threadManager = useThreadManager({
    threadId: threadListManager.selectedThreadId,
    shouldResetThreadState: threadListManager.shouldResetThreadState,
    loadThread: async (threadId) => {
      // Return empty to show welcome screen and conversation starters
      if (!threadId) return [];
      return [
        { id: crypto.randomUUID(), role: "user", type: "prompt", message: "Hello" },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          type: "response",
          message: [{ type: "text", text: "Hello! How can I help you today?" }],
        },
      ];
      // return [];
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
          message: [
            {
              type: "text",
              text: `You said: "${message.message}". This is a response from the AI assistant.`,
            },
          ],
        },
      ];
    },
    responseTemplates: [],
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--crayon-bg-fill, #f5f5f5)" }}>
      {args.type === "bottom-tray" && (
        <div style={{ padding: "2rem" }}>
          <h1 style={{ marginBottom: "1rem" }}>Bottom Tray Example</h1>
          <p style={{ marginBottom: "1rem" }}>
            The chat appears as a bottom tray. Click the pill button to open/close.
          </p>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--crayon-interactive-default)",
              border: "1px solid var(--crayon-stroke-interactive-el)",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {isOpen ? "Close" : "Open"} Chat
          </button>
        </div>
      )}
      <CrayonChat
        threadListManager={threadListManager}
        threadManager={threadManager}
        type={args.type}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        defaultOpen={args.defaultOpen}
        welcomeMessage={args.welcomeMessage}
        conversationStarters={args.conversationStarters}
        logoUrl={logoUrl}
        agentName="Crayon Assistant"
      />
    </div>
  );
};

// Default standalone without welcome/starters
export const Default = {
  args: {
    type: "standalone",
  },
  render: CrayonChatStory,
};

// Standalone with welcome message and conversation starters
export const StandaloneWithWelcome = {
  args: {
    type: "standalone",
    welcomeMessage: SAMPLE_WELCOME_MESSAGE,
    conversationStarters: SAMPLE_STARTERS,
  },
  render: CrayonChatStory,
};

// Standalone with long variant starters
export const StandaloneLongStarters = {
  args: {
    type: "standalone",
    welcomeMessage: SAMPLE_WELCOME_MESSAGE,
    conversationStarters: LONG_STARTERS,
  },
  render: CrayonChatStory,
};

// Copilot type
export const Copilot = {
  args: {
    type: "copilot",
  },
  render: CrayonChatStory,
};

// Copilot with welcome message and starters
export const CopilotWithWelcome = {
  args: {
    type: "copilot",
    welcomeMessage: SAMPLE_WELCOME_MESSAGE,
    conversationStarters: SAMPLE_STARTERS,
  },
  render: CrayonChatStory,
};

// Bottom Tray type
export const BottomTray = {
  args: {
    type: "bottom-tray",
    defaultOpen: false,
  },
  render: CrayonChatStory,
};

// Bottom Tray open by default
export const BottomTrayOpen = {
  args: {
    type: "bottom-tray",
    defaultOpen: true,
  },
  render: CrayonChatStory,
};

// Bottom Tray with welcome message and starters
export const BottomTrayWithWelcome = {
  args: {
    type: "bottom-tray",
    defaultOpen: true,
    welcomeMessage: SAMPLE_WELCOME_MESSAGE,
    conversationStarters: SAMPLE_STARTERS,
  },
  render: CrayonChatStory,
};

// Bottom Tray with long variant starters
export const BottomTrayLongStarters = {
  args: {
    type: "bottom-tray",
    defaultOpen: true,
    welcomeMessage: SAMPLE_WELCOME_MESSAGE,
    conversationStarters: LONG_STARTERS,
  },
  render: CrayonChatStory,
};
