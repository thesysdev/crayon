import {
  ArtifactRenderer,
  ChatProvider,
  Message,
  useArtifactState,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import { Code, MessageSquare, Paperclip, Share, Sparkles, X, Zap } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { Container } from "../Container";
import { ConversationStarter } from "../ConversationStarter";
import { MobileHeader } from "../MobileHeader";
import { NewChatButton } from "../NewChatButton";
import { SidebarContainer, SidebarContent, SidebarHeader, SidebarSeparator } from "../Sidebar";
import {
  Composer,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  ThreadHeader,
} from "../Thread";
import { ThreadList } from "../ThreadList";
import { WelcomeScreen } from "../WelcomeScreen";
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
    icon: <></>, // Empty fragment = no icon
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
            <SidebarHeader>
              <NewChatButton />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader
              rightChildren={
                <IconButton
                  icon={<Share size={16} />}
                  aria-label="Share"
                  size="medium"
                  variant="secondary"
                />
              }
            />
            <ThreadHeader>
              <Button iconLeft={<Share size={16} />} variant="secondary" size="small">
                Share
              </Button>
            </ThreadHeader>
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer
              attachment={
                <IconButton
                  icon={<Paperclip size="1em" />}
                  onClick={() => console.log("attach")}
                  size="medium"
                  variant="tertiary"
                />
              }
            />
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
            <SidebarHeader>
              <NewChatButton />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader
              rightChildren={
                <IconButton icon={<Share size={16} />} aria-label="Share" size="small" />
              }
            />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer
              attachment={
                <IconButton
                  icon={<Paperclip size="1em" />}
                  onClick={() => console.log("attach")}
                  size="medium"
                  variant="tertiary"
                />
              }
            />
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
            <SidebarHeader>
              <NewChatButton />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader
              rightChildren={
                <IconButton icon={<Share size={16} />} aria-label="Share" size="small" />
              }
            />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={LONG_STARTERS} variant={variant} />
            <Composer
              attachment={
                <IconButton
                  icon={<Paperclip size="1em" />}
                  onClick={() => console.log("attach")}
                  size="medium"
                  variant="tertiary"
                />
              }
            />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};

