# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating button that opens a left side drawer listing the events captured by [`@openuidev/observability`](../observability) — level, a one-line summary, and a drill-in stack trace per entry.

## Usage

```tsx
import { OpenUIDevtools } from "@openuidev/devtools";

function App() {
  return (
    <>
      {/* your app */}
      <OpenUIDevtools />
    </>
  );
}
```

The widget renders nothing in production builds (`NODE_ENV === "production"`) unless `enabled` is passed explicitly.

## Props

| Prop              | Default          | Description                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `enabled`         | dev-only         | Force the widget on/off.                                         |
| `position`        | `"bottom-right"` | Corner for the toggle button: `top-left`/`top-right`/`bottom-*`. |
| `maxEvents`       | `50`             | How many events to keep; oldest are dropped first.               |
| `errorsOnly`      | `true`           | Capture only error/warning events, or all.                       |
| `autoOpenOnError` | `true`           | Initial state of the drawer's "auto-open on error" checkbox.     |
| `bus`             | shared singleton | An `Observability` instance to listen to.                        |

## Telemetry

This package sends pseudonymous installation telemetry during `postinstall`.
Disable it with either environment variable:

```bash
OPENUI_TELEMETRY_DISABLED=1
DO_NOT_TRACK=1
```

Print the payload to standard output without sending it:

```bash
OPENUI_TELEMETRY_DEBUG=1
```
