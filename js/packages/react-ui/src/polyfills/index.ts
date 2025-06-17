// Export polyfills for React 17 compatibility
export { useDeferredValue, useId, useTransition } from "./react-17";

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
