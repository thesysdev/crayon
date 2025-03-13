```ts
type AssistantMessage = common & {
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
    })[];
  role: "assistant";
};
```

Defined in: [packages/react-core/src/types/message.ts:24](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L24)

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

[packages/react-core/src/types/message.ts:26](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L26)

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

[packages/react-core/src/types/message.ts:27](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L27)

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

[packages/react-core/src/types/message.ts:25](https://github.com/thesysdev/crayon/blob/1acfae208f58ec7415d64dc97edfea87130a9e7e/js/packages/react-core/src/types/message.ts#L25)

</td>
</tr>
</tbody>
</table>
