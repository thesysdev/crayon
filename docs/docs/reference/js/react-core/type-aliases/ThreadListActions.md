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

Defined in: [packages/react-core/src/types/chatManager.ts:75](https://github.com/thesysdev/crayon/blob/808d53cdbf57dfd9386204060478ba44146d3921/js/packages/react-core/src/types/chatManager.ts#L75)

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
