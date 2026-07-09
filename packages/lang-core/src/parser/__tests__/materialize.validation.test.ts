import { describe, expect, it } from "vitest";
import { createParser, createStreamingParser } from "../parser";
import type { LibraryJSONSchema, MaterializeCtx, ValidationError } from "../types";
import { validateSchemaValue } from "../validation";

/**
 * Exercises the recursive nested validator (validateSchemaValue): objects,
 * arrays, and the items inside them. Prior validation only checked a
 * positional arg's presence; these cover descent into `type: object` /
 * `type: array` and their leaves.
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
    // arg0 → `qty`: `integer` maps to the number check
    IntBox: {
      properties: { qty: { type: "integer" } },
      required: [],
    },
    // arg0 → `mode`: `const` behaves as a single-value enum
    ConstBox: {
      properties: { mode: { const: "fixed" } },
      required: [],
    },
    // arg0 → `theme`: required with a schema default — applied, not validated
    DefBox: {
      properties: { theme: { type: "string", default: "dark" } },
      required: ["theme"],
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
    // arg0 → `levels`: enum leaves nested inside array items
    LevelBox: {
      properties: { levels: { type: "array", items: { enum: [1, 2, 3] } } },
      required: [],
    },
  },
};

const parser = createParser(schema);

function errorsFor(src: string): ValidationError[] {
  return parser.parse(src).meta.errors;
}

describe("validateSchemaValue — nested objects", () => {
  it("accepts a well-typed object with its required key present", () => {
    expect(errorsFor('root = ObjBox({ author: "ann", views: 3 })')).toEqual([]);
  });

  it("flags a wrong scalar type on a nested object leaf", () => {
    const errors = errorsFor('root = ObjBox({ author: "ann", views: "lots" })');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "type-mismatch",
      component: "ObjBox",
      path: "/info/views",
      statementId: "root",
    });
    expect(errors[0].message).toContain("expects number but got string");
  });

  it("flags a missing required key inside the object", () => {
    const errors = errorsFor("root = ObjBox({ views: 3 })");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "missing-required",
      component: "ObjBox",
      path: "/info/author",
    });
  });

  it("flags a null required key inside the object", () => {
    const errors = errorsFor("root = ObjBox({ author: null, views: 3 })");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "null-required",
      path: "/info/author",
    });
  });

  it("flags a scalar where an object is expected (and skips inner checks)", () => {
    const errors = errorsFor('root = ObjBox("hello")');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/info" });
    expect(errors[0].message).toContain("expects object but got string");
  });
});

describe("validateSchemaValue — arrays and their items", () => {
  it("accepts an array of well-typed objects (optional leaf omitted)", () => {
    expect(errorsFor('root = ArrBox([{ label: "a", value: 1 }, { label: "b" }])')).toEqual([]);
  });

  it("flags a wrong scalar type inside an array item, with the element index", () => {
    const errors = errorsFor('root = ArrBox([{ label: "a", value: "x" }])');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "type-mismatch",
      path: "/rows/0/value",
    });
    expect(errors[0].message).toContain("expects number but got string");
  });

  it("flags a missing required key on a specific array element", () => {
    const errors = errorsFor('root = ArrBox([{ label: "a" }, { value: 2 }])');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "missing-required",
      path: "/rows/1/label",
    });
  });

  it("flags a non-array where an array is expected", () => {
    const errors = errorsFor('root = ArrBox({ label: "a" })');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/rows" });
    expect(errors[0].message).toContain("expects array but got object");
  });

  it("accepts a homogeneous array of scalars", () => {
    expect(errorsFor('root = TagBox(["a", "b", "c"])')).toEqual([]);
  });

  it("flags a bad scalar element in a scalar array at its index", () => {
    const errors = errorsFor('root = TagBox(["a", 2, "c"])');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "type-mismatch",
      path: "/tags/1",
    });
    expect(errors[0].message).toContain("expects string but got number");
  });
});

describe("validateSchemaValue — enums and deep recursion", () => {
  it("accepts a valid enum value", () => {
    expect(errorsFor('root = EnumBox("active")')).toEqual([]);
  });

  it("flags an out-of-enum value", () => {
    const errors = errorsFor('root = EnumBox("bogus")');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/status" });
    expect(errors[0].message).toContain("one of");
  });

  it("recurses array → object → array → scalar and reports the deep path", () => {
    const errors = errorsFor('root = DeepBox([{ name: "g1", points: [1, "two", 3] }])');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "type-mismatch",
      path: "/groups/0/points/1",
    });
  });

  it("reports a required key missing deep inside a nested array item", () => {
    const errors = errorsFor("root = DeepBox([{ points: [1, 2] }])");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "missing-required",
      path: "/groups/0/name",
    });
  });

  it("collects independent errors across multiple array elements", () => {
    const errors = errorsFor('root = ArrBox([{ label: 1 }, { value: "x" }])');
    // el0: label is number-not-string.
    // el1: label missing (required) AND value is string-not-number.
    expect(errors).toHaveLength(3);
    const byPath = errors.map((e) => `${e.code}:${e.path}`).sort();
    expect(byPath).toEqual([
      "missing-required:/rows/1/label",
      "type-mismatch:/rows/0/label",
      "type-mismatch:/rows/1/value",
    ]);
  });
});

describe("validateSchemaValue — conservative skips", () => {
  it("does not flag dynamic ($var) elements against the item schema", () => {
    // $x resolves at runtime; it must not be type-checked as a string.
    expect(errorsFor('root = TagBox(["a", $x])')).toEqual([]);
  });

  it("leaves composite (anyOf) schemas unchecked", () => {
    expect(errorsFor("root = AnyBox({ anything: true })")).toEqual([]);
  });

  it("suppresses nested required-key checks while streaming is incomplete", () => {
    const sp = createStreamingParser(schema);
    // Trailing, unterminated object → parse is marked incomplete (partial).
    const res = sp.push("root = ObjBox({ views: 3 ");
    expect(res.meta.incomplete).toBe(true);
    expect(res.meta.errors.some((e) => e.code === "missing-required")).toBe(false);
  });
});

describe("validateSchemaValue — top-level scalar params", () => {
  it("accepts matching scalar types across all three leaves", () => {
    expect(errorsFor('root = ScalarBox("a", 1, true)')).toEqual([]);
  });

  it("flags a number where a string is expected", () => {
    const errors = errorsFor("root = ScalarBox(5)");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/title" });
    expect(errors[0].message).toContain("expects string but got number");
  });

  it("flags a string where a number is expected", () => {
    const errors = errorsFor('root = ScalarBox("a", "b")');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/count" });
    expect(errors[0].message).toContain("expects number but got string");
  });

  it("flags a string where a boolean is expected", () => {
    const errors = errorsFor('root = ScalarBox("a", 1, "yes")');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/flag" });
    expect(errors[0].message).toContain("expects boolean but got string");
  });

  it("accepts an integer against `type: integer`", () => {
    expect(errorsFor("root = IntBox(3)")).toEqual([]);
  });

  it("flags a string against `type: integer`", () => {
    const errors = errorsFor('root = IntBox("3")');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("expects number but got string");
  });

  it("does not flag a float against `type: integer` (integer ≈ number, conservative)", () => {
    expect(errorsFor("root = IntBox(1.5)")).toEqual([]);
  });

  it("accepts the exact `const` value", () => {
    expect(errorsFor('root = ConstBox("fixed")')).toEqual([]);
  });

  it("flags a non-matching value against `const` as a single-value enum", () => {
    const errors = errorsFor('root = ConstBox("loose")');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/mode" });
    expect(errors[0].message).toContain('one of ["fixed"]');
  });

  it("flags a boolean against a string enum", () => {
    const errors = errorsFor("root = EnumBox(true)");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/status" });
    expect(errors[0].message).toContain("one of");
  });

  it("flags an object where a scalar is expected", () => {
    const errors = errorsFor("root = ScalarBox({ a: 1 })");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/title" });
    expect(errors[0].message).toContain("expects string but got object");
  });

  it("flags an array where a scalar is expected", () => {
    const errors = errorsFor("root = ScalarBox([1, 2])");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/title" });
    expect(errors[0].message).toContain("expects string but got array");
  });

  it("flags an object with dynamic parts — it stays an object at runtime", () => {
    const errors = errorsFor("root = ScalarBox({ a: $x })");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/title" });
    expect(errors[0].message).toContain("expects string but got object");
  });
});

describe("validateSchemaValue — conservative skips on leaves and values", () => {
  it("does not flag an object against an enum leaf (reference equality could never match)", () => {
    expect(errorsFor("root = EnumBox({ a: 1 })")).toEqual([]);
  });

  it("skips a null arg (absence is the parent required-check's concern)", () => {
    expect(errorsFor("root = ObjBox(null)")).toEqual([]);
  });

  it("skips validation entirely when the arg is omitted", () => {
    expect(errorsFor("root = ObjBox()")).toEqual([]);
  });

  it("ignores extra keys not declared in the object schema", () => {
    expect(errorsFor('root = ObjBox({ author: "a", bonus: 99 })')).toEqual([]);
  });

  it("skips builtin calls as leaf values (they resolve at runtime)", () => {
    expect(errorsFor('root = ObjBox({ author: "a", views: Sum([1, 2]) })')).toEqual([]);
  });

  it("skips a nested component element against a scalar leaf", () => {
    expect(errorsFor('root = ObjBox({ author: CardBox("hi"), views: 1 })')).toEqual([]);
  });

  it("still validates the nested component's own args", () => {
    const errors = errorsFor("root = ObjBox({ author: CardBox(9) })");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "type-mismatch",
      component: "CardBox",
      path: "/text",
    });
    expect(errors[0].message).toContain("expects string but got number");
  });
});

describe("validateSchemaValue — shape mismatch variants", () => {
  it("flags an array where an object is expected", () => {
    const errors = errorsFor("root = ObjBox([1])");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/info" });
    expect(errors[0].message).toContain("expects object but got array");
  });

  it("flags a number where an array is expected", () => {
    const errors = errorsFor("root = TagBox(42)");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/tags" });
    expect(errors[0].message).toContain("expects array but got number");
  });

  it("leaves elements unchecked when the array schema has no `items`", () => {
    expect(errorsFor('root = ListBox([1, "a", true])')).toEqual([]);
  });

  it("flags out-of-enum values nested inside array items", () => {
    const errors = errorsFor("root = LevelBox([1, 5])");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/levels/1" });
    expect(errors[0].message).toContain("one of");
  });

  it("flags an object against a scalar leaf nested inside an object", () => {
    const errors = errorsFor('root = ObjBox({ author: { first: "a" }, views: 3 })');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch", path: "/info/author" });
    expect(errors[0].message).toContain("expects string but got object");
  });
});

describe("validateSchemaValue — malformed and composite schemas (direct)", () => {
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

  it("skips non-object schemas (undefined, null, string, boolean, array)", () => {
    expect(directErrors(5, undefined)).toEqual([]);
    expect(directErrors(5, null)).toEqual([]);
    expect(directErrors(5, "string")).toEqual([]);
    expect(directErrors(5, true)).toEqual([]);
    expect(directErrors(5, [{ type: "number" }])).toEqual([]);
  });

  it("skips $ref / oneOf / allOf composites", () => {
    expect(directErrors(5, { $ref: "#/$defs/Thing" })).toEqual([]);
    expect(directErrors(5, { oneOf: [{ type: "string" }] })).toEqual([]);
    expect(directErrors(5, { allOf: [{ type: "string" }] })).toEqual([]);
  });

  it("skips undefined values", () => {
    expect(directErrors(undefined, { type: "string" })).toEqual([]);
  });

  it("skips tuple-form `items`", () => {
    expect(directErrors([5], { type: "array", items: [{ type: "string" }] })).toEqual([]);
  });

  it("skips unknown scalar `type` keywords", () => {
    expect(directErrors("x", { type: "date" })).toEqual([]);
    expect(directErrors("x", {})).toEqual([]);
  });

  it("ignores a non-array `required`", () => {
    expect(directErrors({}, { type: "object", required: "author" })).toEqual([]);
  });

  it("checks `required` even when `properties` is absent", () => {
    const errors = directErrors({}, { type: "object", required: ["a"] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "missing-required", path: "/p/a" });
  });

  it("suppresses required checks in a partial ctx but keeps type checks", () => {
    expect(directErrors({}, { type: "object", required: ["a"] }, true)).toEqual([]);
    const errors = directErrors(5, { type: "string" }, true);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch" });
  });

  it("defers enum membership in a partial ctx but checks it when complete", () => {
    const enumSchema = { enum: ["active", "inactive"] };
    // Mid-stream the literal may still be completing toward a valid member.
    expect(directErrors("act", enumSchema, true)).toEqual([]);
    const errors = directErrors("act", enumSchema, false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "type-mismatch" });
  });
});

describe("validateSchemaValue — attribution and interplay with other checks", () => {
  it("attributes errors to the statement that defines the component", () => {
    const errors = errorsFor(
      'root = ListBox([inner])\ninner = ObjBox({ author: "ann", views: "lots" })',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "type-mismatch",
      component: "ObjBox",
      path: "/info/views",
      statementId: "inner",
    });
  });

  it("applies a schema default instead of erroring, without validating it", () => {
    const result = parser.parse("root = DefBox()");
    expect(result.meta.errors).toEqual([]);
    expect(result.root?.props.theme).toBe("dark");
  });

  it("reports excess args alongside validation of the mapped args", () => {
    const errors = errorsFor('root = ScalarBox(1, 1, true, "extra")');
    expect(errors).toHaveLength(2);
    const codes = errors.map((e) => e.code).sort();
    expect(codes).toEqual(["excess-args", "type-mismatch"]);
    expect(errors.find((e) => e.code === "type-mismatch")).toMatchObject({ path: "/title" });
  });

  it("accumulates independent errors across sibling leaves of one object", () => {
    const errors = errorsFor('root = ObjBox({ author: 7, views: "x" })');
    expect(errors).toHaveLength(2);
    const byPath = errors.map((e) => `${e.code}:${e.path}`).sort();
    expect(byPath).toEqual(["type-mismatch:/info/author", "type-mismatch:/info/views"]);
  });
});

describe("validateSchemaValue — streaming", () => {
  it("still flags type mismatches while streaming is incomplete", () => {
    const sp = createStreamingParser(schema);
    const res = sp.push('root = ObjBox({ author: "a", views: "lots" ');
    expect(res.meta.incomplete).toBe(true);
    const mismatch = res.meta.errors.find((e) => e.code === "type-mismatch");
    expect(mismatch).toMatchObject({ path: "/info/views" });
  });

  it("reports suppressed required checks once the stream completes", () => {
    const sp = createStreamingParser(schema);
    const mid = sp.push("root = ObjBox({ views: 3 ");
    expect(mid.meta.errors.some((e) => e.code === "missing-required")).toBe(false);
    const done = sp.push("})\n");
    expect(done.meta.incomplete).toBe(false);
    const missing = done.meta.errors.find((e) => e.code === "missing-required");
    expect(missing).toMatchObject({ path: "/info/author", statementId: "root" });
  });
});

describe("validateSchemaValue — dropping the component on nested failure", () => {
  it("drops the parent when a nested required key is missing (like a top-level required)", () => {
    const result = parser.parse("root = ObjBox({ views: 3 })");
    expect(result.root).toBeNull();
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      code: "missing-required",
      component: "ObjBox",
      path: "/info/author",
    });
  });

  it("drops the parent when a nested required key is null", () => {
    const result = parser.parse("root = ObjBox({ author: null, views: 3 })");
    expect(result.root).toBeNull();
    expect(result.meta.errors[0]).toMatchObject({ code: "null-required", path: "/info/author" });
  });

  it("drops the parent when a required key is missing deep inside an array item", () => {
    const result = parser.parse("root = ArrBox([{ value: 2 }])");
    expect(result.root).toBeNull();
    expect(
      result.meta.errors.some(
        (e) => e.code === "missing-required" && e.path === "/rows/0/label",
      ),
    ).toBe(true);
  });

  it("keeps the parent rendered on a nested type mismatch (report-only, like a top-level scalar)", () => {
    const result = parser.parse('root = ObjBox({ author: "ann", views: "lots" })');
    expect(result.root).not.toBeNull();
    expect(result.root?.props.info).toMatchObject({ author: "ann", views: "lots" });
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({ code: "type-mismatch", path: "/info/views" });
  });

  it("keeps a top-level scalar type mismatch rendered (unchanged behavior)", () => {
    const result = parser.parse("root = ScalarBox(5)");
    expect(result.root).not.toBeNull();
    expect(result.root?.props.title).toBe(5);
    expect(result.meta.errors[0]).toMatchObject({ code: "type-mismatch", path: "/title" });
  });

  it("renders a valid nested object with no errors", () => {
    const result = parser.parse('root = ObjBox({ author: "ann", views: 3 })');
    expect(result.root).not.toBeNull();
    expect(result.meta.errors).toEqual([]);
  });
});

describe("validateSchemaValue — enum leaves while streaming", () => {
  it("does not flag an out-of-enum leaf while the stream is incomplete", () => {
    const sp = createStreamingParser(schema);
    // Trailing, unterminated call → parse is marked incomplete (partial).
    const res = sp.push('root = EnumBox("bogus" ');
    expect(res.meta.incomplete).toBe(true);
    expect(res.meta.errors.some((e) => e.code === "type-mismatch")).toBe(false);
  });

  it("flags the out-of-enum value once the stream completes", () => {
    const sp = createStreamingParser(schema);
    const mid = sp.push('root = EnumBox("bogus" ');
    expect(mid.meta.errors.some((e) => e.code === "type-mismatch")).toBe(false);
    const done = sp.push(")\n");
    expect(done.meta.incomplete).toBe(false);
    expect(done.meta.errors.find((e) => e.code === "type-mismatch")).toMatchObject({
      path: "/status",
    });
  });

  it("still flags a nested scalar type mismatch while streaming (only enums defer)", () => {
    const sp = createStreamingParser(schema);
    const res = sp.push('root = ObjBox({ author: "a", views: "lots" ');
    expect(res.meta.incomplete).toBe(true);
    expect(res.meta.errors.find((e) => e.code === "type-mismatch")).toMatchObject({
      path: "/info/views",
    });
  });
});
