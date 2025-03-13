# Connecting to a Simple Thread Backend

This guide demonstrates how to implement a simple in-memory thread backend for Crayon Chat.

## Backend Implementation

First, create a simple in-memory store for your threads and messages:

```typescript title="api/store.ts"
interface Message {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  createdAt: Date;
}

interface Thread {
  threadId: number;
  title: string;
  createdAt: Date;
  status: 'active' | 'deleted';
}

// In-memory storage
const threads = new Map<number, Thread>();
const messages = new Map<number, Message[]>();
let nextThreadId = 1;
```

Create simple API routes for handling threads and messages:

```typescript title="api/threads/route.ts"
export async function GET() {
  return Response.json({
    threads: Array.from(threads.values())
      .filter(t => t.status === 'active')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const thread: Thread = {
    threadId: nextThreadId++,
    title: body.title || 'New Chat',
    createdAt: new Date(),
    status: 'active'
  };
  threads.set(thread.threadId, thread);
  messages.set(thread.threadId, []);
  return Response.json(thread);
}
```

```typescript title="api/messages/route.ts"
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = parseInt(searchParams.get('threadId') || '');
  return Response.json({
    messages: messages.get(threadId) || []
  });
}

export async function POST(request: Request) {
  const { threadId, message } = await request.json();
  const threadMessages = messages.get(threadId) || [];
  const newMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    message,
    createdAt: new Date()
  };
  threadMessages.push(newMessage);
  messages.set(threadId, threadMessages);
  return Response.json(newMessage);
}
```

## Frontend Integration

Connect your frontend using the `CrayonChat` component with custom thread managers:

```tsx title="app/page.tsx"
import { CrayonChat } from "@crayonai/react-ui";
import { useThreadListManager, useThreadManager } from "@crayonai/react-core";

export default function Chat() {
  const threadListManager = useThreadListManager({
    fetchThreadList: async () => {
      const response = await fetch('/api/threads');
      const data = await response.json();
      return data.threads;
    },
    createThread: async (firstMessage) => {
      const response = await fetch('/api/threads', {
        method: 'POST',
        body: JSON.stringify({ title: firstMessage.message })
      });
      return response.json();
    },
    // Exercise for the reader
    deleteThread: async () => {},
    updateThread: async (t) => t,
    onSwitchToNew: () => {},
    onSelectThread: () => {}
  });

  const threadManager = useThreadManager({
    threadId: threadListManager.selectedThreadId,
    shouldResetThreadState: threadListManager.shouldResetThreadState,
    loadThread: async () => {
      const response = await fetch(`/api/messages?threadId=${threadListManager.selectedThreadId}`);
      const data = await response.json();
      return data.messages;
    },
    onProcessMessage: async ({ message, threadManager }) => {
      // Send message to your backend
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          threadId: threadListManager.selectedThreadId,
          message: message.message
        })
      });
      const newMessage = await response.json();
      threadManager.appendMessages(newMessage);
      return [];
    }
  });

  return (
    <CrayonChat
      threadListManager={threadListManager}
      threadManager={threadManager}
    />
  );
}
```

The `CrayonChat` component with custom thread managers gives you:

1. Full control over thread and message management
2. Custom thread listing and creation logic
3. Custom message processing and storage
4. Built-in UI components and state synchronization

This implementation provides a basic in-memory thread backend that supports:
- Creating new threads
- Listing existing threads
- Sending and receiving messages
- Persisting messages within a thread

Note that this in-memory implementation is suitable for development and testing. For production use, you should implement proper database storage and error handling.
