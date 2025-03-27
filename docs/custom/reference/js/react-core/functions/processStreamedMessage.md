A utility function that helps process a streamed assistant message from the server. It takes functions to create, update and delete messages,
and calls them as necessary on the required message when a streamed response is received. Generally helpful when defining the `processMessage`
function in [`ThreadManager`](../type-aliases/ThreadManager.md) using [`useThreadManager`](../functions/useThreadManager.md).

## Example

```ts
await processStreamedMessage({
  response,
  createMessage: threadManager.appendMessages,
  updateMessage: threadManager.updateMessage,
  deleteMessage: threadManager.deleteMessage,
});
```
