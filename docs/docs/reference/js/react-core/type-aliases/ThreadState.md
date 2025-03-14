```ts
type ThreadState = {
  error: Error | null | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:39](https://github.com/thesysdev/crayon/blob/808d53cdbf57dfd9386204060478ba44146d3921/js/packages/react-core/src/types/chatManager.ts#L39)

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
