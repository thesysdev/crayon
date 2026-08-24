import type { OpenUIDevtoolsProps, OpenUIDevtoolsWidgetProps } from "./types";

/** jsDelivr URL for the browser bundle. Omit `cdnMajor` → `@latest`. */
export function browserBundleUrl(cdnMajor?: number): string {
  const tag = cdnMajor === undefined ? "latest" : String(cdnMajor);
  return `https://cdn.jsdelivr.net/npm/@openuidev/devtools@${tag}/dist/devtools.browser.js`;
}

export type MountFromCdnOptions = OpenUIDevtoolsProps;

type BrowserModule = {
  mountOpenUIDevtools: (opts: {
    React: typeof import("react");
    ReactDOM: typeof import("react-dom");
    ReactDOMClient: typeof import("react-dom/client");
    loadReactLang: () => Promise<unknown>;
    props?: OpenUIDevtoolsWidgetProps;
  }) => () => void;
};

/**
 * Fetches the CDN browser bundle and mounts it with the host's React /
 * ReactDOM / react-lang. Used by `<OpenUIDevtools />` and by react-lang's
 * auto-mount (with `cdnMajor: 0`).
 */
export function mountOpenUIDevtoolsFromCdn(opts: MountFromCdnOptions = {}): () => void {
  const { cdnMajor, enabled, ...widgetProps } = opts;
  const isEnabled =
    enabled ?? (typeof process === "undefined" || process.env["NODE_ENV"] !== "production");

  if (!isEnabled || typeof document === "undefined") {
    return () => {};
  }

  let cancelled = false;
  let unmount = () => {
    cancelled = true;
  };

  const url = browserBundleUrl(cdnMajor);

  Promise.all([
    import(/* webpackIgnore: true */ /* @vite-ignore */ url) as Promise<BrowserModule>,
    import("react"),
    import("react-dom"),
    import("react-dom/client"),
  ])
    .then(([devtools, react, reactDom, reactDomClient]) => {
      if (cancelled) return;
      const attach = () => {
        if (cancelled) return;
        unmount = devtools.mountOpenUIDevtools({
          React: react,
          ReactDOM: reactDom,
          ReactDOMClient: reactDomClient,
          // Closed over this module's graph so the bundler resolves it —
          // the CDN file never imports "@openuidev/react-lang" itself.
          loadReactLang: () => import("@openuidev/react-lang"),
          props: { ...widgetProps, enabled },
        });
      };
      if (document.body) attach();
      else document.addEventListener("DOMContentLoaded", attach, { once: true });
    })
    .catch(() => {
      // Never let a CDN / mount failure break the host app.
    });

  return () => unmount();
}
