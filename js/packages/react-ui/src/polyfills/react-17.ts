import { useRef } from "react";

// Polyfill for useId (React 18+)
let globalIdCounter = 0;

export function useId(): string {
  const idRef = useRef<string>("");
  if (!idRef.current) {
    idRef.current = `uid-${++globalIdCounter}`;
  }
  return idRef.current;
}
