```ts
type ThreadActions = {
  appendMessages: (...messages: Message[]) => void;
  onCancel: () => void;
  processMessage: (message: CreateMessage) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  updateMessage: (message: Message) => void;
};
```

Defined in: [packages/react-core/src/types/chatManager.ts:22](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L22)

Actions available for managing a thread

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

<a id="appendmessages"></a> `appendMessages`

</td>
<td>

(...`messages`: [`Message`](Message.md)[]) => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:24](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L24)

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

[packages/react-core/src/types/chatManager.ts:26](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L26)

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

[packages/react-core/src/types/chatManager.ts:23](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L23)

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

[packages/react-core/src/types/chatManager.ts:27](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L27)

</td>
</tr>
<tr>
<td>

<a id="updatemessage"></a> `updateMessage`

</td>
<td>

(`message`: [`Message`](Message.md)) => `void`

</td>
<td>

[packages/react-core/src/types/chatManager.ts:25](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/chatManager.ts#L25)

</td>
</tr>
</tbody>
</table>

## Template

The message type used in the thread
