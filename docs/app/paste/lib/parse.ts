import type {
  LoadedLangCore,
  OpenUIError,
  ParseResult,
  ValidationError,
} from "./versions/types";

export interface ValidationOutcome {
  result: ParseResult | null;
  enriched: OpenUIError[] | null;
  /** The parser itself threw — happens on some old lang-core versions. */
  fatal: string | null;
}

export const EMPTY_OUTCOME: ValidationOutcome = { result: null, enriched: null, fatal: null };

/**
 * One-shot validation with the user-selected lang-core version. Everything a
 * dynamically loaded module does is wrapped — a throw becomes `fatal`, never
 * an unhandled exception. (If parsing ever needs to move off the main thread,
 * this function is the seam to put behind a worker.)
 */
export function runValidation(
  code: string,
  loaded: LoadedLangCore,
  schema: unknown,
  rootName: string | undefined,
  componentNames: string[],
): ValidationOutcome {
  if (!code.trim()) return EMPTY_OUTCOME;
  let result: ParseResult;
  try {
    result = loaded.mod.createParser!(schema, rootName).parse(code);
  } catch (err) {
    return {
      result: null,
      enriched: null,
      fatal: err instanceof Error ? err.message : String(err),
    };
  }
  return { result, enriched: tryEnrich(result.meta.errors, loaded, schema, componentNames), fatal: null };
}

export function tryEnrich(
  errors: ValidationError[],
  loaded: LoadedLangCore,
  schema: unknown,
  componentNames: string[],
): OpenUIError[] | null {
  if (!loaded.capabilities.enrich || errors.length === 0) return null;
  try {
    return loaded.mod.enrichErrors!(errors, schema, componentNames);
  } catch {
    return null;
  }
}
