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

&hyphen;

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

`useThreadActions` allows you to modify the [ThreadState](type-aliases/ThreadState.md) by providing access to [ThreadActions](type-aliases/ThreadActions.md) which contains methods to modify the state.

</td>
</tr>
<tr>
<td>

[useThreadListActions](functions/useThreadListActions.md)

</td>
<td>

`useThreadListActions` allows you to modify the [ThreadListState](type-aliases/ThreadListState.md) by providing access to [ThreadListActions](type-aliases/ThreadListActions.md) which contains methods to modify the state.

</td>
</tr>
<tr>
<td>

[useThreadListManager](functions/useThreadListManager.md)

</td>
<td>

`useThreadListManager` takes the necessary arguments and helps create a [ThreadListManager](type-aliases/ThreadListManager.md) instance. This instance is necessary to define how a thread list should
be fetched, updated, deleted, and selected and which backend APIs should be called at any of these events or actions.

</td>
</tr>
<tr>
<td>

[useThreadListState](functions/useThreadListState.md)

</td>
<td>

`useThreadListState` allows you to access the [ThreadListState](type-aliases/ThreadListState.md). This is helpful for multiple reasons, including but not limited to:

- You can use the state to render the thread list UI
- You can use the state to trigger actions on the thread list

</td>
</tr>
<tr>
<td>

[useThreadManager](functions/useThreadManager.md)

</td>
<td>

`useThreadManager` takes the necessary arguments and helps create a [ThreadManager](type-aliases/ThreadManager.md) instance. This instance is necessary to define how a thread should
be loaded and how a message in the thread should be processed or updated. This can be useful for multiple reasons, including but not limited to:

- The hook makes it incredibly easy to manage the thread and does not require you to implement a thread manager from scratch manually
- You can use the thread manager to load a thread from a backend API
- You can use the thread manager to process a message and request the agent for the response
- You can use the thread manager to update a message

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

`useThreadState` allows you to access the [ThreadState](type-aliases/ThreadState.md). This is helpful for multiple reasons, including but not limited to:

- You can use the state to render the thread UI
- You can use the state to trigger actions on the thread

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

A type that represents a message sent by the assistant / agent

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

Contains all of the information required to create a message. Usually passed to the [ThreadManager](type-aliases/ThreadManager.md)'s `processMessage` method.

</td>
</tr>
<tr>
<td>

[Message](type-aliases/Message.md)

</td>
<td>

Represents a message in a [Thread](type-aliases/Thread.md). See [UserMessage](type-aliases/UserMessage.md) and [AssistantMessage](type-aliases/AssistantMessage.md) for more information.

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

Actions available for managing the state of a thread

</td>
</tr>
<tr>
<td>

[ThreadListActions](type-aliases/ThreadListActions.md)

</td>
<td>

Actions available for managing the state of a thread list

</td>
</tr>
<tr>
<td>

[ThreadListManager](type-aliases/ThreadListManager.md)

</td>
<td>

&hyphen;

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

&hyphen;

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

A type that represents a message sent by the user

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
