import type { LibraryJSONSchema, OpenUIError, ValidationError } from "./types";
import { getScalarTypeInfo } from "./validation";

/** Render a property's type for a signature hint, e.g. "string", "'a'|'b'", "Header". */
function describeSchemaType(property: unknown): string | undefined {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    return undefined;
  }
  const p = property as Record<string, unknown>;
  // $refs and compound types aren't validator-checkable but still make useful hints.
  if (typeof p.$ref === "string") {
    return p.$ref.split("/").pop();
  }
  // Scalar/enum leaves: share the validator's schema-leaf interpretation so
  // hints and type-mismatch messages never disagree.
  const leaf = getScalarTypeInfo(p);
  if (leaf.enumValues) {
    return leaf.enumValues.map((v) => JSON.stringify(v)).join("|");
  }
  if (leaf.expectedType) {
    return leaf.expectedType;
  }
  return typeof p.type === "string" ? p.type : undefined;
}

/**
 * Build a typed signature hint like
 * "Header(title*: string, variant: 'a'|'b')" from JSON schema.
 * Positional order is preserved so the LLM can fix swapped args.
 */
function buildSignatureHint(
  componentName: string,
  schema: { properties?: Record<string, unknown>; required?: string[] } | undefined,
): string | undefined {
  if (!schema?.properties) return undefined;
  const required = new Set(schema.required ?? []);
  const params = Object.entries(schema.properties)
    .map(([k, prop]) => {
      const type = describeSchemaType(prop);
      const marked = required.has(k) ? `${k}*` : k;
      return type ? `${marked}: ${type}` : marked;
    })
    .join(", ");
  return `Signature: ${componentName}(${params}) — * marks required`;
}

/**
 * @deprecated ValidationError.message is already humanized — read
 * `result.meta.errors` directly (match on `.code`/`.path`, display `.message`).
 * This extra enrichment pass will be removed in a future major release.
 * Framework-agnostic — usable by React, Svelte, Vue, or standalone.
 * Convert parser ValidationErrors into enriched OpenUIErrors with hints.
 */
export function enrichErrors(
  validationErrors: ValidationError[],
  schema: LibraryJSONSchema,
  componentNames: string[],
): OpenUIError[] {
  return validationErrors.map((ve) => {
    const error: OpenUIError = {
      source: "parser",
      code: ve.code,
      message: ve.message,
      component: ve.component,
      path: ve.path || undefined,
      statementId: ve.statementId,
    };
    if (ve.code === "unknown-component" && componentNames.length) {
      error.hint = `Available components: ${componentNames.join(", ")}`;
    } else if (
      ve.code === "missing-required" ||
      ve.code === "null-required" ||
      ve.code === "type-mismatch"
    ) {
      error.hint = buildSignatureHint(ve.component, schema.$defs?.[ve.component]);
    } else if (ve.code === "inline-reserved") {
      error.hint = `Declare as a top-level statement: myVar = ${ve.component}(...)`;
    }
    return error;
  });
}
