# Crayon SDK Improvements

## Overview

This document captures the planned improvements to the Crayon SDK, covering four key areas:

1. [Unified `useChat` Hook](#1-unified-usechat-hook)
2. [Protocol & Message Format Abstraction](#2-protocol--message-format-abstraction)
3. [New Message Format (AG-UI Aligned)](#3-new-message-format-ag-ui-aligned)
4. [`CrayonChat` Props Cleanup](#4-crayonchat-props-cleanup)

> These are breaking changes. No backward compatibility is required.

---

## 1. Unified `useChat` Hook

### Problem

Today developers must use two separate hooks (`useThreadManager` and `useThreadListManager`) that are tightly coupled in practice:

- `useThreadManager` requires `threadId` and `shouldResetThreadState` from `useThreadListManager`
- `onProcessMessage` inside `useThreadManager` typically calls `threadListManager.createThread()` and `threadListManager.selectThread()`
- `processStreamedMessage` must be called manually to handle the streamed response
- This results in ~40 lines of boilerplate wiring for the common case

```tsx
// Current: too much glue code
const threadListManager = useThreadListManager({
  fetchThreadList: ...,
  createThread: ...,
  deleteThread: ...,
  updateThread: ...,
  onSwitchToNew: () => {},
  onSelectThread: () => {},
});

const threadManager = useThreadManager({
  threadId: threadListManager.selectedThreadId,           // manual wiring
  shouldResetThreadState: threadListManager.shouldResetThreadState, // manual wiring
  loadThread: ...,
  onProcessMessage: async ({ message, threadManager, abortController }) => {
    threadManager.appendMessages({ id: crypto.randomUUID(), ...message });

    let threadId = threadListManager.selectedThreadId;
    if (!threadId) {
      const thread = await threadListManager.createThread(message); // manual wiring
      threadListManager.selectThread(thread.threadId, false);       // manual wiring
      threadId = thread.threadId;
    }

    const response = await fetch("/api/chat", { ... });
    await processStreamedMessage({                                  // manual call
      response,
      createMessage: threadManager.appendMessages,
      updateMessage: threadManager.updateMessage,
      deleteMessage: threadManager.deleteMessage,
    });
    return [];
  },
});
```

### Solution

A single `useChat` hook that:

- Composes `useThreadManager` + `useThreadListManager` internally
- Handles the wiring between thread selection and thread loading
- Auto-creates threads on first message
- Calls `processStreamedMessage` internally (user just returns a `Response`)
- Returns a single `ChatManager` object

```tsx
// Proposed: minimal boilerplate
const chat = useChat({
  processMessage: async ({ threadId, messages, abortController }) => {
    return fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ threadId, messages }),
      signal: abortController.signal,
    });
  },
});
```

### `useChat` Full API

```typescript
type UseChatParams = {
  // ─── Thread list persistence (all optional — defaults to in-memory) ───
  fetchThreadList?: () => Promise<Thread[]>;
  createThread?: (firstMessage: UserMessage) => Promise<Thread>;
  deleteThread?: (id: string) => Promise<void>;
  updateThread?: (updated: Thread) => Promise<Thread>;

  // ─── Thread/message handling ───
  loadThread?: (threadId: string) => Promise<Message[]>;
  processMessage: (params: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }) => Promise<Response>;
  onUpdateMessage?: (props: { message: Message }) => void;

  // ─── Protocol (see section 2) ───
  streamProtocol?: StreamProtocolAdapter;
  messageConverter?: MessageFormatConverter;
};

// Returns ChatManager (threadManager + threadListManager combined)
const chat: ChatManager = useChat(params);
```

### Escape Hatch

The lower-level `useThreadManager` and `useThreadListManager` hooks remain public API for advanced use cases that need full control (e.g., custom sidebar managing thread list independently).

---

## 2. Protocol & Message Format Abstraction

### Problem

The streaming protocol and message format are hardcoded:

- `processStreamedMessage` in `react-core` hardcodes Crayon's custom SSE parsing with specific event types (`text`, `context_append`, etc.)
- `toOpenAIMessages` / `toAnthropicAIMessages` are server-side utilities with `any` types and no formal interface
- No way to plug in a different wire protocol or message format

### Solution

Two pluggable layers, both frontend-only (no backend utilities):

### Layer 1: `StreamProtocolAdapter`

Converts whatever the server sends into a standard stream of Crayon internal events.

```typescript
type CrayonStreamEvent =
  | { type: "text-delta"; text: string }
  | { type: "context-append"; context: JSONValue }
  | { type: "message-update"; id: string }
  | { type: "tool-call-start"; toolCallId: string; toolCallName: string }
  | { type: "tool-call-args"; toolCallId: string; delta: string }
  | { type: "tool-call-end"; toolCallId: string }
  | { type: "reasoning-start"; messageId: string }
  | { type: "reasoning-delta"; text: string }
  | { type: "reasoning-end"; messageId: string }
  | {
      type: "activity-snapshot";
      activityType: string;
      content: Record<string, any>;
    }
  | {
      type: "activity-delta";
      activityType: string;
      content: Record<string, any>;
    }
  | { type: "messages-snapshot"; messages: Message[] }
  | { type: "status-update"; status: string }
  | { type: "error"; error: string };

interface StreamProtocolAdapter {
  parse(response: Response): AsyncIterable<CrayonStreamEvent>;
}
```

#### Bundled Adapters

| Adapter               | Description                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `crayonSSEAdapter`    | **(default)** Parses Crayon's custom SSE format. Supports context, message updates natively.                   |
| `agUIAdapter`         | Parses [AG-UI protocol](https://docs.ag-ui.com/concepts/messages) events. Covers tools, reasoning, activities. |
| `plainTextSSEAdapter` | For backends that stream plain text chunks via SSE. Simplest possible integration.                             |
| `vercelAIAdapter`     | Parses Vercel AI SDK's data stream protocol. Works with any Next.js + Vercel AI backend.                       |

#### Usage

```typescript
import { vercelAIAdapter } from "@crayonai/stream/adapters/vercel";

const chat = useChat({
  processMessage: ...,
  streamProtocol: vercelAIAdapter(), // defaults to crayonSSEAdapter()
});
```

### Layer 2: `MessageFormatConverter`

Handles outbound conversion (messages sent to backend) and inbound conversion (messages loaded from backend).

```typescript
interface MessageFormatConverter<ExternalMessage = any> {
  toExternal(messages: Message[]): ExternalMessage[];
  fromExternal(messages: ExternalMessage[]): Message[];
}
```

#### Bundled Converters

| Converter                | Description                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `identityConverter`      | **(default)** No conversion — messages are already in Crayon format.                                               |
| `openAIMessageConverter` | Converts to/from OpenAI's `{role, content}` format. Works with OpenAI-compatible APIs (LiteLLM, OpenRouter, etc.). |

#### Usage

```typescript
import { openAIMessageConverter } from "@crayonai/stream/converters/openai";

const chat = useChat({
  processMessage: ...,
  messageConverter: openAIMessageConverter(),
});
```

### Package Structure

```
@crayonai/stream                          # core types + crayonSSEAdapter (default)
@crayonai/stream/adapters/ag-ui           # AG-UI protocol adapter
@crayonai/stream/adapters/vercel          # Vercel AI data stream adapter
@crayonai/stream/adapters/plain-text      # Plain text SSE adapter
@crayonai/stream/converters/openai        # OpenAI message format converter
```

---

## 3. New Message Format (AG-UI Aligned)

### Problem

The current message format only supports two roles (`user`, `assistant`) with a Crayon-specific structure. It cannot represent:

- System messages
- Tool calls and tool results
- Reasoning/thinking (for models like Claude, o-series, DeepSeek R1)
- Activity messages (frontend-only UI elements like progress indicators)
- Multimodal input (images, files)
- Human-in-the-loop status

### Solution

A new message format that is a **superset of [AG-UI](https://docs.ag-ui.com/concepts/messages)** — supports everything AG-UI has, plus Crayon-specific features (context metadata, visual hidden messages).

### Message Types

#### Base

```typescript
type BaseMessage = {
  id: string;
  role: string;
  name?: string;
  isVisuallyHidden?: boolean; // Crayon-specific: hidden from UI but sent to LLM
};
```

#### User Message

```typescript
type UserMessage = BaseMessage & {
  role: "user";
  content: string | InputContent[];
  context?: JSONValue[];
};

type InputContent =
  | { type: "text"; text: string }
  | {
      type: "binary";
      mimeType: string;
      url?: string;
      data?: string;
      filename?: string;
    };
```

- `content` is `string` for the simple/common case, `InputContent[]` for multimodal
- `context` is Crayon-specific metadata attached to the message

#### Assistant Message

```typescript
type AssistantMessage = BaseMessage & {
  role: "assistant";
  content?: string;
  toolCalls?: ToolCall[];
  status?: "streaming" | "complete" | "awaiting_input";
  context?: JSONValue[];
};
```

- `content` is a plain string (aligned with AG-UI)
- `toolCalls` enables tool use (following the AG-UI model)
- `status` enables human-in-the-loop: `"awaiting_input"` means the agent is paused waiting for user confirmation/input

#### System Message

```typescript
type SystemMessage = BaseMessage & {
  role: "system";
  content: string;
};
```

#### Tool Call & Tool Message

```typescript
type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON-encoded
  };
};

type ToolMessage = BaseMessage & {
  role: "tool";
  content: string;
  toolCallId: string; // references the ToolCall.id
  error?: string;
};
```

- Tool calls are embedded in `AssistantMessage.toolCalls`
- Tool results are separate `ToolMessage` entries in the conversation
- This creates a clear chain: assistant requests tool → tool executes → result returned

#### Reasoning Message

```typescript
type ReasoningMessage = BaseMessage & {
  role: "reasoning";
  content: string;
  isThinking?: boolean; // true while reasoning is still streaming
};
```

- Modeled as a separate message (not a content block in assistant), following AG-UI's pattern
- Keeps reasoning separate from final responses — doesn't pollute conversation history
- Maps directly to Anthropic's `thinking` blocks and OpenAI's reasoning tokens
- `isThinking` (Crayon-specific) lets the UI show a live thinking indicator while streaming

#### Activity Message

```typescript
type ActivityMessage = BaseMessage & {
  role: "activity";
  activityType: string; // e.g. "PLAN", "SEARCH", "PROGRESS"
  content: Record<string, any>; // structured payload for custom UI rendering
};
```

- Frontend-only: never sent to the LLM
- Used for progress indicators, step trackers, search-in-progress UI, etc.
- Streamable: can be updated over time via `activity_snapshot` / `activity_delta` events
- Developers define custom `activityType` values and render matching UI components

#### Union Type

```typescript
type Message =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ToolMessage
  | ReasoningMessage
  | ActivityMessage;
```

### Crayon SSE Event Types (Updated)

```typescript
export enum SSEType {
  // ─── Existing ───
  TextDelta = "text",
  ContextAppend = "context_append",
  MessageUpdate = "message_update",
  Error = "error",

  // ─── New: Tool Calls ───
  ToolCallStart = "tool_call_start",
  ToolCallArgs = "tool_call_args",
  ToolCallEnd = "tool_call_end",

  // ─── New: Reasoning ───
  ReasoningStart = "reasoning_start",
  ReasoningDelta = "reasoning",
  ReasoningEnd = "reasoning_end",

  // ─── New: Activities ───
  ActivitySnapshot = "activity_snapshot",
  ActivityDelta = "activity_delta",

  // ─── New: Sync ───
  MessagesSnapshot = "messages_snapshot",

  // ─── New: Status ───
  StatusUpdate = "status",
}
```

### AG-UI Mapping

The format is designed so the AG-UI converter is near-trivial:

| Crayon             | AG-UI              | Notes                                                                                  |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------- |
| `UserMessage`      | `UserMessage`      | Direct. `content: string` maps 1:1. `InputContent[]` maps to AG-UI's `InputContent[]`. |
| `AssistantMessage` | `AssistantMessage` | Direct. `content: string` maps 1:1. `toolCalls` maps 1:1.                              |
| `SystemMessage`    | `SystemMessage`    | Direct 1:1 mapping.                                                                    |
| `ToolMessage`      | `ToolMessage`      | Direct 1:1 mapping.                                                                    |
| `ReasoningMessage` | `ReasoningMessage` | Direct. `isThinking` is Crayon-specific (dropped).                                     |
| `ActivityMessage`  | `ActivityMessage`  | Direct 1:1 mapping.                                                                    |
| `isVisuallyHidden` | —                  | Crayon-specific, dropped.                                                              |
| `context`          | —                  | Crayon-specific, dropped.                                                              |

### Human-in-the-Loop via Status

HITL is accomplished via the `status` field on `AssistantMessage`:

- **`status: "awaiting_input"`** — signals the conversation is blocked, waiting for user confirmation/input

When `status === "awaiting_input"`:

- The composer is disabled (or shows a specialized input)
- A visual indicator shows the agent is waiting
- The user can approve/reject/respond to unblock the agent

---

## 4. `CrayonChat` Props Cleanup

### Problem

`CrayonChat` currently accepts a mix of state management config and UI props:

- `processMessage`, `onUpdateMessage`, `processStreamedMessage`, `createThread` — all state management concerns
- `threadManager`, `threadListManager` — escape hatch that coexists awkwardly with the above
- `logoUrl`, `agentName`, `theme`, `scrollVariant`, etc. — actual UI props
- The component internally creates default hook instances when managers aren't provided, making it both a hook orchestrator and a UI renderer

### Solution

`CrayonChat` becomes a **pure UI component**. It accepts exactly two categories of props:

1. **`chat`** — the return value of `useChat()` (a `ChatManager`)
2. **UI props** — purely visual/behavioral configuration

```typescript
type CrayonChatProps = {
  // ─── Chat state (from useChat) ──────────────────────
  chat: ChatManager;

  // ─── Layout ─────────────────────────────────────────
  type?: "standalone" | "copilot" | "bottom-tray";

  // ─── Appearance ─────────────────────────────────────
  theme?: ThemeProps;
  logoUrl?: string;
  agentName?: string;
  disableThemeProvider?: boolean;

  // ─── Behavior ───────────────────────────────────────
  scrollVariant?: ScrollVariant;
  messageLoadingComponent?: () => React.ReactNode;

  // ─── Artifact ───────────────────────────────────────
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;

  // ─── Welcome experience ─────────────────────────────
  welcomeMessage?: WelcomeMessageConfig;
  conversationStarters?: ConversationStartersConfig;

  // ─── Bottom-tray specific ───────────────────────────
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};
```

### What `CrayonChat` No Longer Does

- ❌ No more `processMessage`, `createThread`, `onUpdateMessage`, `processStreamedMessage` as props
- ❌ No more creating default `useThreadListManager` / `useThreadManager` internally
- ❌ No more conditional logic choosing between user-provided managers and internal defaults

### Usage Examples

#### Simple

```tsx
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

#### With Backend Persistence + Custom Protocol

```tsx
function App() {
  const chat = useChat({
    fetchThreadList: () => fetch("/api/threads").then((r) => r.json()),
    createThread: (msg) =>
      fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ title: msg.content }),
      }).then((r) => r.json()),
    deleteThread: (id) => fetch(`/api/threads/${id}`, { method: "DELETE" }),
    loadThread: (id) =>
      fetch(`/api/threads/${id}/messages`).then((r) => r.json()),
    processMessage: async ({ threadId, messages, abortController }) => {
      return fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ threadId, messages }),
        signal: abortController.signal,
      });
    },
    streamProtocol: agUIAdapter(),
  });

  return (
    <CrayonChat
      chat={chat}
      type="copilot"
      theme={{ mode: "dark" }}
      welcomeMessage={{
        title: "Welcome!",
        description: "Ask me anything about cooking.",
      }}
    />
  );
}
```

#### Escape Hatch (Lower-Level Hooks)

```tsx
function App() {
  const threadListManager = useThreadListManager({ ... });
  const threadManager = useThreadManager({ ... });

  return (
    <CrayonChat
      chat={{ threadManager, threadListManager }}
      type="standalone"
    />
  );
}
```
