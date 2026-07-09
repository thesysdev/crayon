import { isASTNode } from "./ast";
import { isElementNode, type MaterializeCtx, type ScalarParamType, type ValidationError } from "./types";

/** Scalar type/enum info extracted from a JSON Schema leaf, for describeTypeMismatch. */
interface ScalarTypeInfo {
  /** Scalar leaf type, when the property is a plain string/number/boolean. */
  expectedType?: ScalarParamType;
  /** Allowed literal values from `enum`/`const`. */
  enumValues?: readonly unknown[];
}

/**
 * Check a materialized value against a scalar leaf's declared type/enum.
 * Returns a human-readable {expected, actual} on mismatch, or null when it
 * passes or isn't checkable. Values reaching this point are concrete literals
 * (dynamic/element/null values are filtered out by validateSchemaValue), so a
 * declared scalar type also flags compound values (object/array). Enum
 * membership is only checked for scalar literals — `includes` compares
 * non-scalar enum members by reference, which could never match.
 */
function describeTypeMismatch(
  value: unknown,
  info: ScalarTypeInfo,
): { expected: string; actual: string } | null {
  const actual = typeof value;
  if (info.enumValues) {
    if (!["string", "number", "boolean"].includes(actual)) return null;
    if (info.enumValues.includes(value)) return null;
    return {
      expected: `one of [${info.enumValues.map((v) => JSON.stringify(v)).join(", ")}]`,
      actual: JSON.stringify(value),
    };
  }
  if (info.expectedType && info.expectedType !== actual) {
    return { expected: info.expectedType, actual: Array.isArray(value) ? "array" : actual };
  }
  return null;
}

/** Extract the scalar leaf type/enum from an already-narrowed JSON Schema object. */
function getScalarTypeInfo(s: Record<string, unknown>): ScalarTypeInfo {
  if (Array.isArray(s["enum"])) return { enumValues: s["enum"] };
  if ("const" in s) return { enumValues: [s["const"]] };
  switch (s["type"]) {
    case "string":
      return { expectedType: "string" };
    case "number":
    case "integer":
      return { expectedType: "number" };
    case "boolean":
      return { expectedType: "boolean" };
    default:
      return {};
  }
}

export function pushValidationError(
  ctx: MaterializeCtx,
  error: Omit<ValidationError, "statementId">,
): void {
  ctx.errors.push({ ...error, statementId: ctx.currentStatementId });
}

/**
 * Recursively validate a materialized value against a JSON Schema fragment.
 *
 * Descends into `type: object` (checking required keys and each declared
 * property) and `type: array` (checking every element against `items`),
 * reporting nested errors with JSON-pointer paths. Leaf scalars are checked
 * for type/enum mismatches.
 *
 * Conservative — silently skips anything it can't reliably check:
 *   - composite shapes ($ref / anyOf / oneOf / allOf)
 *   - dynamic values (runtime AST nodes) and child components (ElementNodes,
 *     which are validated separately as their own elements)
 *   - required-key checks while streaming is in progress
 */
export function validateSchemaValue(
  value: unknown,
  schema: unknown,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): void {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return;
  const s = schema as Record<string, unknown>;
  // Composite shapes can't be reliably matched to a single value — skip.
  if ("$ref" in s || "anyOf" in s || "oneOf" in s || "allOf" in s) return;
  // Absence is handled by required checks on the parent; skip null/undefined.
  if (value == null) return;
  // Dynamic runtime expressions ($var, builtins) resolve later — don't flag.
  if (isASTNode(value)) return;
  // Child components validate themselves when materialized as elements.
  if (isElementNode(value)) return;

  const type = s["type"];

  if (type === "object") {
    if (typeof value !== "object" || Array.isArray(value)) {
      pushValidationError(ctx, {
        code: "type-mismatch",
        component,
        path,
        message: `field "${path}" expects object but got ${Array.isArray(value) ? "array" : typeof value}`,
      });
      return;
    }
    const obj = value as Record<string, unknown>;
    const props =
      s["properties"] && typeof s["properties"] === "object"
        ? (s["properties"] as Record<string, unknown>)
        : {};
    // Structural checks are streaming-sensitive — only run on complete input.
    if (!ctx.partial) {
      const required = Array.isArray(s["required"]) ? (s["required"] as string[]) : [];
      for (const key of required) {
        if (!(key in obj) || obj[key] == null) {
          const isNull = key in obj;
          pushValidationError(ctx, {
            code: isNull ? "null-required" : "missing-required",
            component,
            path: `${path}/${key}`,
            message: isNull
              ? `required field "${path}/${key}" cannot be null`
              : `missing required field "${path}/${key}"`,
          });
        }
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in obj) {
        validateSchemaValue(obj[key], sub, component, `${path}/${key}`, ctx);
      }
    }
    return;
  }

  if (type === "array") {
    if (!Array.isArray(value)) {
      pushValidationError(ctx, {
        code: "type-mismatch",
        component,
        path,
        message: `field "${path}" expects array but got ${typeof value}`,
      });
      return;
    }
    const items = s["items"];
    // Only single-schema `items` (not tuple form) is checked.
    if (items && typeof items === "object" && !Array.isArray(items)) {
      value.forEach((el, i) => validateSchemaValue(el, items, component, `${path}/${i}`, ctx));
    }
    return;
  }

  // Leaf scalar — reuse the scalar/enum mismatch logic.
  const leaf = getScalarTypeInfo(s);
  if (leaf.expectedType == null && leaf.enumValues == null) return;
  const mismatch = describeTypeMismatch(value, leaf);
  if (mismatch) {
    pushValidationError(ctx, {
      code: "type-mismatch",
      component,
      path,
      message: `field "${path}" expects ${mismatch.expected} but got ${mismatch.actual}`,
    });
  }
}
