/**
 * Auto-mounts the OpenUI Inspect widget in development.
 *
 * This module runs as a top-level side effect when the web entry is loaded in
 * a browser. In production builds the whole block is dead-code-eliminated by
 * the consumer's bundler (the NODE_ENV condition folds to false), so
 * `react-dom` / `react-dom/client` never enter the production graph, and
 * nothing is fetched. The React Native entry (index.native.ts) never imports
 * this module.
 *
 * This module is inlined into the web entry (dist/index.*), which is listed
 * in package.json's `sideEffects` so bundlers preserve the side effect while
 * the rest of the package stays tree-shakeable.
 */

// Strict equality with "development" (rather than !== "production") keeps the
// widget out of test runners like Jest with jsdom, where NODE_ENV is "test".
if (process.env.NODE_ENV === "development" && typeof document !== "undefined") {
  const AUTO_MOUNT_FLAG = Symbol.for("openui.devtools.autoMount");
  const flags = globalThis as { [key: symbol]: boolean | undefined };
  // Once per document, even if multiple copies of this module load
  // (ESM/CJS dual build, multiple package versions).
  if (!flags[AUTO_MOUNT_FLAG]) {
    flags[AUTO_MOUNT_FLAG] = true;

    // Pinned to the protocol major, not @latest: cached for days, and a
    // protocol-breaking release (mount() args, Symbol keys, event kinds)
    // would otherwise take down every app that hasn't bumped.
    const url = "https://cdn.jsdelivr.net/npm/@openuidev/devtools@0/dist/devtools.browser.js";

    Promise.all([
      import(/* webpackIgnore: true */ /* @vite-ignore */ url),
      import("react"),
      import("react-dom"),
      import("react-dom/client"),
    ])
      .then(([devtools, react, reactDom, reactDomClient]) => {
        const mount = () => {
          devtools.mountOpenUIDevtools({
            React: react,
            createPortal: reactDom.createPortal,
            createRoot: reactDomClient.createRoot,
            // Closed over this module's graph so the bundler resolves it —
            // the CDN file never imports "@openuidev/react-lang" itself.
            loadReactLang: () => import("@openuidev/react-lang"),
            __autoMounted: true,
          });
        };
        // Module evaluation can happen before <body> exists (script in <head>).
        if (document.body) mount();
        else document.addEventListener("DOMContentLoaded", mount, { once: true });
      })
      .catch(() => {
        // Never let a devtools loading failure break the host app.
      });
  }
}

export {};
