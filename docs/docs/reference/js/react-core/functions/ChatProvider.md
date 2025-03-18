This is custom ChatProvider documentation

```ts
function ChatProvider(
  props: PropsWithChildren<ChatManager>,
): ReactNode | Promise<ReactNode>;
```

Defined in: [packages/react-core/src/ChatProvider.tsx:30](https://github.com/thesysdev/crayon/blob/f26f6e3fea35942286effcb2ff9bd07ac1f92984/js/packages/react-core/src/ChatProvider.tsx#L30)

## Parameters

### props

`PropsWithChildren`\<[`ChatManager`](../type-aliases/ChatManager.md)\>

The component props

## Returns

`ReactNode` \| `Promise`\<`ReactNode`\>

A ChatContext.Provider wrapping the children components

## Remarks

ChatProvider is a React component that provides chat management context to its children.
It serves as the top-level provider for thread and thread list management functionality.

## Example

```tsx
<ChatProvider
  threadManager={myThreadManager}
  threadListManager={myThreadListManager}
>
  <App />
</ChatProvider>
```
