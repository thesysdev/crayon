```ts
type CreateMessage = {
  context: JSONValue[];
  isVisuallyHidden: boolean;
  message: string;
  role: "user";
  type: "prompt";
};
```

Defined in: [js/packages/react-core/src/types/message.ts:66](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L66)

Contains all of the information required to create a message. Usually passed to the [ThreadManager](ThreadManager.md)'s `processMessage` method.

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

<a id="context"></a> `context`?

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

<a id="isvisuallyhidden"></a> `isVisuallyHidden`?

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
<tr>
<td>

<a id="message"></a> `message`?

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

<a id="role"></a> `role`

</td>
<td>

`"user"`

</td>
<td>

&hyphen;

</td>
<td>

[js/packages/react-core/src/types/message.ts:19](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/message.ts#L19)

</td>
</tr>
<tr>
<td>

<a id="type"></a> `type`

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
