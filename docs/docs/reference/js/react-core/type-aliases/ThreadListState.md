```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
  threads: Thread[];
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:65](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/types/chatManager.ts#L65)

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
