# @openuidev/observability-cloud

Cloud sink for [`@openuidev/observability`](../observability). Listens to the shared event bus, selects the events worth keeping (today: settled `react-lang:stream` events), batches them, and ships them to Thesys ingest with your publishable API key. Browser-only; `init` is a no-op on the server.

## Usage

```ts
import { init } from "@openuidev/observability-cloud";

init({ apiKey: "pk-th-…" });
```

Call `init` once, as early as possible (before the first render). Re-calling with equivalent options is a no-op; different options replace the client.

### Options

| option       | default                                | notes                                                              |
| ------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `apiKey`     | —                                      | Publishable key from the Thesys console.                           |
| `endpoint`   | `https://ingest.thesys.dev/v1/events`  |                                                                    |
| `capture`    | `"full"`                               | `"minimal"` drops `response`, `message`, `errors` from each event. |
| `sampleRate` | `1`                                    | `[0, 1]`; deterministic per stream id.                             |
| `beforeSend` | —                                      | Return a modified event, or `null` to drop it.                     |
| `debug`      | `false`                                | Console diagnostics.                                               |

### Lifecycle

- `flush(timeoutMs?)` — send everything queued; resolves `true` when accepted.
- `close()` — flush and detach.

Batches flush every 5 s or 50 events, and on `pagehide` / hidden `visibilitychange` via `sendBeacon`. 429 honours `Retry-After`; other 4xx are dropped; 5xx/network retried up to 3 times. Dropped counts are reported in the next envelope's `droppedEvents`.

## Wire contract

`WireEnvelope` / `WireEvent` / `StreamWireEvent` are exported for `beforeSend` typing and server-side validation. `sdk.version` in the envelope is `SDK_VERSION` in `src/core/wire.ts` — keep it in sync with `package.json` on release (there is a test for it).

The `react-lang:stream` event constants are duplicated between this package (`src/events/stream.ts`) and `@openuidev/react-lang` (`src/hooks/streamEvent.ts`) on purpose so neither depends on the other; change both together.
