// The spec/fixtures/1.0 conformance cases (spec/language.md, Appendix B; rules in spec/fixtures/1.0/README.md).
// Every case must pass. interactions.json runs in react-lang.
// OPENUI_FIXTURES points the runners at another fixture folder.
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { afterAll, describe, expect, it } from "vitest";
import * as z from "zod/v4";
import {
  createLibrary,
  createParser,
  createStore,
  createStreamingParser,
  defineAction,
  defineComponent,
  defineFunction,
  enrichErrors,
  evaluate,
  evaluateRoot,
  jsonToOpenUI,
  markReactive,
  mergeStatements,
  parseStructuredRules,
  validate,
  type ElementNode,
  type EvaluationContext,
  type LibraryJSONSchema,
  type OpenUIError,
  type ParseResult,
} from "../index";
import type { Library } from "../library";

type Dict = Record<string, unknown>;

// ─── Fixtures and the test library ───
type Schema = {
  type?: string;
  enum?: unknown[];
  properties?: Record<string, Schema>;
  required?: string[];
};
type Call = { description?: string; params: Schema; returns?: Schema };

interface LibrarySpecJSON {
  root: string;
  schema: Dict & {
    $defs: Record<string, Schema>;
    functions?: Record<string, Call>;
    actions?: Record<string, Call>;
  };
  components: Record<string, { signature: string; description: string }>;
}

interface FixtureCase {
  id: string; // `<area>/<folder>`
  files: Record<string, string>;
}

const FIXTURES_DIR = path.resolve(
  process.env.OPENUI_FIXTURES ?? path.join(__dirname, "../../../../spec/fixtures/1.0"),
);

const read = (...p: string[]) => fs.readFileSync(path.join(FIXTURES_DIR, ...p), "utf8");
const dirs = (...p: string[]) =>
  fs
    .readdirSync(path.join(FIXTURES_DIR, ...p), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

const spec: LibrarySpecJSON = JSON.parse(read("library.json"));

function loadCases(): FixtureCase[] {
  return dirs().flatMap((area) =>
    dirs(area).map((name) => ({
      id: `${area}/${name}`,
      files: Object.fromEntries(
        fs.readdirSync(path.join(FIXTURES_DIR, area, name)).map((f) => [f, read(area, name, f)]),
      ),
    })),
  );
}

/** Implementations of library.json's functions, which a client supplies. */
const FUNCTIONS: Record<string, (args: Dict) => unknown> = {
  Upper: ({ text }) => String(text ?? "").toUpperCase(),
};

// Close enough for evaluation; parsing always uses library.json's schema as it is.
function toZod(json: Schema | undefined): z.ZodType {
  if (json?.enum?.every((v) => typeof v === "string")) return z.enum(json.enum as [string]);
  if (json?.type === "string") return z.string();
  if (json?.type === "number" || json?.type === "integer") return z.number();
  if (json?.type === "boolean") return z.boolean();
  if (json?.type === "array") return z.array(z.any());
  return z.any();
}

function toZodObject(json: Schema, bindable: (key: string) => boolean = () => false) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, prop] of Object.entries(json.properties ?? {})) {
    const s = json.required?.includes(key) ? toZod(prop) : toZod(prop).optional();
    if (bindable(key)) markReactive(s);
    shape[key] = s;
  }
  return z.object(shape);
}

// The test library. Bindable props, the ones whose signature prints `$binding<`, get the
// reactive mark. `toJSONSchema()` returns library.json's schema, so the parser sees it exactly.
const library: Library = {
  ...createLibrary({
    components: Object.entries(spec.components).map(([name, { signature, description }]) => {
      const bindable = new Set([...signature.matchAll(/(\w+)\??: \$binding</g)].map((m) => m[1]));
      return defineComponent({
        name,
        description,
        props: toZodObject(spec.schema.$defs[name], (key) => bindable.has(key)),
        component: null,
      });
    }),
    functions: Object.entries(spec.schema.functions ?? {}).map(([name, f]) =>
      defineFunction({
        name,
        description: f.description ?? "",
        params: toZodObject(f.params),
        returns: toZod(f.returns),
        fn: FUNCTIONS[name],
      }),
    ),
    actions: Object.entries(spec.schema.actions ?? {}).map(([name, a]) =>
      defineAction({ name, description: a.description ?? "", params: toZodObject(a.params) }),
    ) as never,
    root: spec.root,
  }),
  toJSONSchema: () => spec.schema as never,
};
const schema = spec.schema as unknown as LibraryJSONSchema;
const functions = Object.fromEntries(
  Object.entries(spec.schema.functions ?? {}).map(([name, f]) => [
    name,
    { ...f, fn: FUNCTIONS[name] },
  ]),
);
const actionParams = Object.fromEntries(
  Object.entries(spec.schema.actions ?? {}).map(([name, a]) => [
    name,
    Object.keys(a.params.properties ?? {}),
  ]),
);
const json = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const same = (a: unknown, b: unknown) => isDeepStrictEqual(json(a), json(b));

