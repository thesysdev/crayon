// Export polyfills for React 17 compatibility
export { useDeferredValue, useId, useTransition } from "./react-17";

// Re-export specific items from React (avoiding export * due to TypeScript issues)
export {
  Children,
  Component,
  Fragment,
  PureComponent,
  StrictMode,
  Suspense,
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

// Export types
export type {
  CSSProperties,
  ChangeEvent,
  ComponentProps,
  ComponentType,
  Consumer,
  Context,
  FC,
  FocusEvent,
  FormEvent,
  ForwardedRef,
  FunctionComponent,
  HTMLProps,
  JSX,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PropsWithChildren,
  Provider,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
  SyntheticEvent,
} from "react";

// Conditionally export React 18 features if available, otherwise use polyfills
let reactStartTransition: typeof import("./react-17").startTransition;
try {
  // Try to import startTransition from React (available in React 18+)
  const { startTransition: nativeStartTransition } = require("react");
  reactStartTransition = nativeStartTransition;
} catch {
  // Fallback to polyfill
  const { startTransition: polyfillStartTransition } = require("./react-17");
  reactStartTransition = polyfillStartTransition;
}

export { reactStartTransition as startTransition };
