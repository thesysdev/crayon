```ts
type UserMessage = {
  id: string;
  isVisuallyHidden: boolean;
} & {
  role: "user";
} & {
  context: JSONValue[];
  message: string;
  type: "prompt";
};
```

Defined in: [packages/react-core/src/types/message.ts:14](https://github.com/thesysdev/crayon/blob/764dfdfef65ac5751288cdbd014d2017f4c5dc0d/js/packages/react-core/src/types/message.ts#L14)

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

### role

```ts
role: "user";
```

## Type declaration

### context?

```ts
optional context: JSONValue[];
```

### message?

```ts
optional message: string;
```

### type

```ts
type: "prompt";
```
