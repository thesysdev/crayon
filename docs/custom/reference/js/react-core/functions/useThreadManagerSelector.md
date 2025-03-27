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
  })
);
```
