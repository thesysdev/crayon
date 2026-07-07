// ─────────────────────────────────────────────────────────────────────────────
// Schema-aware materialization — single-pass lowering
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { isASTNode, isRuntimeExpr } from "./ast";
import { isBuiltin, isReservedCall, LAZY_BUILTINS, RESERVED_CALLS } from "./builtins";
import { isElementNode, type ParamMap, type ScalarParamType, type ValidationError } from "./types";

/**
 * Recursively check if a prop value contains any AST nodes that need runtime
 * evaluation. Walks into arrays, ElementNode children, and plain objects.
 */
export function containsDynamicValue(v: unknown): boolean {
  if (v == null || typeof v !== "object") return false;
  if (isASTNode(v)) return true;
  if (Array.isArray(v)) return v.some(containsDynamicValue);
  if (isElementNode(v)) {
    return Object.values(v.props).some(containsDynamicValue);
  }
  const obj = v as Record<string, unknown>;
  return Object.values(obj).some(containsDynamicValue);
}

export interface MaterializeCtx {
  syms: Map<string, ASTNode>;
  cat: ParamMap | undefined;
  errors: ValidationError[];
  unres: string[];
  visited: Set<string>;
  partial: boolean;
  /** Tracks which statement is currently being materialized (for error attribution). */
  currentStatementId?: string;
  /** Statement IDs not yet reached — delete as they're touched. Remaining = orphaned. */
  unreached?: Set<string>;
}

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
 * passes or isn't checkable. Only concrete scalar literals are checked.
 */
