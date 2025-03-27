```ts
type ThreadState = {
  error: Error | null | undefined;
  isLoadingMessages: boolean | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: Record<string, ResponseTemplate>;
};
```

Defined in: [js/packages/react-core/src/types/chatManager.ts:47](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L47)

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

The error that occurred during the last message processing

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:55](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L55)

</td>
</tr>
<tr>
<td>

<a id="isloadingmessages"></a> `isLoadingMessages`

</td>
<td>

`boolean` \| `undefined`

</td>
<td>

Indicates if the messages are currently loading

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:51](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L51)

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

[js/packages/react-core/src/types/chatManager.ts:49](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L49)

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

The messages in the thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:53](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L53)

</td>
</tr>
<tr>
<td>

<a id="responsetemplates"></a> `responseTemplates`

</td>
<td>

`Record`\<`string`, [`ResponseTemplate`](../interfaces/ResponseTemplate.md)\>

</td>
<td>

The response templates available for the thread. If the [useThreadManager](../functions/useThreadManager.md) hook was used to create the [ThreadManager](ThreadManager.md), this property is the same one as the
`responseTemplates` property provided to the hook.

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:59](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L59)

</td>
</tr>
</tbody>
</table>
