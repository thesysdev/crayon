ChatProvider is a top-level React context provider component that makes it possible for hooks like the [`useThreadListManager`](../functions/useThreadListManager.md) and
[`useThreadManager`](../functions/useThreadManager) to work. It contains the entire application context, including the [`ThreadManager`](../type-aliases/ThreadManager.md)
and [`ThreadListManager`](../type-aliases/ThreadListManager.md).

## Props

| Prop                | Description                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `threadManager`     | The [ThreadManager](../type-aliases/ThreadManager.md) instance for handling individual chat threads          |
| `threadListManager` | The [ThreadListManager](../type-aliases/ThreadListManager.md) instance for handling the list of chat threads |
| `children`          | The child components that will be provided and will have access to this chat context                         |

## Example

```tsx
<ChatProvider
  threadManager={myThreadManager}
  threadListManager={myThreadListManager}
>
```

---

```ts
function ChatProvider(
  props: PropsWithChildren<ChatManager>,
): ReactNode | Promise<ReactNode>;
```

Defined in: [js/packages/react-core/src/ChatProvider.tsx:10](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/ChatProvider.tsx#L10)

## Parameters

### props

`PropsWithChildren`\<[`ChatManager`](../type-aliases/ChatManager.md)\>

## Returns

`ReactNode` \| `Promise`\<`ReactNode`\>
