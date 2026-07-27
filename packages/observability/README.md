# @openuidev/observability

Framework-agnostic observability event bus for OpenUI. Emit and listen to events — fetch calls, LLM calls, renderer outcomes, whatever your app cares about. Zero dependencies, safe on server and browser. A single shared instance per app.

## Usage

```ts
import { observability, toErrorInfo } from "@openuidev/observability";

// Listen to one event type — returns a remover.
const remove = observability.listen("llm:error", (event) => {
  console.error(event.detail);
});
remove();

// Listen to everything — the attachment point for sinks (Sentry, Datadog, ...).
const detach = observability.listenAll((event) => {
  if (event.severity === "error") {
    // forward event.type and event.detail to your service
  }
});
```

## Emitting

The instance is **itself callable** to emit an event with severity shortcuts:

```ts
// Call the bus to emit any event; severity is inferred from the type suffix.
observability("renderer:error", { component: "Chart", error: toErrorInfo(err) });

// Severity shortcuts:
observability.error("llm:timeout", { requestId, message: "timed out" });
observability.warn("chart:overflow", { points: 1200 });
observability.info("route:change", { to: "/settings" });

// App-specific events are just a call with your own type:
observability("myapp:cache-miss", { key: "products:featured" });
observability("checkout:step", { step: 2 }, { severity: "warning" });
```

## The event envelope

Every listener receives the same envelope, generic over the payload:

```ts
interface ObservabilityEvent<TDetail = unknown> {
  type: string; // e.g. "fetch:response", "renderer:error"
  severity: "info" | "warning" | "error"; // derived from the type suffix by default
  timestamp: number; // ms since epoch
  detail: TDetail; // event-specific payload
}
```

`severity` defaults from the type suffix — `*:error` → `error`, `*:warning` → `warning`, else `info` — and can be overridden per emit via the `{ severity }` option (that's all the severity shortcuts do).

## Errors

Normalize any thrown value into the fixed error shape with `toErrorInfo(value)`, then carry it under `detail.error` on `*:error` events:

```ts
interface ObservabilityErrorInfo {
  name?: string; // e.g. "TypeError"
  message: string;
  stack?: string;
  cause?: unknown; // the original thrown value
}
```

## Event name conventions

Event types are namespaced strings — the bus doesn't restrict them. Recommended names for OpenUI apps:

| Event type                             | Suggested detail fields                              |
| -------------------------------------- | ---------------------------------------------------- |
| `fetch:request` / `response` / `error` | `requestId`, `url`, `method`, `status`, `durationMs` |
| `llm:request` / `response` / `error`   | `requestId`, `target` (model/endpoint), `status`     |
| `renderer:success` / `error`           | `component`, `code`, `statementId`, `hint`           |
| `tool:call` / `result` / `error`       | `toolName`, `statementId`, `args`, `durationMs`      |

Use a shared `requestId` to correlate the request/response/error events of one call.
