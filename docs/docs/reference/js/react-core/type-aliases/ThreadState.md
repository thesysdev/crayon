```ts
type ThreadState = {
  error: Error | null | undefined;
  isLoadingMessages: boolean | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:39](https://github.com/thesysdev/crayon/blob/d0d1410263fe0f83e2b52bc1d37c0693717089fe/js/packages/react-core/src/types/chatManager.ts#L39)

Represents the state of a thread

## Type declaration

### error

```ts
error: Error | null | undefined;
```

### isLoadingMessages

```ts
isLoadingMessages: boolean | undefined;
```

Indicates if the messages are currently loading

### isRunning?

```ts
optional isRunning: boolean;
```

Indicates if the thread is currently processing and controls should be disabled

### messages

```ts
messages: Message[];
```

### responseTemplates

```ts
{
}
```
