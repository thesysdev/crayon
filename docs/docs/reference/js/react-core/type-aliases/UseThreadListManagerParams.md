```ts
type UseThreadListManagerParams = {
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  deleteThread: (id: string) => Promise<void>;
  fetchThreadList: () => Promise<Thread[]>;
  onSelectThread: (threadId: string) => void;
  onSwitchToNew: () => void;
  updateThread: (updated: Thread) => Promise<Thread>;
};
```

Defined in: [packages/react-core/src/useThreadListManager.ts:11](https://github.com/thesysdev/crayon/blob/808d53cdbf57dfd9386204060478ba44146d3921/js/packages/react-core/src/useThreadListManager.ts#L11)

Parameters to be passed to the [useThreadListManager](../functions/useThreadListManager.md) hook

## Type declaration

### createThread()

```ts
(firstMessage: UserMessage) => Promise<Thread>;
```

Creates a new thread when user sends the first message

### deleteThread()

```ts
(id: string) => Promise<void>;
```

### fetchThreadList()

```ts
() => Promise<Thread[]>;
```

### onSelectThread()

```ts
(threadId: string) => void
```

### onSwitchToNew()

```ts
() => void
```

Allows user to clear chat state when switched to new thread

### updateThread()

```ts
(updated: Thread) => Promise<Thread>;
```
