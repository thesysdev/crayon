/**
 * Auto-mounts the OpenUI devtools widget in development — fetched at runtime
 * from a CDN rather than imported from @openuidev/devtools, so publishing a
 * new 0.x of the widget reaches every app on next load with no lockfile
 * bump. See ../../../.claude/plans/devtools-cdn.md.
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
  const flags = globalThis as {
    [key: symbol]: boolean | undefined;
    __OPENUI_DEVTOOLS?: boolean;
    __OPENUI_DEVTOOLS_URL?: string;
  };
  // Once per document, even if multiple copies of this module load
  // (ESM/CJS dual build, multiple package versions).
  if (!flags[AUTO_MOUNT_FLAG] && flags.__OPENUI_DEVTOOLS !== false) {
    flags[AUTO_MOUNT_FLAG] = true;

    const url =
      flags.__OPENUI_DEVTOOLS_URL ??
      (typeof localStorage !== "undefined" ? localStorage.getItem("openuiDevtoolsUrl") : null) ??
      // Pinned to the protocol major, not @latest: cached for days, and a
      // protocol-breaking release (mount() args, Symbol keys, event kinds)
      // would otherwise take down every app that hasn't bumped.
      "https://cdn.jsdelivr.net/npm/@openuidev/devtools@0/dist/devtools.browser.js";

    Promise.all([
      import(/* webpackIgnore: true */ /* @vite-ignore */ url),
      import("react"),
      import("react-dom"),
      import("react-dom/client"),
    ])
      .then(([devtools, react, reactDom, reactDomClient]) => {
        devtools.mountOpenUIDevtools({
          React: react,
          createPortal: reactDom.createPortal,
          createRoot: reactDomClient.createRoot,
          // Closed over this module's graph so the bundler resolves it —
          // the CDN file never imports "@openuidev/react-lang" itself.
          loadReactLang: () => import("@openuidev/react-lang"),
          __autoMounted: true,
        });
      })
      .catch(() => {
        // Never let a devtools loading failure break the host app.
      });
  }
}

export {};
