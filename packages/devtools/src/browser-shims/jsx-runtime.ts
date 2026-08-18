// Stands in for "react/jsx-runtime", which esbuild's automatic JSX transform
// imports from on the browser build. Same load-order guarantee as
// browser-shims/react.ts: reached only after mountOpenUIDevtools() has set
// the slot. Minimal reimplementation of the runtime's public contract —
// React itself doesn't export jsx/jsxs, they only live in this subpath.
import { requireReact } from "./slots";

const react = requireReact();

export const Fragment = react.Fragment;

export function jsx(type: unknown, props: Record<string, unknown>, key?: string) {
  return react.createElement(type as never, key === undefined ? props : { ...props, key });
}

export const jsxs = jsx;
