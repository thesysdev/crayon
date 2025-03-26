```ts
type Thread = {
  createdAt: Date;
  isRunning: boolean;
  threadId: string;
  title: string;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:9](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/types/chatManager.ts#L9)

Represents a chat thread

## Type declaration

### createdAt

```ts
createdAt: Date;
```

Creation timestamp

### isRunning?

```ts
optional isRunning: boolean;
```

Indicates if the thread is currently processing

### threadId

```ts
threadId: string;
```

Unique identifier for the thread

### title

```ts
title: string;
```

Title of the thread
