```ts
type UserMessage = common & {
  role: "user";
 } & 
  | {
  message: string;
  type: "prompt";
 }
  | {
  actionDetails: string;
  context: {
     formState: Record<string, any>;
    };
  message: string;
  type: "action";
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

`role`

</td>
<td>

`"user"`

</td>
<td>

[packages/react-core/src/types/message.ts:7](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/message.ts#L7)

</td>
</tr>
</tbody>
</table>

## Defined in

[packages/react-core/src/types/message.ts:6](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/message.ts#L6)
