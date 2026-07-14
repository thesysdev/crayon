import { isASTNode } from "./ast";
import {
  isElementNode,
  type ElementNode,
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

function jsType(value: unknown): string {
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * Check a materialized value against a scalar leaf's declared type/enum.
 * Returns a human-readable {expected, actual} on mismatch, or null when it
 * passes or isn't checkable.
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
    return { expected: info.expectedType, actual: jsType(value) };
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

/** Report a type-mismatch in the shared `expects X but got Y` shape. */
function pushTypeMismatch(
  ctx: MaterializeCtx,
  component: string,
  path: string,
  expected: string,
  actual: string,
): void {
  pushValidationError(ctx, {
    code: "type-mismatch",
    component,
    path,
    message: `field "${path}" expects ${expected} but got ${actual}`,
  });
}

export function resolveInvalidValue(
  container: Record<string, unknown>,
  key: string,
  required: boolean,
  defaultValue: unknown,
): boolean {
  if (defaultValue !== undefined) {
    container[key] = defaultValue;
    return false;
  }
  if (required) return true;
  delete container[key];
  return false;
}

/**
 * Position check for a component element in a data slot.
 */
function validateElementPosition(
  element: ElementNode,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if ("$ref" in s || "anyOf" in s || "oneOf" in s || "allOf" in s) return false;
  if (typeof s["type"] === "string" || Array.isArray(s["enum"]) || "const" in s) {
    pushTypeMismatch(
      ctx,
      component,
      path,
      typeof s["type"] === "string" ? s["type"] : "a literal value",
      `component "${element.typeName}"`,
    );
    return true;
  }
  return false;
}

/**
 * Validate an object-shaped slot: container type, required keys
 */
function validateObjectValue(
  value: unknown,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (typeof value !== "object" || Array.isArray(value)) {
    pushTypeMismatch(ctx, component, path, "object", jsType(value));
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
      if (resolveInvalidValue(obj, key, required.has(key), getSchemaDefaultValue(sub))) {
        invalid = true;
      }
    }
  }
  return invalid;
}

/**
 * Validate an array slot: container type, then every element against `items`
 * (single-schema form only — tuples are skipped). Invalid items are pruned.
 */
function validateArrayValue(
  value: unknown,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (!Array.isArray(value)) {
    pushTypeMismatch(ctx, component, path, "array", jsType(value));
    return true;
  }
  const items = s["items"];
  if (items && typeof items === "object" && !Array.isArray(items)) {
    const bad: number[] = [];
    value.forEach((el, i) => {
      if (validateSchemaValue(el, items, component, `${path}/${i}`, ctx)) bad.push(i);
    });
    for (let i = bad.length - 1; i >= 0; i--) value.splice(bad[i], 1);
  }
  return false;
}

/**
 * Validate a scalar/enum leaf.
 */
function validateLeafValue(
  value: unknown,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  const leaf = getScalarTypeInfo(s);
  if (leaf.expectedType == null && leaf.enumValues == null) return false;
  if (leaf.enumValues && ctx.partial) return false;
  const mismatch = describeTypeMismatch(value, leaf);
  if (mismatch) {
    pushTypeMismatch(ctx, component, path, mismatch.expected, mismatch.actual);
    return true;
  }
  return false;
}

/**
 * Recursively validate a materialized value against a JSON Schema fragment,
 * pruning unsalvageable data along the way. Dispatches on the schema shape:
 * objects and arrays descend recursively (reporting nested errors with
 * JSON-pointer paths), leaf scalars check type/enum, and component elements
 * get a position check only (their own args validate separately).
 *
 * Every violation is reported, then the same rule (resolveInvalidValue)
 * applies at each recursion edge: schema default → substitute; REQUIRED edge →
 * parent invalid, caller repeats one level up; OPTIONAL edge → prune. ARRAY
 * ITEMS are always pruned. Absent/null required keys fill silently from their
 * schema default; reported violations keep their error even when a default steps in.
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
  // Child components: only their position is checked here.
  if (isElementNode(value)) return validateElementPosition(value, s, component, path, ctx);
  // Composite shapes can't be reliably matched to a single plain value — skip.
  if ("$ref" in s || "anyOf" in s || "oneOf" in s || "allOf" in s) return false;

  const type = s["type"];
  if (type === "object") return validateObjectValue(value, s, component, path, ctx);
  if (type === "array") return validateArrayValue(value, s, component, path, ctx);
  return validateLeafValue(value, s, component, path, ctx);
}
