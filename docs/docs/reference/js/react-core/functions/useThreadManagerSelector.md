`useThreadManagerSelector` allows you to efficiently extract one or more values from the [`ThreadManager`](../type-aliases/ThreadManager.md) instance
without having to access the entire [`ThreadManager`](../type-aliases/ThreadManager.md).

## Example:

```ts
interface MessagesAndTemplates {
  messages: Message[];
  templates: ResponseTemplate[];
}

const { messages, templates } = useThreadManagerSelector<MessagesAndTemplates>(
  (threadManager) => ({
    messages: threadManager.messages,
    templates: Object.values(threadManager.responseTemplates),
  }),
);
```

---

```ts
function useThreadManagerSelector<R>(accessor: AtomicAccessor<R>): R;
```

Defined in: [js/packages/react-core/src/hooks/useThreadManagerSelector.ts:18](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/hooks/useThreadManagerSelector.ts#L18)

## Type Parameters

• **R**

The type of the value to be extracted from the [ThreadManager](../type-aliases/ThreadManager.md) instance. For example, `boolean | undefined`:

```ts
const isRunning = useThreadManagerSelector<boolean | undefined>(
  (threadManager) => threadManager.isRunning,
); // returning any other type throws an error
```

If no type is passed, one is inferred from the accessor function.

## Parameters

### accessor

`AtomicAccessor`\<`R`\>

A function that is passed the [ThreadManager](../type-aliases/ThreadManager.md) instance as an argument and returns the value to be extracted.

## Returns

`R`

The value returned by the accessor function.
