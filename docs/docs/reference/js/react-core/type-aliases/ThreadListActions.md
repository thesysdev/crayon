```ts
type ThreadListActions = {
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  deleteThread: (threadId: string) => void;
  load: () => void;
  selectThread: (threadId: string, shouldResetThreadState?: boolean) => void;
  switchToNewThread: () => void;
  updateThread: (thread: Thread) => void;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:78](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/types/chatManager.ts#L78)

Actions available for managing the thread list

## Type declaration

### createThread()

```ts
(firstMessage: UserMessage) => Promise<Thread>;
```

### deleteThread()

```ts
(threadId: string) => void
```

### load()

```ts
() => void
```

### selectThread()

```ts
(threadId: string, shouldResetThreadState?: boolean) => void
```

### switchToNewThread()

```ts
() => void
```

### updateThread()

```ts
(thread: Thread) => void
```
