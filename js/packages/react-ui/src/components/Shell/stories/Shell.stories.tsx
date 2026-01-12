import {
  ChatProvider,
  Message,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import { MessageSquare, Sparkles, Zap } from "lucide-react";
import { Container } from "../Container";
import { ConversationStarter } from "../ConversationStarter";
import { MobileHeader } from "../MobileHeader";
import { NewChatButton } from "../NewChatButton";
import { SidebarContainer, SidebarContent, SidebarHeader, SidebarSeparator } from "../Sidebar";
import { Composer, MessageLoading, Messages, ScrollArea, ThreadContainer } from "../Thread";
import { ThreadList } from "../ThreadList";
import logoUrl from "./thesysdev_logo.jpeg";

export default {
  title: "Components/Shell",
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
    displayText: "Help me get started",
    prompt: "Help me get started",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do?",
    prompt: "What can you do?",
    // icon undefined = shows default lightbulb
  },
  {
    displayText: "Tell me about your features",
    prompt: "Tell me about your features",
    icon: <MessageSquare size={16} />,
  },
  {
    displayText: "Show me some examples (no icon)",
    prompt: "Show me some examples",
    icon: "", // Empty string = no icon
  },
];

const LONG_STARTERS = [
  {
    displayText: "Help me get started with this application and guide me through the features",
    prompt: "Help me get started with this application",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do? I'd like to know all your capabilities and how you can help me",
    prompt: "What can you do?",
    icon: <Zap size={16} />,
  },
  {
    displayText: "Tell me about your advanced features and how I can use them effectively",
    prompt: "Tell me about your features",
    // Default lightbulb icon
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
        const newMessage = { ...message, id: crypto.randomUUID() } as Message;
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
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon">
          <SidebarContainer>
            <SidebarHeader />
            <SidebarContent>
              <NewChatButton />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};

export const WithConversationStarter = {
  args: {
    variant: "short",
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
        const newMessage = { ...message, id: crypto.randomUUID() } as Message;
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
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon">
          <SidebarContainer>
            <SidebarHeader />
            <SidebarContent>
              <NewChatButton />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
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
        const newMessage = { ...message, id: crypto.randomUUID() } as Message;
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
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon">
          <SidebarContainer>
            <SidebarHeader />
            <SidebarContent>
              <NewChatButton />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={LONG_STARTERS} variant={variant} />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};
