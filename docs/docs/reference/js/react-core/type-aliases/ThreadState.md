```ts
type ThreadState = {
  error: Error | null | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:33](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L33)

Represents the state of a thread

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

&hyphen;

</td>
<td>

[packages/react-core/src/types/chatManager.ts:37](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L37)

</td>
</tr>
<tr>
<td>

<a id="isrunning"></a> `isRunning`?

</td>
<td>

`boolean`

</td>
<td>

Indicates if the thread is currently processing and controls should be disabled

</td>
<td>

[packages/react-core/src/types/chatManager.ts:35](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L35)

</td>
</tr>
<tr>
<td>

<a id="messages"></a> `messages`

</td>
<td>

[`Message`](Message.md)[]

</td>
<td>

&hyphen;

</td>
<td>

[packages/react-core/src/types/chatManager.ts:36](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L36)

</td>
</tr>
<tr>
<td>

<a id="responsetemplates"></a> `responseTemplates`

</td>
<td>

\{\}

</td>
<td>

&hyphen;

</td>
<td>

[packages/react-core/src/types/chatManager.ts:38](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L38)

</td>
</tr>
</tbody>
</table>
