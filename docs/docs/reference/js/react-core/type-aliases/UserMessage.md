```ts
type UserMessage = {
  id: string;
  isVisuallyHidden: boolean;
} & {
  role: "user";
} & {
  context: JSONValue[];
  message: string;
  type: "prompt";
};
```

Defined in: [js/packages/react-core/src/types/message.ts:18](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L18)

A type that represents a message sent by the user

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
<th>Defined in</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`role`

</td>
<td>

`"user"`

</td>
<td>

[js/packages/react-core/src/types/message.ts:19](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L19)

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

[js/packages/react-core/src/types/message.ts:25](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L25)

</td>
</tr>
<tr>
<td>

`message`?

</td>
<td>

`string`

</td>
<td>

The message content as a string

</td>
<td>

[js/packages/react-core/src/types/message.ts:23](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L23)

</td>
</tr>
<tr>
<td>

`type`

</td>
<td>

`"prompt"`

</td>
<td>

&hyphen;

</td>
<td>

[js/packages/react-core/src/types/message.ts:21](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L21)

</td>
</tr>
</tbody>
</table>
