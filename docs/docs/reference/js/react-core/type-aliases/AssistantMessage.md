```ts
type AssistantMessage = {
  id: string;
  isVisuallyHidden: boolean;
 } & {
  context: JSONValue[];
  message: (
     | {
     text: string;
     type: "text";
    }
     | {
     name: string;
     templateProps: any;
     type: "template";
    })[];
  role: "assistant";
};
```

Defined in: [packages/react-core/src/types/message.ts:33](https://github.com/thesysdev/crayon/blob/42bf9c916a4f4ba514db529a08f9461bfbbad8ca/js/packages/react-core/src/types/message.ts#L33)

## Type declaration

### id

```ts
id: string;
```

### isVisuallyHidden?

```ts
optional isVisuallyHidden: boolean;
```

## Type declaration

### context?

```ts
optional context: JSONValue[];
```

### message?

```ts
optional message: (
  | {
  text: string;
  type: "text";
 }
  | {
  name: string;
  templateProps: any;
  type: "template";
 })[];
```

### role

```ts
role: "assistant";
```
