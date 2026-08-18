/**
 * Entry point for the browser build (dist/devtools.browser.js), fetched at
 * runtime by react-lang's devtoolsBootstrap rather than installed from npm.
 * See ../../../.claude/plans/devtools-cdn.md.
 *
 * This file is the only thing evaluated eagerly. `./OpenUIDevtools` (and
 * everything it pulls in — theme.ts's module-scope `createContext`,
 * paste/PasteUI.tsx's `class ... extends Component`) is reached only through
 * the dynamic import() below, so the slot below is always filled — real
 * React, not the browser-shims/* placeholders — before any of that runs.
 * Skipping this and importing OpenUIDevtools statically would evaluate those
 * modules the instant this file loads, with no React injected yet.
 */
import { slot } from "./browser-shims/slots";

const BUS_KEY = Symbol.for("openui.observability");

export interface MountOptions {
  React: typeof import("react");
  createPortal: (typeof import("react-dom"))["createPortal"];
  createRoot: (typeof import("react-dom/client"))["createRoot"];
  /** Closed over the host's module graph — the browser build never imports
   *  "@openuidev/react-lang" itself. Omit to run with Paste disabled. */
  loadReactLang?: () => Promise<unknown>;
  /** Explicit bus, mainly for tests. Defaults to the Symbol.for singleton
   *  that "@openuidev/observability" itself publishes to. */
  bus?: import("@openuidev/observability").Observability;
  /** @internal set by react-lang's auto-mount. */
  __autoMounted?: boolean;
}

/** Mounts the widget; call the returned function to unmount. */
export function mountOpenUIDevtools(opts: MountOptions): () => void {
  const bus = opts.bus ?? (globalThis as { [BUS_KEY]?: unknown })[BUS_KEY];
  if (!bus) {
    console.warn(
      "[@openuidev/devtools] no observability bus found on globalThis — import " +
        '"@openuidev/observability" before mounting. Widget not mounted.',
    );
    return () => {};
  }

  slot.react = opts.React;
  slot.createPortal = opts.createPortal;
  slot.bus = bus as import("@openuidev/observability").Observability;
  slot.loadReactLang = opts.loadReactLang;

  let cancelled = false;
  let unmount = () => {
    cancelled = true;
  };

  import("./OpenUIDevtools").then(({ OpenUIDevtools }) => {
    if (cancelled) return;
    const host = document.createElement("div");
    host.setAttribute("data-openui-devtools-root", "");
    document.body.appendChild(host);
    const root = opts.createRoot(host);
    root.render(opts.React.createElement(OpenUIDevtools, { __autoMounted: opts.__autoMounted }));
    unmount = () => {
      root.unmount();
      host.remove();
    };
  });

  return () => unmount();
}
