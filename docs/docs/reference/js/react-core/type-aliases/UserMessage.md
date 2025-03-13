```ts
type UserMessage = common & {
  role: "user";
 } & {
  context: JSONValue[];
  message: string;
  type: "prompt";
};
```

Defined in: [packages/react-core/src/types/message.ts:16](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L16)

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

[packages/react-core/src/types/message.ts:17](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L17)

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

`context`?

</td>
<td>

`JSONValue`[]

</td>
<td>

[packages/react-core/src/types/message.ts:21](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L21)

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

[packages/react-core/src/types/message.ts:20](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L20)

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

[packages/react-core/src/types/message.ts:19](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L19)

</td>
</tr>
</tbody>
</table>
