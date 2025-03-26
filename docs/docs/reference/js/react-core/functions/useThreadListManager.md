```ts
function useThreadListManager(params: {
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  deleteThread: (id: string) => Promise<void>;
  fetchThreadList: () => Promise<Thread[]>;
  onSelectThread: (threadId: string) => void;
  onSwitchToNew: () => void;
  updateThread: (updated: Thread) => Promise<Thread>;
}): ThreadListManager;
```

Defined in: [packages/react-core/src/useThreadListManager.ts:28](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/useThreadListManager.ts#L28)

## Parameters

### params

#### createThread

(`firstMessage`: [`UserMessage`](../type-aliases/UserMessage.md)) => `Promise`\<[`Thread`](../type-aliases/Thread.md)\>

Creates a new thread when user sends the first message

#### deleteThread

(`id`: `string`) => `Promise`\<`void`\>

#### fetchThreadList

() => `Promise`\<[`Thread`](../type-aliases/Thread.md)[]\>

#### onSelectThread

(`threadId`: `string`) => `void`

#### onSwitchToNew

() => `void`

Allows user to clear chat state when switched to new thread

#### updateThread

(`updated`: [`Thread`](../type-aliases/Thread.md)) => `Promise`\<[`Thread`](../type-aliases/Thread.md)\>

## Returns

[`ThreadListManager`](../type-aliases/ThreadListManager.md)

A ThreadListManager instance
