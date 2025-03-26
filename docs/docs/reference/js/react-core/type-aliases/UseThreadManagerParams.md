```ts
type UseThreadManagerParams = {
  loadThread: (threadId: string) => Promise<Message[]>;
  onProcessMessage: (props: {
    abortController: AbortController;
    message: CreateMessage;
    threadManager: ThreadManager;
  }) => Promise<Message[]>;
  onUpdateMessage: (props: { message: Message }) => void;
  responseTemplates: ResponseTemplate[];
  shouldResetThreadState: boolean;
  threadId: string | null;
};
```

Defined in: [packages/react-core/src/useThreadManager.ts:10](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/useThreadManager.ts#L10)

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

### onUpdateMessage()?

```ts
(props: {
  message: Message;
 }) => void
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
