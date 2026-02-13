# Crayon SDK Usage Examples

## Minimal

The simplest possible setup. In-memory threads, Crayon SSE protocol, no persistence.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
  });

  return <CrayonChat chat={chat} agentName="My Agent" logoUrl="/logo.png" />;
}
```

---

## With Backend Persistence

Persist threads and messages to your own backend.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    fetchThreadList: () => fetch("/api/threads").then((r) => r.json()),
    createThread: (msg) =>
      fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ title: msg.content }),
      }).then((r) => r.json()),
    deleteThread: (id) =>
      fetch(`/api/threads/${id}`, { method: "DELETE" }).then(() => {}),
    updateThread: (thread) =>
      fetch(`/api/threads/${thread.threadId}`, {
        method: "PATCH",
        body: JSON.stringify(thread),
      }).then((r) => r.json()),
    loadThread: (threadId) =>
      fetch(`/api/threads/${threadId}/messages`).then((r) => r.json()),
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
  });

  return <CrayonChat chat={chat} type="standalone" agentName="My Agent" />;
}
```

---

## With AG-UI Protocol

Connect to any [AG-UI](https://docs.ag-ui.com) compatible backend. Supports tool calls, reasoning, and activity messages out of the box.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { agUIAdapter } from "@crayonai/stream/adapters/ag-ui";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/agent", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
    streamProtocol: agUIAdapter(),
  });

  return <CrayonChat chat={chat} agentName="AG-UI Agent" />;
}
```

---

## With Vercel AI SDK Protocol

Connect to a backend built with the [Vercel AI SDK](https://sdk.vercel.ai).

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { vercelAIAdapter } from "@crayonai/stream/adapters/vercel";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
    streamProtocol: vercelAIAdapter(),
  });

  return <CrayonChat chat={chat} agentName="Vercel Bot" />;
}
```

---

## With Plain Text SSE

For the simplest possible backend that just streams text chunks.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { plainTextSSEAdapter } from "@crayonai/stream/adapters/plain-text";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
    streamProtocol: plainTextSSEAdapter(),
  });

  return <CrayonChat chat={chat} agentName="Simple Bot" />;
}
```

---

## With OpenAI Message Format Converter

When your backend expects messages in OpenAI's `{role, content}` format instead of Crayon's native format.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { openAIMessageConverter } from "@crayonai/stream/converters/openai";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      // `messages` are already converted to OpenAI format by the converter
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
    messageConverter: openAIMessageConverter(),
  });

  return <CrayonChat chat={chat} agentName="OpenAI Agent" />;
}
```

---

## Protocol + Format Converter Combined

Mix and match: Vercel AI backend that expects OpenAI-formatted messages.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { vercelAIAdapter } from "@crayonai/stream/adapters/vercel";
import { openAIMessageConverter } from "@crayonai/stream/converters/openai";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
    streamProtocol: vercelAIAdapter(),
    messageConverter: openAIMessageConverter(),
  });

  return <CrayonChat chat={chat} agentName="My Agent" />;
}
```

---

## Copilot Layout

Side-panel chat, useful for embedding alongside your main app content.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
  });

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <main style={{ flex: 1 }}>{/* Your app content */}</main>
      <CrayonChat
        chat={chat}
        type="copilot"
        agentName="Copilot"
        logoUrl="/copilot.png"
      />
    </div>
  );
}
```

---

## Bottom Tray Layout

Floating chat panel in the bottom-right corner.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { useState } from "react";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  const chat = useChat({
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
  });

  return (
    <>
      <main>{/* Your app content */}</main>
      <CrayonChat
        chat={chat}
        type="bottom-tray"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        agentName="Help"
      />
    </>
  );
}
```

---

## Escape Hatch: Lower-Level Hooks

For full control over thread and thread list management. Use `useThreadManager` and `useThreadListManager` directly.

```tsx
import { useThreadManager, useThreadListManager } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const threadListManager = useThreadListManager({
    fetchThreadList: () => fetch("/api/threads").then((r) => r.json()),
    createThread: (msg) =>
      fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ title: msg.content }),
      }).then((r) => r.json()),
    deleteThread: (id) =>
      fetch(`/api/threads/${id}`, { method: "DELETE" }).then(() => {}),
    updateThread: (thread) =>
      fetch(`/api/threads/${thread.threadId}`, {
        method: "PATCH",
        body: JSON.stringify(thread),
      }).then((r) => r.json()),
    onSwitchToNew: () => {},
    onSelectThread: () => {},
  });

  const threadManager = useThreadManager({
    threadId: threadListManager.selectedThreadId,
    shouldResetThreadState: threadListManager.shouldResetThreadState,
    loadThread: (threadId) =>
      fetch(`/api/threads/${threadId}/messages`).then((r) => r.json()),
    onProcessMessage: async ({ message, threadManager, abortController }) => {
      // Full control over message processing
      threadManager.appendMessages({
        id: crypto.randomUUID(),
        ...message,
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
        signal: abortController.signal,
      });

      // Handle the stream yourself
      // ...

      return [];
    },
  });

  return (
    <CrayonChat
      chat={{ threadManager, threadListManager }}
      type="standalone"
      agentName="Custom Agent"
    />
  );
}
```

---

## Fully Custom UI with ChatProvider

Skip `CrayonChat` entirely and compose individual Crayon components with your own.

```tsx
import { useChat, ChatProvider } from "@crayonai/react-core";
import {
  Container,
  ThreadContainer,
  ScrollArea,
  Messages,
  Composer,
  MobileHeader,
} from "@crayonai/react-ui/Shell";
import { ThemeProvider } from "@crayonai/react-ui/ThemeProvider";
import { CustomSidebar } from "./CustomSidebar";

function App() {
  const chat = useChat({
    fetchThreadList: () => fetch("/api/threads").then((r) => r.json()),
    createThread: (msg) =>
      fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ title: msg.content }),
      }).then((r) => r.json()),
    deleteThread: (id) =>
      fetch(`/api/threads/${id}`, { method: "DELETE" }).then(() => {}),
    loadThread: (id) =>
      fetch(`/api/threads/${id}/messages`).then((r) => r.json()),
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
  });

  return (
    <ThemeProvider mode="dark">
      <ChatProvider
        threadListManager={chat.threadListManager}
        threadManager={chat.threadManager}
      >
        <Container logoUrl="/logo.png" agentName="Custom Agent">
          <CustomSidebar />
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages />
            </ScrollArea>
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </ThemeProvider>
  );
}
```
