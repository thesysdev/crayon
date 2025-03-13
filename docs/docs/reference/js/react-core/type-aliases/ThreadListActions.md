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

Defined in: [packages/react-core/src/types/chatManager.ts:63](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L63)

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

<a id="createthread"></a> `createThread`

</td>
<td>

(`firstMessage`: [`UserMessage`](UserMessage.md)) => `Promise`\<[`Thread`](Thread.md)\>

</td>
<td>

[packages/react-core/src/types/chatManager.ts:66](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L66)

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

[packages/react-core/src/types/chatManager.ts:69](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L69)

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

[packages/react-core/src/types/chatManager.ts:64](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L64)

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

[packages/react-core/src/types/chatManager.ts:67](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L67)

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

[packages/react-core/src/types/chatManager.ts:65](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L65)

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

[packages/react-core/src/types/chatManager.ts:68](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L68)

</td>
</tr>
</tbody>
</table>
