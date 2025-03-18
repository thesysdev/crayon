```ts
type ThreadState = {
  error: Error | null | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:39](https://github.com/thesysdev/crayon/blob/f26f6e3fea35942286effcb2ff9bd07ac1f92984/js/packages/react-core/src/types/chatManager.ts#L39)

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
