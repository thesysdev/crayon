# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating badge that expands into a panel listing the errors captured by [`@openuidev/observer`](../observer) — event type, error message, and stack trace per entry.

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
| `bus`        | shared singleton | A custom `Observer` instance from `createObserver()`. |
