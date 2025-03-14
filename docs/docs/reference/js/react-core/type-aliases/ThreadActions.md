```ts
type ThreadActions = {
  appendMessages: (...messages: Message[]) => void;
  onCancel: () => void;
  processMessage: (message: CreateMessage) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  updateMessage: (message: Message) => void;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:26](https://github.com/thesysdev/crayon/blob/808d53cdbf57dfd9386204060478ba44146d3921/js/packages/react-core/src/types/chatManager.ts#L26)

Actions available for managing a thread

## Type declaration

### appendMessages()

```ts
(...messages: Message[]) => void
```

### onCancel()

```ts
() => void
```

### processMessage()

```ts
(message: CreateMessage) => Promise<void>;
```

### setMessages()

```ts
(messages: Message[]) => void
```

### updateMessage()

```ts
(message: Message) => void
```

## Template

The message type used in the thread
