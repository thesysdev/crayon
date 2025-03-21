```ts
type UseThreadManagerParams = {
  loadThread: (threadId: string) => Promise<Message[]>;
  onProcessMessage: (props: {
    abortController: AbortController;
    message: CreateMessage;
    threadManager: ThreadManager;
  }) => Promise<Message[]>;
  responseTemplates: ResponseTemplate[];
  shouldResetThreadState: boolean;
  threadId: string | null;
};
```

Defined in: [packages/react-core/src/useThreadManager.ts:10](https://github.com/thesysdev/crayon/blob/764dfdfef65ac5751288cdbd014d2017f4c5dc0d/js/packages/react-core/src/useThreadManager.ts#L10)

Parameters to be passed to the [useThreadManager](../functions/useThreadManager.md) hook

## Type declaration

### loadThread()

```ts
(threadId: string) => Promise<Message[]>;
```

### onProcessMessage()

```ts
(props: {
  abortController: AbortController;
  message: CreateMessage;
  threadManager: ThreadManager;
}) => Promise<Message[]>;
```

### responseTemplates

```ts
responseTemplates: ResponseTemplate[];
```

### shouldResetThreadState?

```ts
optional shouldResetThreadState: boolean;
```

### threadId

```ts
threadId: string | null;
```
