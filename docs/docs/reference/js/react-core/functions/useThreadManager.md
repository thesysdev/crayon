```ts
function useThreadManager(params: UseThreadManagerParams): ThreadManager;
```

Defined in: [js/packages/react-core/src/useThreadManager.ts:41](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L41)

`useThreadManager` takes the necessary arguments and helps create a [ThreadManager](../type-aliases/ThreadManager.md) instance. This instance is necessary to define how a thread should
be loaded and how a message in the thread should be processed or updated. This can be useful for multiple reasons, including but not limited to:

- The hook makes it incredibly easy to manage the thread and does not require you to implement a thread manager from scratch manually
- You can use the thread manager to load a thread from a backend API
- You can use the thread manager to process a message and request the agent for the response
- You can use the thread manager to update a message

## Parameters

### params

[`UseThreadManagerParams`](../type-aliases/UseThreadManagerParams.md)

## Returns

[`ThreadManager`](../type-aliases/ThreadManager.md)

The thread manager
