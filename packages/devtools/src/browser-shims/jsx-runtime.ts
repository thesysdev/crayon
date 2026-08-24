// React itself doesn't export jsx/jsxs, they only live in this subpath.
import { requireReact } from "./slots";

const react = requireReact();

export const Fragment = react.Fragment;

export function jsx(type: unknown, props: Record<string, unknown>, key?: string) {
  return react.createElement(type as never, key === undefined ? props : { ...props, key });
}

export const jsxs = jsx;
