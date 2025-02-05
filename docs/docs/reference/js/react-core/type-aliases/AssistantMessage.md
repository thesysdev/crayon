```ts
type AssistantMessage = common & {
  context: {
     uiState: Record<string, any>;
    };
  message: string;
  responseTemplate: {
     name: string;
     templateProps: any;
    };
  role: "assistant";
};
```

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

\{
  `uiState`: `Record`\<`string`, `any`\>;
 \}

</td>
<td>

[packages/react-core/src/types/message.ts:25](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/message.ts#L25)

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

[packages/react-core/src/types/message.ts:28](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/message.ts#L28)

</td>
</tr>
<tr>
<td>

`responseTemplate`?

</td>
<td>

\{
  `name`: `string`;
  `templateProps`: `any`;
 \}

</td>
<td>

[packages/react-core/src/types/message.ts:29](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/message.ts#L29)

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

[packages/react-core/src/types/message.ts:24](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/message.ts#L24)

</td>
</tr>
</tbody>
</table>

## Defined in

[packages/react-core/src/types/message.ts:23](https://github.com/thesysdev/crayonai/blob/868f459d859250eef3283635b1127c3c68c35546/frontend-sdk/packages/react-core/src/types/message.ts#L23)
