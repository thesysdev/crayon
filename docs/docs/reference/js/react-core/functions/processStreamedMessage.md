```ts
function processStreamedMessage(__namedParameters: {
  createMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
  response: Response;
  updateMessage: (message: AssistantMessage) => void;
}): Promise<void>;
```

Defined in: [packages/react-core/src/stream/processStreamedMessage.ts:16](https://github.com/thesysdev/crayon/blob/d0d1410263fe0f83e2b52bc1d37c0693717089fe/js/packages/react-core/src/stream/processStreamedMessage.ts#L16)

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
