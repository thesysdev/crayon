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

`@openuidev/react-lang` ships with this package and auto-mounts the widget in development — no manual `<OpenUIDevtools />` needed. Mounting it manually still works (e.g. to customize props): only one instance ever renders, and a manually mounted instance takes precedence over the auto-mounted one.

In development, `createLibrary()` registers the live library with the widget. A row in the drawer opens **OpenUI Paste** — an editor against that library (host CSS included), with Render / Validation / Tree / JSON / Stream panels and simulated stream playback. Eject moves the same view into a separate window.

## Props

| Prop              | Default          | Description                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `enabled`         | dev-only         | Force the widget on/off.                                         |
| `position`        | `"bottom-right"` | Corner for the toggle button: `top-left`/`top-right`/`bottom-*`. |
| `maxEvents`       | `50`             | How many events to keep; oldest are dropped first.               |
| `errorsOnly`      | `true`           | Capture only error/warning events, or all.                       |
| `autoOpenOnError` | `true`           | Initial state of the drawer's "auto-open on error" checkbox.     |
| `bus`             | shared singleton | An `Observability` instance to listen to.                        |
