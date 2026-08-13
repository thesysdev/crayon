/**
 * Auto-mounts the OpenUI devtools widget in development.
 *
 * This module runs as a top-level side effect when the web entry is loaded in
 * a browser. In production builds the whole block is dead-code-eliminated by
 * the consumer's bundler (the NODE_ENV condition folds to false), so neither
 * `@openuidev/devtools` nor `react-dom/client` enters the production graph.
 * The React Native entry (index.native.ts) never imports this module.
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
    Promise.all([import("@openuidev/devtools"), import("react"), import("react-dom/client")])
      .then(([devtools, react, reactDomClient]) => {
        const mount = () => {
          const host = document.createElement("div");
          host.setAttribute("data-openui-devtools-root", "");
          document.body.appendChild(host);
          reactDomClient
            .createRoot(host)
            .render(react.createElement(devtools.OpenUIDevtools, { __autoMounted: true }));
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
