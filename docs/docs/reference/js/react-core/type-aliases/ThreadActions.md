```ts
type ThreadActions = {
  appendMessages: (...messages: Message[]) => void;
  onCancel: () => void;
  processMessage: (message: CreateMessage) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  updateMessage: (message: Message) => void;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:26](https://github.com/thesysdev/crayon/blob/98ce97833eb11214d1a262c86636536d46fccc04/js/packages/react-core/src/types/chatManager.ts#L26)

Actions available for managing a thread

## Type declaration

### appendMessages()

```ts
(...messages: Message[]) => void
```

### deleteMessage()

```ts
(messageId: string) => void
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
(message: Message, shouldTriggerCallback?: boolean) => void
```

## Template

The message type used in the thread
