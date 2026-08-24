# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating button that opens **OpenUI Inspect**, listing the events captured by [`@openuidev/observability`](../observability).

## Usage

If your app uses `@openuidev/react-lang`, the widget shows up automatically. `react-lang` loads this package's thin helper and fetches the browser build from a CDN (pinned to major `0`).

You can also mount it yourself — the npm package is a thin wrapper that still fetches the CDN widget and injects your app's React / ReactDOM / react-lang. All props are forwarded into that widget:

```tsx
import { OpenUIDevtools } from "@openuidev/devtools";

function App() {
  return (
    <>
      {/* your app */}
      <OpenUIDevtools theme="dark" position="bottom-left" maxEvents={100} />
    </>
  );
}
```

| Prop | Default | Notes |
| --- | --- | --- |
| `cdnMajor` | `@latest` | Pass `0` (etc.) to pin `https://cdn.jsdelivr.net/npm/@openuidev/devtools@0/...` |
| `theme`, `position`, `maxEvents`, `errorsOnly`, `autoOpenOnError`, `enabled` | see below | Forwarded into the CDN widget as-is |

A manually mounted instance always wins over the auto-mount — only one instance ever renders.

Publishing a new version of this package updates the CDN file on jsDelivr automatically (no separate CDN setup). The browser build is `dist/devtools.browser.js` inside the published tarball.

The widget renders nothing in production builds (`NODE_ENV === "production"`) unless `enabled` is passed explicitly.

### CSP

`script-src` must allow `cdn.jsdelivr.net` for the fetch to succeed. If it's blocked, the widget silently fails to appear — the rest of the app is unaffected.

In development, `createLibrary()` registers the live library with the widget. A stream event's **Debug** button opens **OpenUI Debug** in its own tray — an editor against that library (host CSS included), with Render / Validation / Tree / JSON / Stream panels and simulated stream playback.

Debug renders through the host's own `Renderer`. Its previews stay off the event bus so a Stream replay does not append cards to Inspect.

## Props

| Prop              | Default          | Description                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `enabled`         | dev-only         | Force the widget on/off.                                         |
| `position`        | `"bottom-right"` | Corner for the toggle button: `top-left`/`top-right`/`bottom-*`. |
| `maxEvents`       | `50`             | How many events to keep; oldest are dropped first.               |
| `errorsOnly`      | `true`           | Capture only error/warning events, or all.                       |
| `autoOpenOnError` | `true`           | Initial state of the "auto-open on error" setting.               |
| `theme`           | `"light"`        | Initial widget chrome theme: `"light"` or `"dark"` (Settings overrides). |
| `cdnMajor`        | `@latest`        | Pin the CDN package major (`0` → `@0`). Omit for `@latest`.      |