// ─── Summary (README, "How the tree is summarized") ───

function summarizeAction(s: Dict, ev: (ast: unknown) => unknown): Dict {
  switch (s.type) {
    case "continue_conversation":
      return {
        action: "ToAssistant",
        args: s.context == null ? [s.message] : [s.message, s.context],
      };
    case "open_url":
      return { action: "OpenUrl", args: [s.url] };
    case "set":
      return { action: "Set", args: [s.target, ev(s.valueAST) ?? null] };
    case "reset":
      return { action: "Reset", args: s.targets as string[] };
    case "run":
      return { action: "Run", args: [s.statementId] };
    default: {
      const params = (s.params as Dict) ?? {};
      const keys = actionParams[s.name as string] ?? Object.keys(params);
      return { action: s.name, args: keys.map((k) => summarize(params[k], ev)) };
    }
  }
}

function summarize(v: unknown, ev: (ast: unknown) => unknown): unknown {
  if (v == null || typeof v !== "object") return v ?? null;
  if (Array.isArray(v)) return v.map((x) => summarize(x, ev));
  const o = v as Dict;
  if (o.type === "element") {
    const props: Dict = {};
    for (const [k, pv] of Object.entries(o.props as Dict)) {
      const s = summarize(pv, ev);
      if (s !== null) props[k] = s;
    }
    return { type: o.typeName, props };
  }
  if (Array.isArray(o.steps))
    return { actions: (o.steps as Dict[]).map((s) => summarizeAction(s, ev)) };
  if (o.__reactive === "assign") return { $binding: o.target };
  return Object.fromEntries(Object.entries(o).map(([k, pv]) => [k, summarize(pv, ev)]));
}

function evaluateResult(result: ParseResult) {
  const store = createStore();
  store.initialize(result.stateDeclarations ?? {}, {});
  // At stream end no fetch has returned: a query reads its defaults, a mutation is idle.
  const ctx: EvaluationContext = {
    getState: (name) => store.get(name) ?? null,
    resolveRef: (name) => {
      const q = result.queryStatements.find((s) => s.statementId === name);
      if (q) return q.defaultsAST ? evaluate(q.defaultsAST, ctx) : null;
      const m = result.mutationStatements.some((s) => s.statementId === name);
      return m ? { status: "idle", data: null, error: null } : null;
    },
    functions,
    actions: schema.actions,
  };
  const errors: OpenUIError[] = [];
  const root = evaluateRoot(result, { ctx, library, store, errors });
  return {
    tree: root,
    root: summarize(root, (ast) => evaluate(ast as never, ctx)),
    errors: [...result.meta.errors, ...errors].map(({ code, statementId }) => ({
      code,
      statementId,
    })),
    unresolved: result.meta.unresolved,
    orphans: result.meta.orphaned,
    incomplete: result.meta.incomplete,
    state: json(result.stateDeclarations ?? {}),
  };
}

// ─── Comparison (README, "Comparison") ───

/** A multiset on `code`; an expected entry without `statementId` matches any statement. */
function errorsMatch(expected: Dict[], actual: Dict[]): boolean {
  const pool = [...actual];
  const specific = [...expected].sort((a, b) => +("statementId" in b) - +("statementId" in a));
  return (
    expected.length === actual.length &&
    specific.every((e) => {
      const i = pool.findIndex(
        (a) => a.code === e.code && (!("statementId" in e) || a.statementId === e.statementId),
      );
      return i !== -1 && pool.splice(i, 1).length === 1;
    })
  );
}

