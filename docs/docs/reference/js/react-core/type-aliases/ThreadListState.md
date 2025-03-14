```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
  threads: Thread[];
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:62](https://github.com/thesysdev/crayon/blob/42bf9c916a4f4ba514db529a08f9461bfbbad8ca/js/packages/react-core/src/types/chatManager.ts#L62)

Represents the state of the thread list

## Type declaration

### error

```ts
error: Error | null | undefined;
```

### isLoading

```ts
isLoading: boolean;
```

### selectedThreadId

```ts
selectedThreadId: string | null;
```

### shouldResetThreadState

```ts
shouldResetThreadState: boolean;
```

### threads

```ts
threads: Thread[];
```