function describeTypeMismatch(
  value: unknown,
  info: ScalarTypeInfo,
): { expected: string; actual: string } | null {
  const actual = typeof value;
  if (!["string", "number", "boolean"].includes(actual)) {
    return null;
  }
  if (info.enumValues) {
    if (info.enumValues.includes(value)) return null;
    return {
      expected: `one of [${info.enumValues.map((v) => JSON.stringify(v)).join(", ")}]`,
      actual: JSON.stringify(value),
    };
  }
  if (info.expectedType && info.expectedType !== actual) {
    return { expected: info.expectedType, actual };
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

function pushValidationError(
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

/**
 * Resolve a Ref node: inline from symbol table, detect cycles, emit RuntimeRef
 * for Query/Mutation declarations. Shared by materializeValue and materializeExpr.
 */
function resolveRef(name: string, ctx: MaterializeCtx, mode: "value" | "expr"): unknown | ASTNode {
  if (ctx.visited.has(name)) {
    ctx.unres.push(name);
    return mode === "expr" ? { k: "Ph", n: name } : null;
  }
  if (!ctx.syms.has(name)) {
    ctx.unres.push(name);
    return mode === "expr" ? { k: "Ph", n: name } : null;
  }
  const target = ctx.syms.get(name)!;
  ctx.unreached?.delete(name);
  // Query/Mutation declarations → RuntimeRef (resolved at runtime by evaluator)
  if (target.k === "Comp" && isReservedCall(target.name)) {
    const refType =
      target.name === RESERVED_CALLS.Mutation ? ("mutation" as const) : ("query" as const);
    return { k: "RuntimeRef", n: name, refType };
  }
  ctx.visited.add(name);
  const prevStatementId = ctx.currentStatementId;
  ctx.currentStatementId = name;
  try {
    const result = mode === "value" ? materializeValue(target, ctx) : materializeExpr(target, ctx);
    // Tag ElementNode with its source statement name
    if (mode === "value" && isElementNode(result)) {
      result.statementId = name;
    }
    return result;
  } finally {
    ctx.currentStatementId = prevStatementId;
    ctx.visited.delete(name);
  }
}

/**
 * If node is a lazy builtin like Each(arr, varName, template), temporarily
 * scope the iterator variable during materialization so template refs resolve.
 * Returns the materialized Comp node, or null if not a lazy builtin.
 */
function materializeLazyBuiltin(
  node: ASTNode & { k: "Comp" },
  ctx: MaterializeCtx,
  scopedRefs: ReadonlySet<string>,
): ASTNode | null {
  if (!LAZY_BUILTINS.has(node.name) || node.args.length < 3) return null;
  const varArg = node.args[1];
  const varName = varArg.k === "Ref" ? varArg.n : varArg.k === "Str" ? varArg.v : null;
  if (!varName) return null;

  const nextScopedRefs = new Set(scopedRefs);
  nextScopedRefs.add(varName);
  // Skip args[1] (the iterator declaration) but preserve scoped refs elsewhere.
  const recursedArgs = node.args.map((a, i) =>
    i === 1 ? a : materializeExprInternal(a, ctx, nextScopedRefs),
  );
  return { ...node, args: recursedArgs };
}

function materializeExprInternal(
  node: ASTNode,
  ctx: MaterializeCtx,
  scopedRefs: ReadonlySet<string>,
): ASTNode {
  switch (node.k) {
    case "Ref":
      return scopedRefs.has(node.n) ? node : (resolveRef(node.n, ctx, "expr") as ASTNode);

    case "Ph":
      return node;

    case "Comp": {
      const lazy = materializeLazyBuiltin(node, ctx, scopedRefs);
      if (lazy) return lazy;
      const recursedArgs = node.args.map((a) => materializeExprInternal(a, ctx, scopedRefs));
      // Builtins, reserved calls, and action calls: recurse args, keep as-is
      if (isBuiltin(node.name) || isReservedCall(node.name)) {
        return { ...node, args: recursedArgs };
      }
      // Catalog component: add mappedProps for the evaluator
      const def = ctx.cat?.get(node.name);
      if (def) {
        const mappedProps: Record<string, ASTNode> = {};
        for (let i = 0; i < def.params.length && i < recursedArgs.length; i++) {
          mappedProps[def.params[i].name] = recursedArgs[i];
        }
        return { ...node, args: recursedArgs, mappedProps };
      }
      // Unknown component in expression: push error (same as value path)
      pushValidationError(ctx, {
        code: "unknown-component",
        component: node.name,
        path: "",
        message: `Unknown component "${node.name}" — not found in catalog or builtins`,
      });
      return { ...node, args: recursedArgs };
    }

    case "Arr":
      return { ...node, els: node.els.map((e) => materializeExprInternal(e, ctx, scopedRefs)) };
    case "Obj":
      return {
        ...node,
        entries: node.entries.map(
          ([k, v]) => [k, materializeExprInternal(v, ctx, scopedRefs)] as [string, ASTNode],
        ),
      };
    case "BinOp":
      return {
        ...node,
        left: materializeExprInternal(node.left, ctx, scopedRefs),
        right: materializeExprInternal(node.right, ctx, scopedRefs),
      };
    case "UnaryOp":
      return { ...node, operand: materializeExprInternal(node.operand, ctx, scopedRefs) };
    case "Ternary":
      return {
        ...node,
        cond: materializeExprInternal(node.cond, ctx, scopedRefs),
        then: materializeExprInternal(node.then, ctx, scopedRefs),
        else: materializeExprInternal(node.else, ctx, scopedRefs),
      };
    case "Member":
      return { ...node, obj: materializeExprInternal(node.obj, ctx, scopedRefs) };
    case "Index":
      return {
        ...node,
        obj: materializeExprInternal(node.obj, ctx, scopedRefs),
        index: materializeExprInternal(node.index, ctx, scopedRefs),
      };
    case "Assign":
      return { ...node, value: materializeExprInternal(node.value, ctx, scopedRefs) };

    // Literals, StateRef, RuntimeRef — pass through unchanged
    default:
      return node;
  }
}

/**
 * Normalize an AST node for use inside runtime expressions.
 * Resolves Refs, adds mappedProps to catalog Comp nodes.
 * Returns ASTNode — structure preserved for runtime evaluation by the evaluator.
 */
export function materializeExpr(node: ASTNode, ctx: MaterializeCtx): ASTNode {
  return materializeExprInternal(node, ctx, new Set());
}

/**
 * Schema-aware materialization: resolves refs, normalizes catalog component args
 * to named props, validates required props, applies defaults, converts literals
 * to plain values, and preserves runtime expressions as AST nodes — all in a
 * single recursive traversal.
 *
 * Returns:
 *   - ElementNode for catalog/unknown components
 *   - ASTNode for builtins and runtime expression nodes
 *   - Plain values for literals, arrays, objects
 *   - null for placeholders
 */
export function materializeValue(node: ASTNode, ctx: MaterializeCtx): unknown {
  switch (node.k) {
    // ── Ref resolution ───────────────────────────────────────────────────
    case "Ref":
      return resolveRef(node.n, ctx, "value");

    // ── Literals → plain values ──────────────────────────────────────────
    case "Str":
      return node.v;
    case "Num":
      return node.v;
    case "Bool":
      return node.v;
    case "Null":
      return null;
    case "Ph":
      return null;

    // ── Collections ──────────────────────────────────────────────────────
    case "Arr": {
      const items: unknown[] = [];
      for (const e of node.els) {
        // Drop unresolved placeholders from arrays
        if (e.k === "Ph") continue;
        const value = materializeValue(e, ctx);
        // Drop null entries from component/ref resolution (incomplete props, unresolved refs, unknown components)
        if (value === null && (e.k === "Comp" || e.k === "Ref")) continue;
        items.push(value);
      }
      return items;
    }
    case "Obj": {
      const o: Record<string, unknown> = {};
      for (const [k, v] of node.entries) o[k] = materializeValue(v, ctx);
      return o;
    }

    // ── Component nodes ──────────────────────────────────────────────────
    case "Comp": {
      const { name, args } = node;

      // Builtins (Sum, Count, Filter, Action, etc.) → preserve as ASTNode for runtime
      if (isBuiltin(name)) {
        const lazy = materializeLazyBuiltin(node, ctx, new Set());
        if (lazy) return lazy;
        return { ...node, args: args.map((a) => materializeExpr(a, ctx)) };
      }

      // Inline Query/Mutation (not from a statement-level declaration) → validation error
      if (isReservedCall(name)) {
        pushValidationError(ctx, {
          code: "inline-reserved",
          component: name,
          path: "",
          message: `${name}() must be declared as a top-level statement, not used inline as a value`,
        });
        return null;
      }

      const def = ctx.cat?.get(name);
      const props: Record<string, unknown> = {};

      if (def) {
        // Catalog component: map positional args → named props
        for (let i = 0; i < def.params.length && i < args.length; i++) {
          const param = def.params[i];
          const value = materializeValue(args[i], ctx);
          props[param.name] = value;
          // Single validation entry point: scalar leaf type/enum for simple
          // props, recursive key/type checks for nested object/array shapes.
          if (param.schema !== undefined) {
            validateSchemaValue(value, param.schema, name, `/${param.name}`, ctx);
          }
        }

        // Report excess positional args (extra args are silently dropped)
        if (args.length > def.params.length) {
          const excessCount = args.length - def.params.length;
          pushValidationError(ctx, {
            code: "excess-args",
            component: name,
            path: "",
            message: `${name} takes ${def.params.length} arg(s), got ${args.length} (${excessCount} excess dropped)`,
          });
        }

        // Validate required props — try defaultValue first before dropping
        const missingRequired = def.params.filter(
          (p) => p.required && (!(p.name in props) || props[p.name] === null),
        );
        if (missingRequired.length) {
          const stillInvalid = missingRequired.filter((p) => {
            if (p.defaultValue !== undefined) {
              props[p.name] = p.defaultValue;
              return false;
            }
            return true;
          });
          if (stillInvalid.length) {
            for (const p of stillInvalid) {
              const isNull = p.name in props;
              pushValidationError(ctx, {
                code: isNull ? "null-required" : "missing-required",
                component: name,
                path: `/${p.name}`,
                message: isNull
                  ? `required field "${p.name}" cannot be null`
                  : `missing required field "${p.name}"`,
              });
            }
            return null;
          }
        }
      } else if (!isBuiltin(name) && !isReservedCall(name)) {
        // Unknown component: error and drop from tree
        pushValidationError(ctx, {
          code: "unknown-component",
          component: name,
          path: "",
          message: `Unknown component "${name}" — not found in catalog or builtins`,
        });
        return null;
      }

      const hasDynamicProps = Object.values(props).some((v) => containsDynamicValue(v));
      return { type: "element", typeName: name, props, partial: ctx.partial, hasDynamicProps };
    }

    // ── Runtime expression nodes → preserve as ASTNode, normalize children ─
    default: {
      if (isRuntimeExpr(node)) {
        return materializeExpr(node, ctx);
      }
      // Unreachable for well-formed AST, but preserve the value defensively.
      return node;
    }
  }
}
