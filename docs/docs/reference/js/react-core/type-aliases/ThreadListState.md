```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  threads: Thread[];
};
```

Represents the state of the thread list

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

`error`

</td>
<td>

`Error` \| `null` \| `undefined`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:55](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/chatManager.ts#L55)

</td>
</tr>
<tr>
<td>

`isLoading`

</td>
<td>

`boolean`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:54](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/chatManager.ts#L54)

</td>
</tr>
<tr>
<td>

`selectedThreadId`

</td>
<td>

`string` \| `null`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:56](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/chatManager.ts#L56)

</td>
</tr>
<tr>
<td>

`threads`

</td>
<td>

[`Thread`](Thread.md)[]

</td>
<td>

[packages/react-core/src/types/chatManager.ts:53](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/chatManager.ts#L53)

</td>
</tr>
</tbody>
</table>

## Defined in

[packages/react-core/src/types/chatManager.ts:52](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/chatManager.ts#L52)
