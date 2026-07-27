# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating button that opens a modal dialog listing the events captured by [`@openuidev/observability`](../observability) — event type, message, and a drill-in stack trace per entry.

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

| Prop         | Default          | Description                                           |
| ------------ | ---------------- | ----------------------------------------------------- |
| `enabled`    | dev-only         | Force the widget on/off.                              |
| `maxEvents`  | `50`             | How many events to keep; oldest are dropped first.    |
| `errorsOnly` | `true`           | Capture only error/warning events, or all.            |
| `bus`        | shared singleton | An `Observability` instance to listen to.             |
