import { useEffect, useMemo, useState } from "react";
import { EMPTY_OUTCOME, runValidation, type ValidationOutcome } from "./parse";
import type { LangModule } from "./types";

const DEBOUNCE_MS = 150;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function useValidation(
  code: string,
  lang: LangModule | null | undefined,
  schema: unknown,
  rootName: string | undefined,
): ValidationOutcome {
  const debouncedCode = useDebounced(code, DEBOUNCE_MS);
  return useMemo(() => {
    if (!lang) return EMPTY_OUTCOME;
    return runValidation(debouncedCode, lang, schema, rootName);
  }, [debouncedCode, lang, schema, rootName]);
}
