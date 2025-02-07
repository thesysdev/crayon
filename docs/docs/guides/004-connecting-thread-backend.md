# Connecting to the thread backend

To use the thread runtime in production, you'll need to connect your
thread backend to Crayon using the `ThreadListManager` and `ThreadManager` interfaces.

## ThreadListManager

Thread List Manager is used to handle the CRUDL operations on the thread list.
```ts
const threadListManager = useThreadListManager({...});
```

## ThreadManager

```ts
const threadManager = useThreadManager({...});
```

## Integration

```tsx
import { CrayonChat } from "@crayonai/react-ui";

export default function App() {
  return (
    <CrayonChat {...crayonChatProps}
      threadListManager={threadListManager}
      threadManager={threadManager} />
  );
}
```

:::note
See the [ThreadManager](/docs/reference/js/react-core/type-aliases/ThreadManager) and [ThreadListManager](/docs/reference/js/react-core/type-aliases/ThreadListManager)
for more information.
:::
