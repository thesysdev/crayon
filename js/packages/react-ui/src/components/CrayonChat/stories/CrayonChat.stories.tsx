import { Message, useThreadListManager, useThreadManager } from "@crayonai/react-core";
import { CrayonChat } from "../CrayonChat";

export default {
  title: "Components/CrayonChat",
  tags: ["dev", "!autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["standalone", "copilot"],
    },
  },
};

export const Default = {
  args: {
    type: "standalone",
  },
  render: (args: any) => {
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
      <CrayonChat
        threadListManager={threadListManager}
        threadManager={threadManager}
        type={args.type}
      />
    );
  },
};
