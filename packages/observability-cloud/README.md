# @openuidev/observability-cloud

Official SDK for OpenUI observability. Sends render events from your app to the Thesys console so you can track request volume, errors and reliability.

## Install

```bash
npm i @openuidev/observability-cloud
```

## Setup

Generate a client API key at [console.thesys.dev/client-api-keys](https://console.thesys.dev/client-api-keys), then initialise the SDK once at your app's entry point:

```ts
import * as Observability from "@openuidev/observability-cloud";

Observability.init({ apiKey: "pk-th-…" });
```

`init` is safe to call from shared client/server code — it is a no-op when `window` is not defined.

## API reference

### `Observability.init(options)`

| option       | type                    | default                               | description                                                                                                                                                  |
| ------------ | ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiKey`     | `string`                | —                                     | Your client API key (`pk-th-…`). Required.                                                                                                                   |
| `capture`    | `"full"` \| `"minimal"` | `"full"`                              | `"full"` logs complete event data for the richest debugging in the console. `"minimal"` is a privacy-first mode that strips event data that may include PII. |
| `sampleRate` | `number`                | `1`                                   | Fraction of renders to send, `0`–`1`. Sampling is deterministic per render, so all events for one render are kept or dropped together.                       |
| `endpoint`   | `string`                | `https://ingest.thesys.dev/v1/events` | Override the ingest URL (testing).                                                                                                                           |
| `debug`      | `boolean`               | `false`                               | Log SDK diagnostics to the console.                                                                                                                          |

Calling `init` again with the same options is a no-op; calling it with different options replaces the previous configuration.

### `Observability.flush(timeoutMs?)`

Events are batched and sent in the background. Call `flush` to send everything queued now — for example before a hard navigation. Resolves to `true` once the batch is accepted, or `false` if it could not be sent within `timeoutMs` (default 10 s).

### `Observability.close()`

Flushes queued events and stops sending. Call `init` again to resume.
