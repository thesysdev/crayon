import { EMPTY_OUTCOME, type LangModule, type ParseResult, type ValidationOutcome } from "./types";

export { EMPTY_OUTCOME, type ValidationOutcome } from "./types";

export function normalizeResult(raw: unknown): ParseResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ParseResult>;
  const meta = (r.meta ?? {}) as Partial<ParseResult["meta"]>;
  return {
    root: r.root ?? null,
    meta: {
      incomplete: !!meta.incomplete,
      unresolved: Array.isArray(meta.unresolved) ? meta.unresolved : [],
      orphaned: Array.isArray(meta.orphaned) ? meta.orphaned : [],
      statementCount: typeof meta.statementCount === "number" ? meta.statementCount : 0,
      errors: Array.isArray(meta.errors) ? meta.errors : [],
    },
    stateDeclarations: r.stateDeclarations,
    queryStatements: r.queryStatements,
    mutationStatements: r.mutationStatements,
  };
}

export function runValidation(
  code: string,
  lang: LangModule,
  schema: unknown,
  rootName: string | undefined,
): ValidationOutcome {
  if (!code.trim()) return EMPTY_OUTCOME;
  try {
    const result = normalizeResult(lang.createParser(schema, rootName).parse(code));
    if (!result) {
      return { result: null, fatal: "Parser returned an unrecognizable result." };
    }
    return { result, fatal: null };
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
] as const;

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

export function librarySchema(library: { toJSONSchema?: () => unknown } | undefined): unknown {
  try {
    return library?.toJSONSchema?.() ?? null;
  } catch {
    return null;
  }
}
