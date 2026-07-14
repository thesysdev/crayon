import { describe, expect, it } from "vitest";
import { createParser, createStreamingParser } from "../parser";
import type { LibraryJSONSchema, MaterializeCtx, ValidationError } from "../types";
import { validateSchemaValue } from "../validation";

/**
 * Exercises the recursive nested validator (validateSchemaValue) and the
 * resolveInvalidValue edge rule, one significant case per behavior:
 *
 *   1. recursive descent + error reporting (JSON-pointer paths, attribution)
 *   2. the edge rule — default → substitute; required → propagate; optional →
 *      prune; array items always pruned
 *   3. component elements in data slots
 *   4. conservative skips (composites, dynamic values, malformed schemas)
 *   5. streaming gates (required + enum deferred; scalar checks stay on)
 *
 * Each component below exposes the schema-under-test as its FIRST positional
 * arg, so `Comp(<value>)` maps `<value>` straight onto the interesting prop.
 */
const schema: LibraryJSONSchema = {
  $defs: {
    // arg0 → `info`: an object with a required key + typed leaves
    ObjBox: {
      properties: {
        info: {
          type: "object",
          properties: {
            author: { type: "string" },
            views: { type: "number" },
          },
          required: ["author"],
        },
      },
      required: [],
    },
    // arg0 → `rows`: an array whose items are objects with a required key
    ArrBox: {
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "number" },
            },
            required: ["label"],
          },
        },
      },
      required: [],
    },
    // arg0 → `tags`: an array of scalar strings
    TagBox: {
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
      required: [],
    },
    // arg0 → `status`: an enum leaf
    EnumBox: {
      properties: {
        status: { enum: ["active", "inactive"] },
      },
      required: [],
    },
    // arg0 → `groups`: array → object → array → number (deep recursion)
    DeepBox: {
      properties: {
        groups: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              points: { type: "array", items: { type: "number" } },
            },
            required: ["name"],
          },
        },
      },
      required: [],
    },
    // arg0 → `combo`: a composite (anyOf) that must be left unchecked
    AnyBox: {
      properties: {
        combo: { anyOf: [{ type: "string" }, { type: "number" }] },
      },
      required: [],
    },
    // arg0..2 → scalar params for top-level leaf checks
    ScalarBox: {
      properties: {
        title: { type: "string" },
        count: { type: "number" },
        flag: { type: "boolean" },
      },
      required: [],
    },
    // arg0 → `theme`: required with a schema default — applied, not validated
    DefBox: {
      properties: { theme: { type: "string", default: "dark" } },
      required: ["theme"],
    },
    // arg0 → `theme`: OPTIONAL param with a default — invalid values fall back to it
    OptDefBox: {
      properties: { theme: { type: "string", default: "dark" } },
      required: [],
    },
    // arg0 → `children`: array without `items` — elements are unchecked
    ListBox: {
      properties: { children: { type: "array" } },
      required: [],
    },
    // arg0 → `text`: a plain catalog component used as a nested prop value
    CardBox: {
      properties: { text: { type: "string" } },
      required: [],
    },
    // arg0 → `info`: REQUIRED object param — invalid nested data drops the component
    ReqBox: {
      properties: {
        info: {
          type: "object",
          properties: { author: { type: "string" } },
          required: ["author"],
        },
      },
      required: ["info"],
    },
    // arg0 → `title`: REQUIRED scalar param — a type mismatch drops the component
    ReqScalar: {
      properties: { title: { type: "string" } },
      required: ["title"],
    },
    // arg0 → `children`: a component slot (anyOf of $refs) — membership unchecked
    SlotBox: {
      properties: {
        children: { type: "array", items: { anyOf: [{ $ref: "#/$defs/CardBox" }] } },
      },
      required: [],
    },
    // args → `labels` (REQUIRED data array), `variant` (enum) — mirrors chart signatures
    ChartBox: {
      properties: {
        labels: { type: "array", items: { type: "string" } },
        variant: { enum: ["grouped", "stacked"] },
      },
      required: ["labels"],
    },
    // arg0 → `cfg`: nested keys with defaults at both required and optional edges
    NestDefBox: {
      properties: {
        cfg: {
          type: "object",
          properties: {
            mode: { enum: ["fast", "slow"], default: "fast" },
            retries: { type: "number", default: 3 },
          },
          required: ["mode"],
        },
      },
      required: [],
    },
  },
};

const parser = createParser(schema);

function errorsFor(src: string): ValidationError[] {
  return parser.parse(src).meta.errors;
}

