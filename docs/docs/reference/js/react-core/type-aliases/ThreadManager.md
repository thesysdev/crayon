The Thread Manager is an entity that encapsulates the [`ThreadState`](./ThreadState.md) and actions ([`ThreadActions`](./ThreadActions.md)) that help modify the state.
It can be passed to the `ChatProvider` or the `CrayonChat` component to dictate how a thread should be managed, and what APIs should be called on each event.

---

```ts
type ThreadManager = ThreadState & ThreadActions;
```

Defined in: [js/packages/react-core/src/types/chatManager.ts:65](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L65)
