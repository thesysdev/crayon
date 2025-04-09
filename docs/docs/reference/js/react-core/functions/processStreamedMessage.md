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

---

```ts
function processStreamedMessage(__namedParameters: {
  createMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
  response: Response;
  updateMessage: (message: AssistantMessage) => void;
}): Promise<void | AssistantMessage>;
```

Defined in: [js/packages/react-core/src/stream/processStreamedMessage.ts:29](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/stream/processStreamedMessage.ts#L29)

## Parameters

### \_\_namedParameters

#### createMessage

(`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`

A function that creates a new assistant message in the thread

#### deleteMessage

(`messageId`: `string`) => `void`

A function that deletes an assistant message from the thread

#### response

`Response`

#### updateMessage

(`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`

A function that updates an existing assistant message in the thread

## Returns

`Promise`\<`void` \| [`AssistantMessage`](../type-aliases/AssistantMessage.md)\>