/** Run validateSchemaValue directly against a raw schema fragment. */
function directErrors(value: unknown, s: unknown, partial = false): ValidationError[] {
  const ctx: MaterializeCtx = {
    syms: new Map(),
    cat: undefined,
    errors: [],
    unres: [],
    visited: new Set(),
    partial,
  };
  validateSchemaValue(value, s, "X", "/p", ctx);
  return ctx.errors;
}

describe("recursive descent & error reporting", () => {
  it("accepts valid values at every depth with no errors", () => {
    expect(errorsFor('root = ObjBox({ author: "ann", views: 3 })')).toEqual([]);
    expect(errorsFor('root = ArrBox([{ label: "a", value: 1 }, { label: "b" }])')).toEqual([]);
    expect(errorsFor('root = EnumBox("active")')).toEqual([]);
  });

  it("reports leaf violations with JSON-pointer paths at any depth", () => {
    // object leaf
    expect(errorsFor('root = ObjBox({ author: "ann", views: "lots" })')[0]).toMatchObject({
      code: "type-mismatch",
      component: "ObjBox",
      path: "/info/views",
    });
    // array item leaf, with element index
    expect(errorsFor('root = ArrBox([{ label: "a", value: "x" }])')[0]).toMatchObject({
      path: "/rows/0/value",
    });
    // deep recursion: array → object → array → scalar
    expect(errorsFor('root = DeepBox([{ name: "g1", points: [1, "two", 3] }])')[0]).toMatchObject({
      path: "/groups/0/points/1",
    });
  });

  it("reports missing vs null required keys inside objects with distinct codes", () => {
    expect(errorsFor("root = ObjBox({ views: 3 })")[0]).toMatchObject({
      code: "missing-required",
      path: "/info/author",
    });
    expect(errorsFor("root = ObjBox({ author: null, views: 3 })")[0]).toMatchObject({
      code: "null-required",
      path: "/info/author",
    });
  });

  it("reports container-shape mismatches (wrong value kind for object/array/scalar slots)", () => {
    expect(errorsFor('root = ObjBox("hello")')[0].message).toContain(
      "expects object but got string",
    );
    expect(errorsFor("root = TagBox(42)")[0].message).toContain("expects array but got number");
    expect(errorsFor("root = ScalarBox([1, 2])")[0].message).toContain(
      "expects string but got array",
    );
    // an object with dynamic parts is still an object at runtime — flagged
    expect(errorsFor("root = ScalarBox({ a: $x })")[0].message).toContain(
      "expects string but got object",
    );
  });

  it("accumulates independent errors across siblings, array elements, and excess args", () => {
    // two sibling leaves of one object
    expect(errorsFor('root = ObjBox({ author: 7, views: "x" })')).toHaveLength(2);
    // three violations spread over two array elements
    const byPath = errorsFor('root = ArrBox([{ label: 1 }, { value: "x" }])')
      .map((e) => `${e.code}:${e.path}`)
      .sort();
    expect(byPath).toEqual([
      "missing-required:/rows/1/label",
      "type-mismatch:/rows/0/label",
      "type-mismatch:/rows/1/value",
    ]);
    // arg validation and excess-args reporting are independent
    const codes = errorsFor('root = ScalarBox(1, 1, true, "extra")')
      .map((e) => e.code)
      .sort();
    expect(codes).toEqual(["excess-args", "type-mismatch"]);
  });

  it("attributes errors to the statement that defines the component", () => {
    const errors = errorsFor(
      'root = ListBox([inner])\ninner = ObjBox({ author: "ann", views: "lots" })',
    );
    expect(errors[0]).toMatchObject({ component: "ObjBox", statementId: "inner" });
  });
});

