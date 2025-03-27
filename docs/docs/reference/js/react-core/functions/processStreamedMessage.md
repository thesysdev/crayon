```ts
function processStreamedMessage(__namedParameters: {
  createMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
  response: Response;
  updateMessage: (message: AssistantMessage) => void;
}): Promise<void>;
```

Defined in: [js/packages/react-core/src/stream/processStreamedMessage.ts:16](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/stream/processStreamedMessage.ts#L16)

## Parameters

### \_\_namedParameters

#### createMessage

(`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`

#### deleteMessage

(`messageId`: `string`) => `void`

#### response

`Response`

#### updateMessage

(`message`: [`AssistantMessage`](../type-aliases/AssistantMessage.md)) => `void`

## Returns

`Promise`\<`void`\>
