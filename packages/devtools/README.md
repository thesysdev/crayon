# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating button that opens a side drawer listing the events captured by [`@openuidev/observability`](../observability) — a severity icon, a one-line summary, and an expandable stack trace with copy on the same card. When errors come in, the button itself turns red and shows the count.

## Usage

If your app uses `@openuidev/react-lang` (Agent Interface, the `react-ui` CLI templates), the widget shows up automatically in `next dev` / any dev server — **nothing to add to `package.json`**. `react-lang` fetches this package's browser build from a CDN at runtime, development-only; a production build never fetches it and ships nothing:

```
https://cdn.jsdelivr.net/npm/@openuidev/devtools@0/dist/devtools.browser.js
```

Publishing a new `0.x` of this package updates the widget everywhere on next reload — no lockfile bump needed downstream. The URL is pinned to the protocol major (`@0`), not `@latest`, so a breaking change to `mount()`'s contract ships as `@1` instead of silently reaching every app.

The widget renders nothing in production builds (`NODE_ENV === "production"`) unless `enabled` is passed explicitly.

### Pin a version, customize props, or go offline

Install the package and render `<OpenUIDevtools />` yourself. A manually mounted instance always wins over the CDN auto-mount — only one instance ever renders:

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

Use this to pin an exact version, pass custom props, or skip the CDN entirely — airgapped networks, strict CSP.

### Not using react-lang (headless, Vue, custom entry)

The auto-mount above is a `react-lang` side effect only; other runtimes don't get a surprise widget. Opt in with three lines, after your app has created the observability bus (`import "@openuidev/observability"` — the CDN widget looks the bus up rather than creating its own):

```ts
import React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import "@openuidev/observability"; // must run first — creates the bus

if (process.env.NODE_ENV === "development") {
  const { mountOpenUIDevtools } = await import(
    "https://cdn.jsdelivr.net/npm/@openuidev/devtools@0/dist/devtools.browser.js"
  );
  mountOpenUIDevtools({ React, createRoot, createPortal });
}
```

Pass `loadReactLang: () => import("@openuidev/react-lang")` to also enable **OpenUI Paste**; without it the drawer still shows the event list (this is the default for `react-headless` apps). Vue and Svelte apps can't run Paste's React Renderer, so only the event list makes sense there.

### CSP

`script-src` must allow `cdn.jsdelivr.net` for the auto-mount fetch to succeed. If it's blocked, the widget silently fails to appear — the rest of the app is unaffected.

### Override the URL, or turn it off

```ts
// Point at a local build while developing the widget itself:
globalThis.__OPENUI_DEVTOOLS_URL = "http://localhost:5173/dist/devtools.browser.js";
// or: localStorage.setItem("openuiDevtoolsUrl", "...")

// Skip the fetch entirely:
globalThis.__OPENUI_DEVTOOLS = false;
```

In development, `createLibrary()` registers the live library with the widget. The **OpenUI Paste** banner at the bottom of the drawer widens the drawer into an editor against that library (host CSS included), with Render / Validation / Tree / JSON / Stream panels and simulated stream playback. A stream event's **Debug** button opens its response the same way. Eject moves the view into a separate window. The first visit opens a short step-by-step guide (also on **Help**); dismissing it is remembered.

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
