```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
  threads: Thread[];
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:64](https://github.com/thesysdev/crayon/blob/0127003ed9bff74d06359995c8d9eea4558f4151/js/packages/react-core/src/types/chatManager.ts#L64)

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
