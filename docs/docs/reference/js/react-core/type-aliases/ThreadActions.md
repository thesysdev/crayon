```ts
type ThreadActions = {
  appendMessages: (...messages: Message[]) => void;
  deleteMessage: (messageId: string) => void;
  onCancel: () => void;
  processMessage: (message: CreateMessage) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  updateMessage: (message: Message, shouldTriggerCallback?: boolean) => void;
};
```

Defined in: [js/packages/react-core/src/types/chatManager.ts:25](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L25)

Actions available for managing the state of a thread

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

<a id="appendmessages"></a> `appendMessages`

</td>
<td>

(...`messages`: [`Message`](Message.md)[]) => `void`

</td>
<td>

Appends a new message to the thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:31](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L31)

</td>
</tr>
<tr>
<td>

<a id="deletemessage"></a> `deleteMessage`

</td>
<td>

(`messageId`: `string`) => `void`

</td>
<td>

Deletes a message from the thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:39](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L39)

</td>
</tr>
<tr>
<td>

<a id="oncancel"></a> `onCancel`

</td>
<td>

() => `void`

</td>
<td>

Cancels the current message processing

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:35](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L35)

</td>
</tr>
<tr>
<td>

<a id="processmessage"></a> `processMessage`

</td>
<td>

(`message`: [`CreateMessage`](CreateMessage.md)) => `Promise`\<`void`\>

</td>
<td>

Calls the `processMessage` method of the `ThreadManager` to process a new user message and request a response from the agent. If
the `useThreadManager` hook was used to create a `ThreadManager`, this method is the same one as the `processMessage` method provided to the hook.

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:29](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L29)

</td>
</tr>
<tr>
<td>

<a id="setmessages"></a> `setMessages`

</td>
<td>

(`messages`: [`Message`](Message.md)[]) => `void`

</td>
<td>

Sets the messages in the thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:37](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L37)

</td>
</tr>
<tr>
<td>

<a id="updatemessage"></a> `updateMessage`

</td>
<td>

(`message`: [`Message`](Message.md), `shouldTriggerCallback`?: `boolean`) => `void`

</td>
<td>

Updates a message in the thread

</td>
<td>

[js/packages/react-core/src/types/chatManager.ts:33](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L33)

</td>
</tr>
</tbody>
</table>
