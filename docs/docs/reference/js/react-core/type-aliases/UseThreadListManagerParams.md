```ts
type UseThreadListManagerParams = {
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  deleteThread: (id: string) => Promise<void>;
  fetchThreadList: () => Promise<Thread[]>;
  onSelectThread: (threadId: string) => void;
  onSwitchToNew: () => void;
  updateThread: (updated: Thread) => Promise<Thread>;
};
```

Defined in: [js/packages/react-core/src/useThreadListManager.ts:11](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L11)

Parameters to be passed to the [useThreadListManager](../functions/useThreadListManager.md) hook

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

<a id="createthread"></a> `createThread`

</td>
<td>

(`firstMessage`: [`UserMessage`](UserMessage.md)) => `Promise`\<[`Thread`](Thread.md)\>

</td>
<td>

Creates a new thread when the user sends the first message. Useful for integrating a backend API to create a new thread.

</td>
<td>

[js/packages/react-core/src/useThreadListManager.ts:23](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L23)

</td>
</tr>
<tr>
<td>

<a id="deletethread"></a> `deleteThread`

</td>
<td>

(`id`: `string`) => `Promise`\<`void`\>

</td>
<td>

A function that defines how a thread should be deleted. Useful for integrating a backend API to delete a thread.

</td>
<td>

[js/packages/react-core/src/useThreadListManager.ts:15](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L15)

</td>
</tr>
<tr>
<td>

<a id="fetchthreadlist"></a> `fetchThreadList`

</td>
<td>

() => `Promise`\<[`Thread`](Thread.md)[]\>

</td>
<td>

A function that defines how the thread list should be fetched. Useful for integrating a backend API to fetch the thread list.

</td>
<td>

[js/packages/react-core/src/useThreadListManager.ts:13](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L13)

</td>
</tr>
<tr>
<td>

<a id="onselectthread"></a> `onSelectThread`

</td>
<td>

(`threadId`: `string`) => `void`

</td>
<td>

Runs when the user selects a thread

</td>
<td>

[js/packages/react-core/src/useThreadListManager.ts:21](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L21)

</td>
</tr>
<tr>
<td>

<a id="onswitchtonew"></a> `onSwitchToNew`

</td>
<td>

() => `void`

</td>
<td>

Runs when the user switches to a new thread

</td>
<td>

[js/packages/react-core/src/useThreadListManager.ts:19](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L19)

</td>
</tr>
<tr>
<td>

<a id="updatethread"></a> `updateThread`

</td>
<td>

(`updated`: [`Thread`](Thread.md)) => `Promise`\<[`Thread`](Thread.md)\>

</td>
<td>

A function that defines how a thread should be updated. Useful for integrating a backend API to update a thread.

</td>
<td>

[js/packages/react-core/src/useThreadListManager.ts:17](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadListManager.ts#L17)

</td>
</tr>
</tbody>
</table>
