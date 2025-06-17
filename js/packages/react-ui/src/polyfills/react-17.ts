import { useCallback, useRef, useState } from "react";

// Polyfill for useId (React 18+)
let globalIdCounter = 0;

export function useId(): string {
  const idRef = useRef<string>(null);
  if (!idRef.current) {
    idRef.current = `uid-${++globalIdCounter}`;
  }
  return idRef.current;
}

// Polyfill for useDeferredValue (React 18+)
export function useDeferredValue<T>(value: T): T {
  // In React 17, just return the value immediately
  return value;
}

// Polyfill for useTransition (React 18+)
export function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setIsPending] = useState(false);

  const startTransition = useCallback((callback: () => void) => {
    setIsPending(true);

    // Use setTimeout to defer the execution
    setTimeout(() => {
      try {
        callback();
      } finally {
        setIsPending(false);
      }
    }, 0);
  }, []);

  return [isPending, startTransition];
}

// Polyfill for standalone startTransition (React 18+)
export function startTransition(callback: () => void): void {
  // In React 17, just execute immediately
  setTimeout(callback, 0);
}

// Type compatibility
export type { ReactElement, ReactNode } from "react";
