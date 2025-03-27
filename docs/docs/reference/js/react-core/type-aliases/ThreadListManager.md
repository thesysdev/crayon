The Thread List Manager is an entity that encapsulates the [`ThreadListState`](./ThreadListState.md) and actions ([`ThreadListActions`](./ThreadListActions.md)) that help modify the state.
It can be passed to the `ChatProvider` or the `CrayonChat` component to dictate how a thread list should be managed, and what APIs should be called on each event.

---

```ts
type ThreadListManager = ThreadListState & ThreadListActions;
```

Defined in: [js/packages/react-core/src/types/chatManager.ts:109](https://github.com/thesysdev/crayon/blob/main/js/packages/react-core/src/types/chatManager.ts#L109)