function diff(expected: Dict, actual: Dict): string[] {
  const sorted = (xs: unknown) => [...new Set(xs as string[])].sort();
  const checks: [string, boolean][] = [
    ["root", same(expected.root, actual.root)],
    ["errors", errorsMatch(expected.errors as Dict[], actual.errors as Dict[])],
    ["unresolved", same(sorted(expected.unresolved), sorted(actual.unresolved))],
    ["orphans", same(sorted(expected.orphans), sorted(actual.orphans))],
    ["incomplete", expected.incomplete === actual.incomplete],
    ...["state", "statements", "errorObjects"]
      .filter((k) => k in expected)
      .map((k): [string, boolean] => [k, same(expected[k], actual[k])]),
  ];
  return checks
    .filter(([, ok]) => !ok)
    .map(
      ([k]) => `${k}: expected ${JSON.stringify(expected[k])}, got ${JSON.stringify(actual[k])}`,
    );
}

// ─── Running a case ───

const parse = (text: string) => createParser(schema, spec.root).parse(text);

function streamParse(chunks: string[]): ParseResult {
  const parser = createStreamingParser(schema, spec.root);
  chunks.forEach((chunk, i) => parser.push(chunk, i === chunks.length - 1));
  return parser.getResult(true);
}

function runProgram(c: FixtureCase): string[] {
  const expected = JSON.parse(c.files["expected.json"]) as Dict;

  if (c.files["chunks.json"]) {
    const chunks = JSON.parse(c.files["chunks.json"]) as string[];
    return [
      ...diff(expected, evaluateResult(streamParse(chunks))).map((d) => `streamed ${d}`),
      ...diff(expected, evaluateResult(parse(chunks.join("")))).map((d) => `batch ${d}`),
    ];
  }

  let program = c.files["input.oui"];
  const patch = c.files["patch.oui"];
  if (patch !== undefined) program = mergeStatements(program, patch);
  const result = parse(program);
  const actual: Dict = evaluateResult(result);
  if (patch !== undefined) {
    actual.statements = program.split("\n").flatMap((l) => /^(\$?\w+)\s*=(?!=)/.exec(l)?.[1] ?? []);
  }
  if (expected.errorObjects) {
    const enriched = enrichErrors(result.meta.errors, schema, Object.keys(spec.components));
    actual.errorObjects = (expected.errorObjects as Dict[]).map((want) => {
      const got = enriched.find((e) => e.code === want.code && e.statementId === want.statementId);
      return got
        ? Object.fromEntries(Object.keys(want).map((k) => [k, got[k as keyof OpenUIError] ?? null]))
        : null;
    });
  }
  const diffs = diff(expected, actual);

  if (c.id.includes("-roundtrip-") && actual.tree) {
    const text = jsonToOpenUI(actual.tree as ElementNode, library);
    const again = evaluateResult(parse(text)).root;
    if (!same(again, expected.root))
      diffs.push(`roundtrip: ${JSON.stringify(text)} parses to ${JSON.stringify(again)}`);
  }
  return diffs;
}

function runValidation(c: FixtureCase): string[] {
  const { cases } = JSON.parse(c.files["validation.json"]) as {
    cases: { rules: unknown; value: unknown; valid: boolean }[];
  };
  return cases.flatMap(({ rules, value, valid }, i) => {
    const error = validate(value, parseStructuredRules(rules));
    return (error === undefined) === valid
      ? []
      : [
          `case ${i} ${JSON.stringify(rules)} ${JSON.stringify(value)}: got ${JSON.stringify(error)}`,
        ];
  });
}

// ─── Registration ───

const results: Record<string, { status: string; diffs?: string[] }> = {};

describe("OpenUI conformance fixtures", () => {
  for (const c of loadCases()) {
    it(c.id, () => {
      const diffs = c.files["validation.json"] ? runValidation(c) : runProgram(c);
      results[c.id] = diffs.length ? { status: "fail", diffs } : { status: "pass" };
      if (diffs.length) expect.fail(`${c.id}\n  ${diffs.join("\n  ")}`);
    });
  }

  // OPENUI_CONFORMANCE_REPORT=<file> writes `{ "<id>": { status, diffs? } }`.
  afterAll(() => {
    const report = process.env.OPENUI_CONFORMANCE_REPORT;
    if (report) fs.writeFileSync(report, JSON.stringify(results, null, 2) + "\n");
  });
});