describe("resolveInvalidValue — the edge rule (default → required → prune)", () => {
  it("prunes invalid values on OPTIONAL edges — component survives", () => {
    // nested optional key
    const nested = parser.parse('root = ObjBox({ author: "ann", views: "lots" })');
    expect(nested.root?.props.info).toEqual({ author: "ann" });
    // optional top-level param
    const top = parser.parse("root = ScalarBox(5)");
    expect(top.root).not.toBeNull();
    expect(top.root?.props).not.toHaveProperty("title");
    // optional param holding an unrepairable object (missing required key)
    const obj = parser.parse("root = ObjBox({ views: 3 })");
    expect(obj.root).not.toBeNull();
    expect(obj.root?.props).not.toHaveProperty("info");
  });

  it("always prunes invalid ARRAY ITEMS — siblings survive, arrays never invalidate", () => {
    const scalars = parser.parse('root = TagBox(["a", 2, "c"])');
    expect(scalars.root?.props.tags).toEqual(["a", "c"]);
    // a required-key violation inside an item is absorbed by the item edge
    const rows = parser.parse('root = ArrBox([{ label: "a", value: 1 }, { value: 2 }])');
    expect(rows.root).not.toBeNull();
    expect(rows.root?.props.rows).toEqual([{ label: "a", value: 1 }]);
  });

  it("propagates through REQUIRED nested keys up to the nearest optional edge", () => {
    // info.author (required) is invalid → info invalid → info is optional → pruned
    const result = parser.parse('root = ObjBox({ author: { first: "a" }, views: 3 })');
    expect(result.root).not.toBeNull();
    expect(result.root?.props).not.toHaveProperty("info");
    expect(result.meta.errors[0]).toMatchObject({ path: "/info/author" });
  });

  it("drops the component when a REQUIRED param is invalid with no default", () => {
    // required object param with a missing required key
    expect(parser.parse("root = ReqBox({ other: 1 })").root).toBeNull();
    // required scalar param with a type mismatch
    expect(parser.parse("root = ReqScalar(5)").root).toBeNull();
  });

  it("substitutes schema defaults for invalid values at every edge (error kept)", () => {
    // top-level required param
    const req = parser.parse("root = DefBox(5)");
    expect(req.root?.props.theme).toBe("dark");
    expect(req.meta.errors).toHaveLength(1);
    // top-level optional param (default wins over pruning)
    expect(parser.parse("root = OptDefBox(5)").root?.props.theme).toBe("dark");
    // nested required enum key — parent survives
    const nestedReq = parser.parse('root = NestDefBox({ mode: "warp", retries: 1 })');
    expect(nestedReq.root?.props.cfg).toEqual({ mode: "fast", retries: 1 });
    expect(nestedReq.meta.errors[0]).toMatchObject({ path: "/cfg/mode" });
    // nested optional key
    const nestedOpt = parser.parse('root = NestDefBox({ mode: "slow", retries: "many" })');
    expect(nestedOpt.root?.props.cfg).toEqual({ mode: "slow", retries: 3 });
  });

  it("fills absent/null required keys from their defaults silently (no error)", () => {
    expect(parser.parse("root = DefBox()").meta.errors).toEqual([]);
    expect(parser.parse("root = DefBox()").root?.props.theme).toBe("dark");
    const absent = parser.parse("root = NestDefBox({ retries: 2 })");
    expect(absent.root?.props.cfg).toEqual({ mode: "fast", retries: 2 });
    expect(absent.meta.errors).toEqual([]);
    const nulled = parser.parse("root = NestDefBox({ mode: null, retries: 2 })");
    expect(nulled.root?.props.cfg).toEqual({ mode: "fast", retries: 2 });
    expect(nulled.meta.errors).toEqual([]);
  });
});

describe("components in data slots", () => {
  it("drops the component when a REQUIRED data param receives an element", () => {
    // hbc = HorizontalBarChart(Card([]), [], "grouped") — the motivating case.
    const result = parser.parse('root = ChartBox(CardBox("x"), "grouped")');
    expect(result.root).toBeNull();
    expect(result.meta.errors[0]).toMatchObject({ code: "type-mismatch", path: "/labels" });
    expect(result.meta.errors[0].message).toContain('expects array but got component "CardBox"');
  });

  it("prunes an element on optional edges (enum leaf, data-array item)", () => {
    const enumSlot = parser.parse('root = ChartBox(["a"], CardBox("x"))');
    expect(enumSlot.root?.props).not.toHaveProperty("variant");
    expect(enumSlot.meta.errors[0].message).toContain(
      "expects a literal value but got component",
    );
    const arrayItem = parser.parse('root = TagBox(["a", CardBox("x"), "b"])');
    expect(arrayItem.root?.props.tags).toEqual(["a", "b"]);
  });

  it("leaves elements in component slots ($ref/anyOf) unchecked — membership comes later", () => {
    const result = parser.parse('root = SlotBox([CardBox("hi"), EnumBox("active")])');
    expect(result.meta.errors).toEqual([]);
    expect((result.root?.props.children as unknown[]).length).toBe(2);
  });

  it("still validates the misplaced component's own args (both errors surface)", () => {
    const errors = errorsFor("root = ObjBox({ author: CardBox(9) })");
    expect(errors).toHaveLength(2);
    expect(errors.find((e) => e.component === "CardBox")).toMatchObject({ path: "/text" });
    expect(errors.find((e) => e.component === "ObjBox")).toMatchObject({ path: "/info/author" });
  });
});

