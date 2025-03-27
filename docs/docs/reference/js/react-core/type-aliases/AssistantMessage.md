```ts
type AssistantMessage = {
  id: string;
  isVisuallyHidden: boolean;
} & {
  context: JSONValue[];
  message: (
    | {
        text: string;
        type: "text";
      }
    | {
        name: string;
        templateProps: any;
        type: "template";
      }
  )[];
  role: "assistant";
};
```

Defined in: [js/packages/react-core/src/types/message.ts:33](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L33)

A type that represents a message sent by the assistant / agent

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

`id`

</td>
<td>

`string`

</td>
<td>

The unique identifier of the message

</td>
<td>

[js/packages/react-core/src/types/message.ts:8](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L8)

</td>
</tr>
<tr>
<td>

`isVisuallyHidden`?

</td>
<td>

`boolean`

</td>
<td>

Whether the message should be visually hidden from the user on the UI

</td>
<td>

[js/packages/react-core/src/types/message.ts:10](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L10)

</td>
</tr>
</tbody>
</table>

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

`context`?

</td>
<td>

`JSONValue`[]

</td>
<td>

Additional data associated with the message

</td>
<td>

[js/packages/react-core/src/types/message.ts:36](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L36)

</td>
</tr>
<tr>
<td>

`message`?

</td>
<td>

(
\| \{
`text`: `string`;
`type`: `"text"`;
\}
\| \{
`name`: `string`;
`templateProps`: `any`;
`type`: `"template"`;
\})[]

</td>
<td>

The message content, either in a text format or a template (with the name of the response template and the props of the component that renders the template)

</td>
<td>

[js/packages/react-core/src/types/message.ts:38](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L38)

</td>
</tr>
<tr>
<td>

`role`

</td>
<td>

`"assistant"`

</td>
<td>

&hyphen;

</td>
<td>

[js/packages/react-core/src/types/message.ts:34](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L34)

</td>
</tr>
</tbody>
</table>
