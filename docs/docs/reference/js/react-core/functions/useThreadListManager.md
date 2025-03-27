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

Defined in: [js/packages/react-core/src/useThreadListManager.ts:35](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L35)

`useThreadListManager` takes the necessary arguments and helps create a [ThreadListManager](../type-aliases/ThreadListManager.md) instance. This instance is necessary to define how a thread list should
be fetched, updated, deleted, and selected and which backend APIs should be called at any of these events or actions.

## Parameters

### params

#### createThread

(`firstMessage`: [`UserMessage`](../type-aliases/UserMessage.md)) => `Promise`\<[`Thread`](../type-aliases/Thread.md)\>

Creates a new thread when the user sends the first message. Useful for integrating a backend API to create a new thread.

#### deleteThread

(`id`: `string`) => `Promise`\<`void`\>

A function that defines how a thread should be deleted. Useful for integrating a backend API to delete a thread.

#### fetchThreadList

() => `Promise`\<[`Thread`](../type-aliases/Thread.md)[]\>

A function that defines how the thread list should be fetched. Useful for integrating a backend API to fetch the thread list.

#### onSelectThread

(`threadId`: `string`) => `void`

Runs when the user selects a thread

#### onSwitchToNew

() => `void`

Runs when the user switches to a new thread

#### updateThread

(`updated`: [`Thread`](../type-aliases/Thread.md)) => `Promise`\<[`Thread`](../type-aliases/Thread.md)\>

A function that defines how a thread should be updated. Useful for integrating a backend API to update a thread.

## Returns

[`ThreadListManager`](../type-aliases/ThreadListManager.md)

A ThreadListManager instance
