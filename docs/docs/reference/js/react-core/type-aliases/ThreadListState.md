```ts
type ThreadListState = {
  error: Error | null | undefined;
  isLoading: boolean;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
  threads: Thread[];
};
```

Defined in: [js/packages/react-core/src/types/chatManager.ts:72](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L72)

Represents the state of the thread list

## Type declaration

<table>
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Description</th>
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

The error that occurred while fetching the thread list

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:78](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L78)

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

Indicates if the thread list is currently loading

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:76](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L76)

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

The id of the selected / active thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:80](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L80)

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

Indicates if the thread state should be reset when the selected thread changes. This helps clear and update the list of messages on the screen when switching
between threads.

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:83](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L83)

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

The list of threads

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:74](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L74)

</td>
</tr>
</tbody>
</table>
