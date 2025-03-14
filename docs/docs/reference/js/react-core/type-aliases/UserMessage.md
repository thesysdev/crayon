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

Defined in: [packages/react-core/src/types/message.ts:22](https://github.com/thesysdev/crayon/blob/42bf9c916a4f4ba514db529a08f9461bfbbad8ca/js/packages/react-core/src/types/message.ts#L22)

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
