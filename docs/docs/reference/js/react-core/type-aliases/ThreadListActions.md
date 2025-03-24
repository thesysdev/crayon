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

Defined in: [packages/react-core/src/types/chatManager.ts:77](https://github.com/thesysdev/crayon/blob/98ce97833eb11214d1a262c86636536d46fccc04/js/packages/react-core/src/types/chatManager.ts#L77)

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
