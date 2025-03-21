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
      }
  )[];
  role: "assistant";
};
```

Defined in: [packages/react-core/src/types/message.ts:25](https://github.com/thesysdev/crayon/blob/764dfdfef65ac5751288cdbd014d2017f4c5dc0d/js/packages/react-core/src/types/message.ts#L25)

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
