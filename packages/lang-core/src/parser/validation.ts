import { isASTNode } from "./ast";
import {
  isElementNode,
  type MaterializeCtx,
  type ScalarParamType,
  type ValidationError,
} from "./types";

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

/** Read a JSON Schema fragment's `default`, if it carries one. */
export function getSchemaDefaultValue(property: unknown): unknown {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    return undefined;
  }
  return (property as { default?: unknown }).default;
}

/** Extract the scalar leaf type/enum from an already-narrowed JSON Schema object. */
export function getScalarTypeInfo(s: Record<string, unknown>): ScalarTypeInfo {
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
 * Recursively validate a materialized value against a JSON Schema fragment,
 * pruning unsalvageable data along the way.
 *
 * Descends into `type: object` (checking required keys and each declared
 * property) and `type: array` (checking every element against `items`),
 * reporting nested errors with JSON-pointer paths. Leaf scalars are checked
 * for type/enum mismatches.
 *
 * Every violation is reported, then the same repair rule applies at each
 * recursion edge, in order:
 *   1. the child schema carries a `default` → substitute it (absent/null
 *      required keys are filled silently; reported violations keep their error)
 *   2. the edge is REQUIRED → the parent object is invalid, and the caller
 *      applies the same rule one level up
 *   3. the edge is OPTIONAL → prune (key deleted) and the parent stays valid
 * ARRAY ITEMS are always pruned (spliced out), never default-substituted —
 * substituting `items.default` would inject duplicate placeholder rows.
 *
 * Returns true when `value` itself is invalid: wrong container type, a
 * scalar/enum mismatch, a missing/null required key, or invalid data under a
 * required key. The caller decides its fate — materializeValue prunes optional
 * props, substitutes the schema default for required ones, and drops the
 * component only when a required prop is invalid with no default (see the Comp
 * branch there). Pruning mutates in place; materialized objects/arrays are
 * freshly built per parse, so cached AST is never touched.
 *
 * Child components (ElementNodes) validate their own args separately; here a
 * component sitting in a slot that declares a plain data shape (type/enum/
 * const, no component refs) is reported as a type-mismatch — a component can
 * never satisfy such a slot.
 *
 * Conservative — silently skips anything it can't reliably check:
 *   - composite shapes ($ref / anyOf / oneOf / allOf), including elements in
 *     component slots (membership isn't checked yet)
 *   - dynamic values (runtime AST nodes)
 *   - elements in unconstrained slots (no refs, no declared data shape)
 *   - required-key checks while streaming is in progress
 *   - enum membership while streaming (a partial literal may still be
 *     completing toward a valid member)
 */
export function validateSchemaValue(
  value: unknown,
  schema: unknown,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return false;
  const s = schema as Record<string, unknown>;
  // Absence is handled by required checks on the parent; skip null/undefined.
  if (value == null) return false;
  // Dynamic runtime expressions ($var, builtins) resolve later — don't flag.
  if (isASTNode(value)) return false;
  // Child components validate their own args when materialized. Slots that
  // admit components ($ref / anyOf / oneOf members) are left unchecked here;
  // but a slot declaring a plain-data shape can never be satisfied by a
  // component — flag it. Unconstrained schemas stay unchecked.
  if (isElementNode(value)) {
    if ("$ref" in s || "anyOf" in s || "oneOf" in s || "allOf" in s) return false;
    if (typeof s["type"] === "string" || Array.isArray(s["enum"]) || "const" in s) {
      pushValidationError(ctx, {
        code: "type-mismatch",
        component,
        path,
        message: `field "${path}" expects ${typeof s["type"] === "string" ? s["type"] : "a literal value"} but got component "${value.typeName}"`,
      });
      return true;
    }
    return false;
  }
  // Composite shapes can't be reliably matched to a single plain value — skip.
  if ("$ref" in s || "anyOf" in s || "oneOf" in s || "allOf" in s) return false;

  const type = s["type"];

  if (type === "object") {
    if (typeof value !== "object" || Array.isArray(value)) {
      pushValidationError(ctx, {
        code: "type-mismatch",
        component,
        path,
        message: `field "${path}" expects object but got ${Array.isArray(value) ? "array" : typeof value}`,
      });
      return true;
    }
    const obj = value as Record<string, unknown>;
    const props =
      s["properties"] && typeof s["properties"] === "object"
        ? (s["properties"] as Record<string, unknown>)
        : {};
    const required = new Set(Array.isArray(s["required"]) ? (s["required"] as string[]) : []);
    let invalid = false;
    // Structural checks are streaming-sensitive — only run on complete input.
    if (!ctx.partial) {
      for (const key of required) {
        if (!(key in obj) || obj[key] == null) {
          // Absent/null required key with a schema default: fill silently,
          // mirroring the top-level defaultValue rescue in materializeValue.
          const fallback = getSchemaDefaultValue(props[key]);
          if (fallback !== undefined) {
            obj[key] = fallback;
            continue;
          }
          const isNull = key in obj;
          pushValidationError(ctx, {
            code: isNull ? "null-required" : "missing-required",
            component,
            path: `${path}/${key}`,
            message: isNull
              ? `required field "${path}/${key}" cannot be null`
              : `missing required field "${path}/${key}"`,
          });
          invalid = true;
        }
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in obj && validateSchemaValue(obj[key], sub, component, `${path}/${key}`, ctx)) {
        // Invalid child (error already reported): schema default repairs it in
        // place; otherwise propagate along a required edge or prune an optional one.
        const fallback = getSchemaDefaultValue(sub);
        if (fallback !== undefined) {
          obj[key] = fallback;
        } else if (required.has(key)) {
          // Required key holds invalid data — the object can't be repaired locally.
          invalid = true;
        } else {
          // Optional key — prune the invalid value; the object stays usable.
          delete obj[key];
        }
      }
    }
    return invalid;
  }

  if (type === "array") {
    if (!Array.isArray(value)) {
      pushValidationError(ctx, {
        code: "type-mismatch",
        component,
        path,
        message: `field "${path}" expects array but got ${typeof value}`,
      });
      return true;
    }
    const items = s["items"];
    // Only single-schema `items` (not tuple form) is checked.
    if (items && typeof items === "object" && !Array.isArray(items)) {
      // Validate every item first so error paths keep original indices, then prune.
      const bad: number[] = [];
      value.forEach((el, i) => {
        if (validateSchemaValue(el, items, component, `${path}/${i}`, ctx)) bad.push(i);
      });
      for (let i = bad.length - 1; i >= 0; i--) value.splice(bad[i], 1);
    }
    // Items are individually prunable — a bad item never invalidates the array.
    return false;
  }

  // Leaf scalar — reuse the scalar/enum mismatch logic.
  const leaf = getScalarTypeInfo(s);
  if (leaf.expectedType == null && leaf.enumValues == null) return false;
  // Enum membership can't be judged mid-stream — a partial literal may still be
  // completing toward a valid member. Scalar type checks stay: a wrong scalar
  // type won't become the right type by streaming more.
  if (leaf.enumValues && ctx.partial) return false;
  const mismatch = describeTypeMismatch(value, leaf);
  if (mismatch) {
    pushValidationError(ctx, {
      code: "type-mismatch",
      component,
      path,
      message: `field "${path}" expects ${mismatch.expected} but got ${mismatch.actual}`,
    });
    return true;
  }
  return false;
}