// WelcomeScreen with props-based content
export const WithWelcomeScreen = {
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
      loadThread: async () => [], // Start with empty thread to show welcome screen
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

    const hasMessages = threadManager.messages.length > 0;

    return (
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon Assistant">
          <SidebarContainer>
            <SidebarHeader>
              <NewChatButton />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader
              rightChildren={
                <IconButton icon={<Share size={16} />} aria-label="Share" size="small" />
              }
            />

            {!hasMessages && (
              <WelcomeScreen
                title="Hi, I'm Crayon Assistant"
                description="I can help you with questions about your account, products, and more."
                image={{ url: logoUrl }}
                starters={SAMPLE_STARTERS}
                starterVariant={variant}
              />
            )}

            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer
              attachment={
                <IconButton
                  icon={<Paperclip size="1em" />}
                  onClick={() => console.log("attach")}
                  size="medium"
                  variant="tertiary"
                />
              }
            />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};

// --- Artifact Demo Components ---

const SAMPLE_CODE = `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}`;

const CodeArtifactPanel = ({
  code,
  language,
  onClose,
  renderInsideHTMLNode,
}: {
  code: string;
  language: string;
  onClose: () => void;
  renderInsideHTMLNode: HTMLElement | null;
}) => {
  if (!renderInsideHTMLNode) return null;

  return createPortal(
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--crayon-bg-container, #fff)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--crayon-stroke-default, #e5e5e5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Code size={16} />
          <span style={{ fontWeight: 600 }}>{language}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 4,
            display: "flex",
          }}
        >
          <X size={16} />
        </button>
      </div>
      <pre
        style={{
          flex: 1,
          margin: 0,
          padding: 16,
          overflow: "auto",
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: "monospace",
          background: "var(--crayon-bg-sunk, #f5f5f5)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>,
    renderInsideHTMLNode,
  );
};

const CodeArtifact = ({ code, language, artifactId }: { code: string; language: string; artifactId: string }) => {
  const { openArtifact, closeArtifact, isArtifactActive } = useArtifactState({ artifactId });

  return (
    <div>
      <div
        style={{
          border: "1px solid var(--crayon-stroke-default, #e5e5e5)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "var(--crayon-bg-sunk, #f5f5f5)",
            borderBottom: "1px solid var(--crayon-stroke-default, #e5e5e5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Code size={14} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{language}</span>
          </div>
          <button
            onClick={isArtifactActive ? closeArtifact : openArtifact}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 4,
              border: "1px solid var(--crayon-stroke-default, #e5e5e5)",
              background: isArtifactActive ? "var(--crayon-interactive-accent, #333)" : "var(--crayon-bg-container, #fff)",
              color: isArtifactActive ? "var(--crayon-accent-primary-text, #fff)" : "inherit",
              cursor: "pointer",
            }}
          >
            {isArtifactActive ? "Close" : "Open"}
          </button>
        </div>
        <pre
          style={{
            margin: 0,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: "monospace",
            maxHeight: 120,
            overflow: "hidden",
          }}
        >
          <code>{code.slice(0, 200)}...</code>
        </pre>
      </div>

      <ArtifactRenderer
        artifactId={artifactId}
        Component={CodeArtifactPanel}
        code={code}
        language={language}
        onClose={closeArtifact}
      />
    </div>
  );
};

const SAMPLE_CODE_2 = `export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 1000,
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
      return response;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error("Unreachable");
}`;

const THREAD_MESSAGES: Record<string, Message[]> = {
  "thread-1": [
    { id: "t1-u1", role: "user", type: "prompt", message: "Write me a debounce hook" },
    {
      id: "t1-a1",
      role: "assistant",
      message: [
        { type: "text", text: "Here's a reusable debounce hook:" },
        {
          type: "template",
          name: "code_artifact",
          templateProps: { code: SAMPLE_CODE, language: "TypeScript", artifactId: "artifact-debounce" },
        },
        { type: "text", text: "Use it like `const debouncedSearch = useDebounce(searchTerm, 300)`." },
      ],
    },
  ],
  "thread-2": [
    { id: "t2-u1", role: "user", type: "prompt", message: "Show me a fetch with retry" },
    {
      id: "t2-a1",
      role: "assistant",
      message: [
        { type: "text", text: "Here's a fetch wrapper with exponential backoff retry:" },
        {
          type: "template",
          name: "code_artifact",
          templateProps: { code: SAMPLE_CODE_2, language: "TypeScript", artifactId: "artifact-fetch-retry" },
        },
      ],
    },
  ],
  "thread-3": [
    { id: "t3-u1", role: "user", type: "prompt", message: "Hello!" },
    {
      id: "t3-a1",
      role: "assistant",
      message: [{ type: "text", text: "Hi there! Ask me to write some code and I'll show it as an artifact." }],
    },
  ],
};

// Shell with artifact demo (multiple threads to test thread switching)
export const WithArtifact = {
  render: () => {
    const threadListManager = useThreadListManager({
      createThread: async () => ({
        threadId: crypto.randomUUID(),
        title: "New Chat",
        createdAt: new Date(),
        isRunning: false,
      }),
      fetchThreadList: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return [
          { threadId: "thread-1", title: "Debounce Hook", createdAt: new Date("2025-01-03"), isRunning: false },
          { threadId: "thread-2", title: "Fetch with Retry", createdAt: new Date("2025-01-02"), isRunning: false },
          { threadId: "thread-3", title: "General Chat (no artifact)", createdAt: new Date("2025-01-01"), isRunning: false },
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
        await new Promise((resolve) => setTimeout(resolve, 200));
        return THREAD_MESSAGES[threadId] ?? [];
      },
      onProcessMessage: async ({ message, threadManager }) => {
        const newMessage = { ...message, id: crypto.randomUUID() } as Message;
        threadManager.appendMessages(newMessage);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            message: [
              { type: "text", text: "Here's a custom React hook for debouncing values:" },
              {
                type: "template",
                name: "code_artifact",
                templateProps: {
                  code: SAMPLE_CODE,
                  language: "TypeScript",
                  artifactId: "artifact-" + crypto.randomUUID(),
                },
              },
              { type: "text", text: "You can use this hook to debounce any value in your components." },
            ],
          },
        ];
      },
      responseTemplates: [{ name: "code_artifact", Component: CodeArtifact }],
    });

    return (
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon">
          <SidebarContainer>
            <SidebarHeader>
              <NewChatButton />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};

// WelcomeScreen with custom children
export const WithCustomWelcomeScreen = {
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
      loadThread: async () => [],
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

    const hasMessages = threadManager.messages.length > 0;

    return (
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon Assistant">
          <SidebarContainer>
            <SidebarHeader>
              <NewChatButton />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader
              rightChildren={
                <IconButton icon={<Share size={16} />} aria-label="Share" size="small" />
              }
            />

            {!hasMessages && (
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
                  <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
                    Welcome to AI Assistant
                  </h2>
                  <p style={{ margin: 0, color: "rgba(0,0,0,0.5)", fontSize: 16 }}>
                    Your personal AI helper for all your questions
                  </p>
                </div>
              </WelcomeScreen>
            )}

            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer
              attachment={
                <IconButton
                  icon={<Paperclip size="1em" />}
                  onClick={() => console.log("attach")}
                  size="medium"
                  variant="tertiary"
                />
              }
            />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};
