```ts
type ThreadState = {
  error: Error | null | undefined;
  isLoadingMessages: boolean | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:40](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/types/chatManager.ts#L40)

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
