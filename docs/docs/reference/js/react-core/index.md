# Core Framework (`react-core`)

This package provides the core framework and hooks for managing state and agents.

## Components

<table>
<thead>
<tr>
<th>Function</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

[ChatProvider](functions/ChatProvider.md)

</td>
<td>

**Remarks**

ChatProvider is a React component that provides chat management context to its children.
It serves as the top-level provider for thread and thread list management functionality.

**Example**

```tsx
<ChatProvider
  threadManager={myThreadManager}
  threadListManager={myThreadListManager}
>
  <App />
</ChatProvider>
```

</td>
</tr>
<tr>
<td>

[MessageProvider](functions/MessageProvider.md)

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

## Contexts

<table>
<thead>
<tr>
<th>Function</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

[MessageContext](functions/MessageContext.md)

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

## Hooks

<table>
<thead>
<tr>
<th>Function</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

[useMessage](functions/useMessage.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[useThreadActions](functions/useThreadActions.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[useThreadListActions](functions/useThreadListActions.md)

</td>
<td>

**Remarks**

useThreadListActions

</td>
</tr>
<tr>
<td>

[useThreadListManager](functions/useThreadListManager.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[useThreadListState](functions/useThreadListState.md)

</td>
<td>

**Remarks**

useThreadListState

</td>
</tr>
<tr>
<td>

[useThreadManager](functions/useThreadManager.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[useThreadManagerSelector](functions/useThreadManagerSelector.md)

</td>
<td>

**Remarks**

useThreadManager

</td>
</tr>
<tr>
<td>

[useThreadState](functions/useThreadState.md)

</td>
<td>

**Remarks**

useThreadState

</td>
</tr>
</tbody>
</table>

## Types

<table>
<thead>
<tr>
<th>Name</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

[ResponseTemplate](interfaces/ResponseTemplate.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[AssistantMessage](type-aliases/AssistantMessage.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[ChatManager](type-aliases/ChatManager.md)

</td>
<td>

Main chat manager combining thread and thread list management

</td>
</tr>
<tr>
<td>

[CreateMessage](type-aliases/CreateMessage.md)

</td>
<td>

Represents a message being created, with an optional ID

</td>
</tr>
<tr>
<td>

[Message](type-aliases/Message.md)

</td>
<td>

See [UserMessage](type-aliases/UserMessage.md) and [AssistantMessage](type-aliases/AssistantMessage.md) for more information.

</td>
</tr>
<tr>
<td>

[Thread](type-aliases/Thread.md)

</td>
<td>

Represents a chat thread

</td>
</tr>
<tr>
<td>

[ThreadActions](type-aliases/ThreadActions.md)

</td>
<td>

Actions available for managing a thread

**Template**

The message type used in the thread

</td>
</tr>
<tr>
<td>

[ThreadListActions](type-aliases/ThreadListActions.md)

</td>
<td>

Actions available for managing the thread list

</td>
</tr>
<tr>
<td>

[ThreadListManager](type-aliases/ThreadListManager.md)

</td>
<td>

Combines thread list state and actions

</td>
</tr>
<tr>
<td>

[ThreadListState](type-aliases/ThreadListState.md)

</td>
<td>

Represents the state of the thread list

</td>
</tr>
<tr>
<td>

[ThreadManager](type-aliases/ThreadManager.md)

</td>
<td>

Combines thread state and actions

**Template**

The message type used in the thread

</td>
</tr>
<tr>
<td>

[ThreadState](type-aliases/ThreadState.md)

</td>
<td>

Represents the state of a thread

</td>
</tr>
<tr>
<td>

[UserMessage](type-aliases/UserMessage.md)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

[UseThreadListManagerParams](type-aliases/UseThreadListManagerParams.md)

</td>
<td>

Parameters to be passed to the [useThreadListManager](functions/useThreadListManager.md) hook

</td>
</tr>
<tr>
<td>

[UseThreadManagerParams](type-aliases/UseThreadManagerParams.md)

</td>
<td>

Parameters to be passed to the [useThreadManager](functions/useThreadManager.md) hook

</td>
</tr>
</tbody>
</table>

## Utilities

<table>
<thead>
<tr>
<th>Function</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

[processStreamedMessage](functions/processStreamedMessage.md)

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>
