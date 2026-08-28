import type { ValidationError } from "./versions/types";

/** Known codes, in display order; unknown codes (future versions) sort after. */
export const KNOWN_ERROR_CODES = [
  "type-mismatch",
  "missing-required",
  "null-required",
  "excess-args",
  "unknown-component",
  "inline-reserved",
] as const;

export function groupByCode(errors: ValidationError[]): Map<string, ValidationError[]> {
  const map = new Map<string, ValidationError[]>();
  for (const code of KNOWN_ERROR_CODES) map.set(code, []);
  for (const e of errors) {
    const list = map.get(e.code) ?? [];
    list.push(e);
    map.set(e.code, list);
  }
  for (const [code, list] of map) if (list.length === 0) map.delete(code);
  return map;
}
