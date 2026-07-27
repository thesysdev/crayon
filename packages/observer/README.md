# @openuidev/observer

Framework-agnostic observability event bus for OpenUI. Publish and listen to events — fetch calls, LLM calls, renderer outcomes, tool invocations — through one fixed, generic event interface. Zero dependencies, safe on server and browser.

## Usage

```ts
import { observer, toErrorInfo } from "@openuidev/observer";

// Listen to one event type — returns a remover.
const remove = observer.subscribe("llm:error", (event) => {
  console.error(event.detail);
});
remove();

// Listen to everything — the attachment point for third-party sinks (Sentry, Datadog, ...).
const detach = observer.subscribeAll((event) => {
  if (event.severity === "error") {
    // forward event.type and event.detail to your service
  }
});

// Publish events.
observer.publish("renderer:error", {
  component: "Chart",
  error: toErrorInfo(caughtError),
});
```

## The fixed event interface

Every listener receives the same envelope, generic over the payload:

```ts
interface ObserverEvent<TDetail = unknown> {
  type: string; //    e.g. "fetch:response", "renderer:error"
  severity: "info" | "warning" | "error"; // derived from the type suffix by default
  timestamp: number; // ms since epoch
  detail: TDetail; //  event-specific payload
}
```

Errors are normalized to a fixed shape — build one from any thrown value with `toErrorInfo(value)`:

```ts
interface ObserverErrorInfo {
  name?: string; //   e.g. "TypeError"
  message: string;
  stack?: string;
  cause?: unknown; // the original thrown value
}
```

## Event conventions

Event types are namespaced strings — the bus doesn't restrict them. Recommended names for OpenUI apps:

| Event type                             | Suggested detail fields                              |
| -------------------------------------- | ---------------------------------------------------- |
| `fetch:request` / `response` / `error` | `requestId`, `url`, `method`, `status`, `durationMs` |
| `llm:request` / `response` / `error`   | `requestId`, `target` (model/endpoint), `status`     |
| `renderer:success` / `error`           | `component`, `code`, `statementId`, `hint`           |
| `tool:call` / `result` / `error`       | `toolName`, `statementId`, `args`, `durationMs`      |

Conventions:

- `*:error` details carry `{ error: ObserverErrorInfo }`.
- Use a shared `requestId` to correlate the request/response/error events of one call.
- `severity` defaults from the type suffix (`*:error` → error, `*:warning` → warning, else info); pass `{ severity }` in publish options to override.

## DOM CustomEvent bridge

In browsers, every event is also dispatched as a `CustomEvent` named `openui_observer:event` on `globalThis`, so code outside this module graph can listen with the same interface:

```ts
import { OBSERVER_EVENT_NAME, type ObserverEvent } from "@openuidev/observer";

window.addEventListener(OBSERVER_EVENT_NAME, (e) => {
  const event = (e as CustomEvent<ObserverEvent>).detail;
});
```

## Isolated instances

`observer` is a shared singleton. Call `createObserver()` if you need an isolated bus (e.g. per test or per embedded widget).
