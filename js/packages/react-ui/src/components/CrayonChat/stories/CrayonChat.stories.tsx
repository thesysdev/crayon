import { Message, useThreadListManager, useThreadManager } from "@crayonai/react-core";
import { useState } from "react";
import { CrayonChat } from "../CrayonChat";

export default {
  title: "Components/CrayonChat",
  tags: ["dev", "!autodocs"],
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

const CrayonChatStory = (args: any) => {
  const [isOpen, setIsOpen] = useState(args.defaultOpen ?? false);
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
    loadThread: async () => {
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
          message: [{ type: "text", text: "Hello" }],
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
          message: [{ type: "text", text: "sadfasdf" }],
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
      />
    </div>
  );
};

export const Default = {
  args: {
    type: "standalone",
  },
  render: CrayonChatStory,
};

export const BottomTray = {
  args: {
    type: "bottom-tray",
    defaultOpen: false,
  },
  render: CrayonChatStory,
};

export const BottomTrayOpen = {
  args: {
    type: "bottom-tray",
    defaultOpen: true,
  },
  render: CrayonChatStory,
};
