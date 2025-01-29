```ts
type ThreadListActions = {
  deleteThread: (threadId: string) => void;
  load: () => void;
  loadMore: () => void;
  selectThread: (threadId: string) => void;
  switchToNewThread: () => void;
  updateThread: (thread: Thread) => void;
};
```

Actions available for managing the thread list

## Type declaration

<table>
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Defined in</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`deleteThread`

</td>
<td>

(`threadId`: `string`) => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:70](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L70)

</td>
</tr>
<tr>
<td>

`load`

</td>
<td>

() => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:64](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L64)

</td>
</tr>
<tr>
<td>

`loadMore`

</td>
<td>

() => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:66](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L66)

</td>
</tr>
<tr>
<td>

`selectThread`

</td>
<td>

(`threadId`: `string`) => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:68](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L68)

</td>
</tr>
<tr>
<td>

`switchToNewThread`

</td>
<td>

() => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:67](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L67)

</td>
</tr>
<tr>
<td>

`updateThread`

</td>
<td>

(`thread`: [`Thread`](Thread.md)) => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:69](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L69)

</td>
</tr>
</tbody>
</table>

## Defined in

[packages/react-core/src/types/chatManager.ts:63](https://github.com/thesysdev/crayonai/blob/f566456db11ebf0674916d45b40423bef47282cf/frontend-sdk/packages/react-core/src/types/chatManager.ts#L63)
