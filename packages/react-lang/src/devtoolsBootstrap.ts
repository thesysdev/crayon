/**
 * Auto-mounts the OpenUI Inspect widget in development.
 *
 * This module runs as a top-level side effect when the web entry is loaded in
 * a browser. In production builds the whole block is dead-code-eliminated by
 * the consumer's bundler (the NODE_ENV condition folds to false), so
 * `@openuidev/devtools` never enters the production graph. The React Native
 * entry (index.native.ts) never imports this module.
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
    // Thin helper in @openuidev/devtools fetches the CDN browser build and
    // injects this app's React / ReactDOM / react-lang. Pin major 0 so a
    // protocol-breaking release ships as @1 instead of taking every app down.
    void import("@openuidev/devtools")
      .then(({ mountOpenUIDevtoolsFromCdn }) => {
        mountOpenUIDevtoolsFromCdn({ cdnMajor: 0, __autoMounted: true });
      })
      .catch(() => {
        // Never let a devtools loading failure break the host app.
      });
  }
}

export {};
