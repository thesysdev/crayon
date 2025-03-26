```ts
function processStreamedMessage(__namedParameters: {
  createMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
  response: Response;
  updateMessage: (message: AssistantMessage) => void;
}): Promise<void>;
```

Defined in: [packages/react-core/src/stream/processStreamedMessage.ts:16](https://github.com/thesysdev/crayon/blob/cbecbe8e16fae54d735cb8e1fe31b72f51300d52/js/packages/react-core/src/stream/processStreamedMessage.ts#L16)

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
