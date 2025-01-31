```ts
type Thread = {
  createdAt: Date;
  isRunning: boolean;
  threadId: string;
  title: string;
};
```

Represents a chat thread

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

`createdAt`

</td>
<td>

`Date`

</td>
<td>

Creation timestamp

</td>
<td>

[packages/react-core/src/types/chatManager.ts:13](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L13)

</td>
</tr>
<tr>
<td>

`isRunning`?

</td>
<td>

`boolean`

</td>
<td>

Indicates if the thread is currently processing

</td>
<td>

[packages/react-core/src/types/chatManager.ts:15](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L15)

</td>
</tr>
<tr>
<td>

`threadId`

</td>
<td>

`string`

</td>
<td>

Unique identifier for the thread

</td>
<td>

[packages/react-core/src/types/chatManager.ts:9](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L9)

</td>
</tr>
<tr>
<td>

`title`

</td>
<td>

`string`

</td>
<td>

Title of the thread

</td>
<td>

[packages/react-core/src/types/chatManager.ts:11](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L11)

</td>
</tr>
</tbody>
</table>

## Defined in

[packages/react-core/src/types/chatManager.ts:7](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L7)
