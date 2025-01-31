```ts
type ThreadState = {
  error: Error | null | undefined;
  isRunning: boolean;
  messages: Message[];
  responseTemplates: {};
};
```

Represents the state of a thread

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

`error`

</td>
<td>

`Error` \| `null` \| `undefined`

</td>
<td>

&hyphen;

</td>
<td>

[packages/react-core/src/types/chatManager.ts:37](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L37)

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

Indicates if the thread is currently processing and controls should be disabled

</td>
<td>

[packages/react-core/src/types/chatManager.ts:35](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L35)

</td>
</tr>
<tr>
<td>

`messages`

</td>
<td>

[`Message`](Message.md)[]

</td>
<td>

&hyphen;

</td>
<td>

[packages/react-core/src/types/chatManager.ts:36](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L36)

</td>
</tr>
<tr>
<td>

`responseTemplates`

</td>
<td>

\{\}

</td>
<td>

&hyphen;

</td>
<td>

[packages/react-core/src/types/chatManager.ts:38](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L38)

</td>
</tr>
</tbody>
</table>

## Defined in

[packages/react-core/src/types/chatManager.ts:33](https://github.com/thesysdev/crayonai/blob/c138be830e4251fbc51e4da049a797e65138f6cd/frontend-sdk/packages/react-core/src/types/chatManager.ts#L33)
