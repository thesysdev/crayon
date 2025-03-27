```ts
type ThreadListActions = {
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  deleteThread: (threadId: string) => void;
  load: () => void;
  selectThread: (threadId: string, shouldResetThreadState?: boolean) => void;
  switchToNewThread: () => void;
  updateThread: (thread: Thread) => void;
};
```

Defined in: [js/packages/react-core/src/types/chatManager.ts:91](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L91)

Actions available for managing the state of a thread list

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

Creates a new thread with given `firstMessage` as the user message

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:97](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L97)

</td>
</tr>
<tr>
<td>

<a id="deletethread"></a> `deleteThread`

</td>
<td>

(`threadId`: `string`) => `void`

</td>
<td>

Deletes a thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:103](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L103)

</td>
</tr>
<tr>
<td>

<a id="load"></a> `load`

</td>
<td>

() => `void`

</td>
<td>

Loads the thread list

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:93](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L93)

</td>
</tr>
<tr>
<td>

<a id="selectthread"></a> `selectThread`

</td>
<td>

(`threadId`: `string`, `shouldResetThreadState`?: `boolean`) => `void`

</td>
<td>

Selects a thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:99](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L99)

</td>
</tr>
<tr>
<td>

<a id="switchtonewthread"></a> `switchToNewThread`

</td>
<td>

() => `void`

</td>
<td>

Clears the thread state so that the user can start a new thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:95](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L95)

</td>
</tr>
<tr>
<td>

<a id="updatethread"></a> `updateThread`

</td>
<td>

(`thread`: [`Thread`](Thread.md)) => `void`

</td>
<td>

Updates a thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:101](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L101)

</td>
</tr>
</tbody>
</table>
