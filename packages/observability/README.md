# @openuidev/observability

Framework-agnostic observability event bus for OpenUI. Emit and listen to events at a level (`info` / `warning` / `error`), each carrying a typed `detail` payload. Zero dependencies, safe on server and browser. A single shared instance per app.

## Usage

```ts
import { observability, toErrorInfo } from "@openuidev/observability";

// Listen to a level — every event at that level.
const remove = observability.listen("error", (event) => {
  console.error(event.detail);
});
remove();

// Or several levels at once.
observability.listen(["warning", "error"], (event) => report(event));

// Listen to everything — the attachment point for sinks (Sentry, Datadog, ...).
const detach = observability.listenAll((event) => {
  if (event.level === "error") {
    // forward event.detail to your service
  }
});
```

## Emitting

The instance is **itself callable** — `observability(level, detail)` — with level shortcuts hanging off it, like a toast library:

```ts
// Call the bus with an explicit level and a payload.
observability("error", { kind: "renderer:error", component: "Chart", error: toErrorInfo(err) });

// Level shortcuts (like toast.error / toast.warning / toast.info):
observability.error({ kind: "llm:timeout", requestId, message: "timed out" });
observability.warn({ kind: "chart:overflow", component: "Chart", points: 1200 });
observability.info({ kind: "route:change", to: "/settings" });
```

## The event envelope

Every listener receives the same envelope:

```ts
interface ObservabilityEvent {
  level: "info" | "warning" | "error";
  timestamp: number; // ms since epoch
  detail: ObservabilityDetail;
}
```

## The detail

`detail` is a typed shape, not free-form: a required `kind` descriptor plus optional `message` / `error`, and any extra fields you need.

```ts
interface ObservabilityDetail {
  kind: string; //                  required descriptor, e.g. "fetch:error"
  message?: string; //              optional human-readable message
  error?: ObservabilityErrorInfo; // present on failures; build with toErrorInfo()
  [key: string]: unknown; //        extra structured fields — ids, timings, urls
}
```

Build the `error` field from any thrown value with `toErrorInfo(value)`:

```ts
interface ObservabilityErrorInfo {
  name?: string; // e.g. "TypeError"
  message: string;
  stack?: string;
  cause?: unknown; // the original thrown value
}
```
