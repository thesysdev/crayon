import {
  EMPTY_OUTCOME,
  type LangModule,
  type LibrarySchema,
  type ValidationError,
  type ValidationOutcome,
} from "./types";

export { EMPTY_OUTCOME, type ValidationOutcome } from "./types";

export function runValidation(
  code: string,
  lang: LangModule,
  schema: LibrarySchema | null,
  rootName: string | undefined,
): ValidationOutcome {
  if (!code.trim() || !schema) return EMPTY_OUTCOME;
  try {
    return { result: lang.createParser(schema, rootName).parse(code), fatal: null };
  } catch (err) {
    return {
      result: null,
      fatal: err instanceof Error ? err.message : String(err),
    };
  }
}

export const KNOWN_ERROR_CODES = [
  "type-mismatch",
  "missing-required",
  "null-required",
  "excess-args",
  "unknown-component",
  "inline-reserved",
] as const satisfies readonly ValidationError["code"][];

export function groupByCode<T extends { code: string }>(errors: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const code of KNOWN_ERROR_CODES) map.set(code, []);
  for (const e of errors) {
    const list = map.get(e.code) ?? [];
    list.push(e);
    map.set(e.code, list);
  }
  for (const [code, list] of map) if (list.length === 0) map.delete(code);
  return map;
}

export function librarySchema(
  library: { toJSONSchema?: () => unknown } | undefined,
): LibrarySchema | null {
  try {
    const schema = library?.toJSONSchema?.();
    if (!schema || typeof schema !== "object") return null;
    return schema as LibrarySchema;
  } catch {
    return null;
  }
}
