```ts
function processStreamedMessage(__namedParameters: {
  createMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
  response: Response;
  updateMessage: (message: AssistantMessage) => void;
}): Promise<void>;
```

Defined in: [packages/react-core/src/utils/processStreamedMessage.ts:6](https://github.com/thesysdev/crayon/blob/808d53cdbf57dfd9386204060478ba44146d3921/js/packages/react-core/src/utils/processStreamedMessage.ts#L6)

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
