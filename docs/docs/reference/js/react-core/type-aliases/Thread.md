```ts
type Thread = {
  createdAt: Date;
  isRunning: boolean;
  threadId: string;
  title: string;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:9](https://github.com/thesysdev/crayon/blob/0127003ed9bff74d06359995c8d9eea4558f4151/js/packages/react-core/src/types/chatManager.ts#L9)

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
