```ts
function processStreamedMessage(__namedParameters: {
  createMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
  response: Response;
  updateMessage: (message: AssistantMessage) => void;
}): Promise<void>
```

Defined in: [packages/react-core/src/utils/processStreamedMessage.ts:3](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/utils/processStreamedMessage.ts#L3)

## Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`__namedParameters`

</td>
<td>

\{ `createMessage`: (`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`; `deleteMessage`: (`messageId`: `string`) => `void`; `response`: `Response`; `updateMessage`: (`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`; \}

</td>
</tr>
<tr>
<td>

`__namedParameters.createMessage`

</td>
<td>

(`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`

</td>
</tr>
<tr>
<td>

`__namedParameters.deleteMessage`

</td>
<td>

(`messageId`: `string`) => `void`

</td>
</tr>
<tr>
<td>

`__namedParameters.response`

</td>
<td>

`Response`

</td>
</tr>
<tr>
<td>

`__namedParameters.updateMessage`

</td>
<td>

(`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<`void`\>
