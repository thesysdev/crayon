```ts
type ThreadState = {
  error: Error | null | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:39](https://github.com/thesysdev/crayon/blob/0127003ed9bff74d06359995c8d9eea4558f4151/js/packages/react-core/src/types/chatManager.ts#L39)

Represents the state of a thread

## Type declaration

### error

```ts
error: Error | null | undefined;
```

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
