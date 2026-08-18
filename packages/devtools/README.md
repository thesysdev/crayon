# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating button that opens a side drawer listing the events captured by [`@openuidev/observability`](../observability) — a severity icon, a one-line summary, and a drill-in stack trace per entry. When errors come in, the button itself turns red and shows the count.

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

**OpenUI Inspect** (the event drawer) and **OpenUI Debug** are independent tools on independent trays. Debug docks beside Inspect rather than growing out of it, and each closes on its own: dismissing Debug leaves the event list where it was, and vice versa.

In development, `createLibrary()` registers the live library with the widget. The **OpenUI Debug** banner at the bottom of the Inspect tray opens an editor against that library (host CSS included), with Render / Validation / Tree / JSON / Stream panels and simulated stream playback. A stream event's **Debug** button opens its response the same way. Eject moves the view into a separate window. The first visit opens a short step-by-step guide (also on **Help**); dismissing it is remembered.

Display filters ("auto-open on error", "errors only") and the theme live behind the gear in the drawer header. The theme is Light or Dark, chosen manually and remembered across reloads: nothing is auto-detected from the host page or the OS, and it styles the devtools chrome only — never your app. The floating Shiro toggle stays dark so the branded mark stays readable.

## Props

| Prop              | Default          | Description                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `enabled`         | dev-only         | Force the widget on/off.                                         |
| `position`        | `"bottom-right"` | Corner for the toggle button: `top-left`/`top-right`/`bottom-*`. |
| `maxEvents`       | `50`             | How many events to keep; oldest are dropped first.               |
| `errorsOnly`      | `true`           | Capture only error/warning events, or all.                       |
| `autoOpenOnError` | `true`           | Initial state of the "auto-open on error" setting.               |
| `theme`           | `"light"`        | Initial widget chrome theme: `"light"` or `"dark"` (Settings overrides). |
| `bus`             | shared singleton | An `Observability` instance to listen to.                        |
