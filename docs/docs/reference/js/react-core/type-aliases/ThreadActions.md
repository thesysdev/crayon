```ts
type ThreadActions = {
  appendMessages: (...messages: Message[]) => void;
  onCancel: () => void;
  processMessage: (message: CreateMessage) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  updateMessage: (message: Message) => void;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:26](https://github.com/thesysdev/crayon/blob/764dfdfef65ac5751288cdbd014d2017f4c5dc0d/js/packages/react-core/src/types/chatManager.ts#L26)

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
