# Crayon SDK Usage Examples

## 1. Minimal Setup (Ephemeral Chat)

The simplest possible setup using Crayon's default AG-UI protocol. No thread persistence is configured, so refreshing the page starts a new conversation.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    // Simple endpoint that accepts { messages } and returns a stream
    processMessage: async ({ messages, abortController }) => {
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
  });

  return <CrayonChat chat={chat} agentName="My Agent" logoUrl="/logo.png" />;
}
```

---

## 2. With Thread Management (Standard API)

If your backend follows Crayon's standard CRUD API patterns, you can simply provide `threadApiUrl`. This automatically handles `create`, `update`, `delete`, and `load` operations for threads.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    // Base URL for thread operations: /get, /create, /update, /delete
    threadApiUrl: "/api/threads",
    
    // Chat endpoint for sending messages
    apiUrl: "/api/chat",
  });

  return <CrayonChat chat={chat} type="standalone" agentName="My Agent" />;
}
```

---

## 3. With Custom Thread Management

If you have a custom backend API structure, you can provide individual handler functions instead of `threadApiUrl`.

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    fetchThreadList: () => fetch("/my-api/conversations").then((r) => r.json()),
    
    createThread: (firstMessage) =>
      fetch("/my-api/conversations", {
        method: "POST",
        body: JSON.stringify({ initial_message: firstMessage.content }),
      }).then((r) => r.json()), // Returns { threadId, title, messages, ... }
      
    deleteThread: (id) =>
      fetch(`/my-api/conversations/${id}`, { method: "DELETE" }),
      
    loadThread: (threadId) =>
      fetch(`/my-api/conversations/${threadId}/messages`).then((r) => r.json()),
      
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch(`/my-api/conversations/${threadId}/chat`, {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
  });

  return <CrayonChat chat={chat} type="standalone" agentName="Custom Backend" />;
}
```

---

## 4. OpenAI Chat Completions API Integration

Use this setup when your backend uses `openai.chat.completions.create` with `stream: true`. This setup handles:
1. Converting Crayon messages to OpenAI format (including multipart content and tool calls).
2. Parsing the OpenAI stream chunks back into Crayon events.

```tsx
import { 
  useChat, 
  openAIAdapter, 
  openAIMessageFormat 
} from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    apiUrl: "/api/chat", // Endpoint calling openai.chat.completions.create
    
    // Adapter for parsing OpenAI stream chunks
    streamProtocol: openAIAdapter(),
    
    // Format converter for outgoing messages (Crayon -> OpenAI)
    messageFormat: openAIMessageFormat,
  });

  return <CrayonChat chat={chat} agentName="OpenAI Agent" />;
}
```

---

## 5. OpenAI Responses / Conversations API Integration

Use this setup for the newer OpenAI `responses` or `conversations` APIs (e.g., `openai.responses.create`). This API uses a different stream format and message structure (items list).

```tsx
import { 
  useChat, 
  openAIResponsesAdapter, 
  openAIConversationMessageFormat 
} from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    apiUrl: "/api/chat", // Endpoint calling openai.responses.create
    
    // Adapter for parsing OpenAI Response API events
    streamProtocol: openAIResponsesAdapter(),
    
    // Format converter for Item-based conversations
    messageFormat: openAIConversationMessageFormat,
  });

  return <CrayonChat chat={chat} agentName="Responses Agent" />;
}
```

---

## 6. Mixed Protocol (e.g., Vercel AI SDK)

You can mix and match adapters and formats. For example, if using Vercel AI SDK which expects OpenAI-formatted messages but streams text delta.

```tsx
import { useChat, openAIMessageFormat, agUIAdapter } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({
    processMessage: async ({ messages, abortController }) => {
      // openAIMessageFormat.toApi has already converted messages to OpenAI format
      return fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });
    },
    // Use OpenAI message format for sending
    messageFormat: openAIMessageFormat,
    
    // Use AG-UI adapter (or whichever matches your stream) for receiving
    streamProtocol: agUIAdapter(), 
  });

  return <CrayonChat chat={chat} agentName="Vercel Agent" />;
}
```

---

## 7. Custom UI Layouts

### Copilot / Sidebar

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";

function App() {
  const chat = useChat({ apiUrl: "/api/chat" });

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <main style={{ flex: 1 }}>{/* App Content */}</main>
      <CrayonChat
        chat={chat}
        type="copilot"
        agentName="Copilot"
        logoUrl="/copilot-logo.png"
      />
    </div>
  );
}
```

### Bottom Tray / Widget

```tsx
import { useChat } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import { useState } from "react";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const chat = useChat({ apiUrl: "/api/chat" });

  return (
    <>
      <main>{/* App Content */}</main>
      <CrayonChat
        chat={chat}
        type="bottom-tray"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        agentName="Assistant"
      />
    </>
  );
}
```

---

## 8. Fully Custom UI (Headless Mode)

If you need complete control over the layout, you can use `ChatProvider` with individual UI components instead of `CrayonChat`.

```tsx
import { useChat, ChatProvider } from "@crayonai/react-core";
import {
  Container,
  ThreadContainer,
  ScrollArea,
  Messages,
  Composer,
  MobileHeader,
} from "@crayonai/react-ui/Shell"; // Import from subpath
import { ThemeProvider } from "@crayonai/react-ui/ThemeProvider";

function App() {
  const chat = useChat({ apiUrl: "/api/chat" });

  return (
    <ThemeProvider mode="dark">
      <ChatProvider
        threadListManager={chat.threadListManager}
        threadManager={chat.threadManager}
      >
        <Container logoUrl="/logo.png" agentName="Custom Agent">
          <div className="my-custom-sidebar">
            {/* Custom Sidebar Content */}
          </div>
          
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              {/* You can pass custom renderers to Messages too */}
              <Messages />
            </ScrollArea>
            <Composer placeholder="Ask something..." />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </ThemeProvider>
  );
}
```