describe("conservative skips", () => {
  it("skips dynamic values, composites, null/omitted args, and extra keys", () => {
    expect(errorsFor('root = TagBox(["a", $x])')).toEqual([]); // $var resolves at runtime
    expect(errorsFor('root = ObjBox({ author: "a", views: Sum([1, 2]) })')).toEqual([]); // builtin
    expect(errorsFor("root = AnyBox({ anything: true })")).toEqual([]); // anyOf composite
    expect(errorsFor("root = ObjBox(null)")).toEqual([]); // absence is the parent's concern
    expect(errorsFor("root = ObjBox()")).toEqual([]);
    expect(errorsFor('root = ObjBox({ author: "a", bonus: 99 })')).toEqual([]); // undeclared keys
    expect(errorsFor('root = ListBox([1, "a", true])')).toEqual([]); // array without `items`
  });

  it("skips malformed and uncheckable schema fragments (direct)", () => {
    expect(directErrors(5, undefined)).toEqual([]);
    expect(directErrors(5, "string")).toEqual([]);
    expect(directErrors(5, { $ref: "#/$defs/Thing" })).toEqual([]);
    expect(directErrors(5, { oneOf: [{ type: "string" }] })).toEqual([]);
    expect(directErrors(5, { allOf: [{ type: "string" }] })).toEqual([]);
    expect(directErrors([5], { type: "array", items: [{ type: "string" }] })).toEqual([]); // tuple
    expect(directErrors("x", { type: "date" })).toEqual([]); // unknown type keyword
    expect(directErrors({}, { type: "object", required: "author" })).toEqual([]); // non-array required
    expect(directErrors(undefined, { type: "string" })).toEqual([]);
    // ...but `required` works even without `properties`
    expect(directErrors({}, { type: "object", required: ["a"] })[0]).toMatchObject({
      code: "missing-required",
    });
  });

  it("applies documented leaf-check edges (direct): integer ≈ number, const ≈ enum, non-scalar skips", () => {
    expect(directErrors(3, { type: "integer" })).toEqual([]);
    expect(directErrors(1.5, { type: "integer" })).toEqual([]); // conservative
    expect(directErrors("3", { type: "integer" })).toHaveLength(1);
    expect(directErrors("loose", { const: "fixed" })[0].message).toContain('one of ["fixed"]');
    expect(directErrors(true, { enum: ["active", "inactive"] })).toHaveLength(1);
    // objects never match enum members (reference equality) — skipped, not flagged
    expect(directErrors({ a: 1 }, { enum: ["active"] })).toEqual([]);
  });
});

describe("streaming gates", () => {
  it("defers required-key checks while partial, then reports them on completion", () => {
    const sp = createStreamingParser(schema);
    const mid = sp.push("root = ObjBox({ views: 3 ");
    expect(mid.meta.incomplete).toBe(true);
    expect(mid.meta.errors.some((e) => e.code === "missing-required")).toBe(false);
    const done = sp.push("})\n");
    expect(done.meta.incomplete).toBe(false);
    expect(done.meta.errors.find((e) => e.code === "missing-required")).toMatchObject({
      path: "/info/author",
      statementId: "root",
    });
  });

  it("defers enum membership while partial, then flags it on completion", () => {
    const sp = createStreamingParser(schema);
    const mid = sp.push('root = EnumBox("bogus" ');
    expect(mid.meta.errors).toEqual([]);
    const done = sp.push(")\n");
    expect(done.meta.errors.find((e) => e.code === "type-mismatch")).toMatchObject({
      path: "/status",
    });
  });

  it("keeps scalar type checks on mid-stream (only structure and enums defer)", () => {
    const sp = createStreamingParser(schema);
    const res = sp.push('root = ObjBox({ author: "a", views: "lots" ');
    expect(res.meta.incomplete).toBe(true);
    expect(res.meta.errors.find((e) => e.code === "type-mismatch")).toMatchObject({
      path: "/info/views",
    });
    // same gating verified directly on a partial ctx
    expect(directErrors({}, { type: "object", required: ["a"] }, true)).toEqual([]);
    expect(directErrors("act", { enum: ["active"] }, true)).toEqual([]);
    expect(directErrors(5, { type: "string" }, true)).toHaveLength(1);
  });
});
