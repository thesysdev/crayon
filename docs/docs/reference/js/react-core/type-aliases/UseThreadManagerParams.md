```ts
type UseThreadManagerParams = {
  loadThread: (threadId: string) => Promise<Message[]>;
  onProcessMessage: (props: {
    abortController: AbortController;
    message: CreateMessage;
    threadManager: ThreadManager;
  }) => Promise<Message[]>;
  onUpdateMessage: (props: { message: Message }) => void;
  responseTemplates: ResponseTemplate[];
  shouldResetThreadState: boolean;
  threadId: string | null;
};
```

Defined in: [js/packages/react-core/src/useThreadManager.ts:10](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L10)

Parameters to be passed to the [useThreadManager](../functions/useThreadManager.md) hook

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

<a id="loadthread"></a> `loadThread`

</td>
<td>

(`threadId`: `string`) => `Promise`\<[`Message`](Message.md)[]\>

</td>
<td>

A function that defines how the thread should be loaded. Useful for integrating a backend API to load a thread.

</td>
<td>

[js/packages/react-core/src/useThreadManager.ts:16](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L16)

</td>
</tr>
<tr>
<td>

<a id="onprocessmessage"></a> `onProcessMessage`

</td>
<td>

(`props`: \{
`abortController`: `AbortController`;
`message`: [`CreateMessage`](CreateMessage.md);
`threadManager`: [`ThreadManager`](ThreadManager.md);
\}) => `Promise`\<[`Message`](Message.md)[]\>

</td>
<td>

A function that defines how message should be processed. Useful for integrating a backend API to process a message and request the agent for the response

</td>
<td>

[js/packages/react-core/src/useThreadManager.ts:18](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L18)

</td>
</tr>
<tr>
<td>

<a id="onupdatemessage"></a> `onUpdateMessage`?

</td>
<td>

(`props`: \{
`message`: [`Message`](Message.md);
\}) => `void`

</td>
<td>

A function that defines how a message should be updated. Useful for integrating a backend API to update a message.

</td>
<td>

[js/packages/react-core/src/useThreadManager.ts:24](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L24)

</td>
</tr>
<tr>
<td>

<a id="responsetemplates"></a> `responseTemplates`

</td>
<td>

[`ResponseTemplate`](../interfaces/ResponseTemplate.md)[]

</td>
<td>

A list of response templates available to the thread.

</td>
<td>

[js/packages/react-core/src/useThreadManager.ts:26](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L26)

</td>
</tr>
<tr>
<td>

<a id="shouldresetthreadstate"></a> `shouldResetThreadState`?

</td>
<td>

`boolean`

</td>
<td>

Whether to reset the thread state when switching to a new thread

</td>
<td>

[js/packages/react-core/src/useThreadManager.ts:14](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L14)

</td>
</tr>
<tr>
<td>

<a id="threadid-1"></a> `threadId`

</td>
<td>

`string` \| `null`

</td>
<td>

Unique identifier for the thread. If the thread is not created yet, the value should be `null`

</td>
<td>

[js/packages/react-core/src/useThreadManager.ts:12](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/useThreadManager.ts#L12)

</td>
</tr>
</tbody>
</table>
