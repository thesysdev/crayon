```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
  threads: Thread[];
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:64](https://github.com/thesysdev/crayon/blob/764dfdfef65ac5751288cdbd014d2017f4c5dc0d/js/packages/react-core/src/types/chatManager.ts#L64)

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
