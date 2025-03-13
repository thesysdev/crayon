```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
  threads: Thread[];
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:52](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L52)

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

<a id="error"></a> `error`

</td>
<td>

`Error` \| `null` \| `undefined`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:55](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L55)

</td>
</tr>
<tr>
<td>

<a id="isloading"></a> `isLoading`

</td>
<td>

`boolean`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:54](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L54)

</td>
</tr>
<tr>
<td>

<a id="selectedthreadid"></a> `selectedThreadId`

</td>
<td>

`string` \| `null`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:56](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L56)

</td>
</tr>
<tr>
<td>

<a id="shouldresetthreadstate"></a> `shouldResetThreadState`

</td>
<td>

`boolean`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:57](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L57)

</td>
</tr>
<tr>
<td>

<a id="threads"></a> `threads`

</td>
<td>

[`Thread`](Thread.md)[]

</td>
<td>

[packages/react-core/src/types/chatManager.ts:53](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L53)

</td>
</tr>
</tbody>
</table>
