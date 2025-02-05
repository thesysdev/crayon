```ts
function ChatProvider(props: PropsWithChildren<ChatManager>): ReactNode | Promise<ReactNode>
```

## Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`props`

</td>
<td>

`PropsWithChildren`\<[`ChatManager`](../type-aliases/ChatManager.md)\>

</td>
<td>

The component props

</td>
</tr>
</tbody>
</table>

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

## Defined in

[packages/react-core/src/ChatProvider.tsx:30](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/ChatProvider.tsx#L30)
