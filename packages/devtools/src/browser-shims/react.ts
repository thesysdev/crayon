// esbuild `alias`-only module: replaces the bare "react" specifier for the
// browser build. Only reached via the dynamic import() inside
// mountOpenUIDevtools(), which fires after the slot is filled — so every
// name below, including a module-scope call like `createContext(...)`, is
// safe even though it looks like a top-level side effect.
import { requireReact } from "./slots";

const react = requireReact();

export const {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  createContext,
  createElement,
  forwardRef,
  Component,
  Fragment,
} = react;
