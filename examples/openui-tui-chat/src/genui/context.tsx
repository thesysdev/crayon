import type { Library } from "@openuidev/lang-core";
import { createContext, useContext } from "react";

/**
 * Everything the Ink component library needs at render time. Mirrors the role
 * of react-lang's OpenUIContext, but scoped to what a terminal renderer uses.
 */
export interface TuiContextValue {
  library: Library;
  /** When false, components render display-only (no focus/keyboard) — used for finalized turns. */
  interactive: boolean;
  /** Fire an action (button / follow-up / form submit) → sends a message to the assistant. */
  triggerAction: (
    userMessage: string,
    formName?: string,
    action?: unknown,
  ) => void;
  /** Read a form field value (unwrapped) from the runtime store. */
  getFieldValue: (formName: string | undefined, name: string) => unknown;
  /** Write a form field value into the runtime store. */
  setFieldValue: (
    formName: string | undefined,
    componentType: string,
    name: string,
    value: unknown,
  ) => void;
}

const TuiContext = createContext<TuiContextValue | null>(null);

export const TuiProvider = TuiContext.Provider;

export function useTui(): TuiContextValue {
  const ctx = useContext(TuiContext);
  if (!ctx) throw new Error("useTui must be used within a TuiProvider");
  return ctx;
}

/** The name of the enclosing Form, so inputs know where to store their value. */
const FormNameContext = createContext<string | undefined>(undefined);

export const FormNameProvider = FormNameContext.Provider;

export function useFormName(): string | undefined {
  return useContext(FormNameContext);
}
