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
  defineComponent,
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
type Call = { description?: string; params: { properties?: Dict } };

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

const spec: {
  root: string;
  schema: { $defs: Record<string, { properties?: Dict }>; functions?: Record<string, Call> };
  components: Record<string, { signature: string; description: string }>;
} = JSON.parse(read("library.json"));
const schema = spec.schema as unknown as LibraryJSONSchema;

// ─── The test library ───

/** Implementations of library.json's functions, which a client supplies. */
const FUNCTIONS: Record<string, (args: Dict) => unknown> = {
  Upper: ({ text }) => String(text ?? "").toUpperCase(),
};

// Parsing uses library.json's schema as it is (`toJSONSchema`). Evaluation only needs each
// component's prop keys, with the reactive mark on bindable props (signature `$binding<`).
const library: Library = {
  ...createLibrary({
    components: Object.entries(spec.components).map(([name, { signature, description }]) => {
      const bindable = new Set([...signature.matchAll(/(\w+)\??: \$binding</g)].map((m) => m[1]));
      const props = Object.keys(spec.schema.$defs[name].properties ?? {}).map((key) => {
        const s = z.any();
        if (bindable.has(key)) markReactive(s);
        return [key, s];
      });
      return defineComponent({
        name,
        description,
        props: z.object(Object.fromEntries(props)),
        component: null,
      });
    }),
    root: spec.root,
  }),
  toJSONSchema: () => schema,
};
const functions = Object.fromEntries(
  Object.entries(spec.schema.functions ?? {}).map(([name, f]) => [
    name,
    { ...f, fn: FUNCTIONS[name] },
  ]),
);
const actionParams = Object.fromEntries(
  Object.entries(schema.actions ?? {}).map(([name, a]) => [
    name,
    Object.keys((a as Call).params.properties ?? {}),
  ]),
);
const json = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const same = (a: unknown, b: unknown) => isDeepStrictEqual(json(a), json(b));

// ─── Summary (README, "How the tree is summarized") ───

type Ev = (ast: unknown) => unknown;

function summarizeAction(s: Dict, ev: Ev): Dict {
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
      return { action: "Reset", args: s.targets };
    case "run":
      return { action: "Run", args: [s.statementId] };
    default: {
      const params = (s.params as Dict) ?? {};
      const keys = actionParams[s.name as string] ?? Object.keys(params);
      return { action: s.name, args: keys.map((k) => summarize(params[k], ev)) };
    }
  }
}

function summarize(v: unknown, ev: Ev): unknown {
  if (v == null || typeof v !== "object") return v ?? null;
  if (Array.isArray(v)) return v.map((x) => summarize(x, ev));
  const o = v as Dict;
  if (o.type === "element") {
    const props = Object.entries(o.props as Dict)
      .map(([k, pv]) => [k, summarize(pv, ev)])
      .filter(([, s]) => s !== null);
    return { type: o.typeName, props: Object.fromEntries(props) };
  }
  if (Array.isArray(o.steps))
    return { actions: (o.steps as Dict[]).map((s) => summarizeAction(s, ev)) };
  if (o.__reactive === "assign") return { $binding: o.target };
  return Object.fromEntries(Object.entries(o).map(([k, pv]) => [k, summarize(pv, ev)]));
}

/** The canonical result at stream end, plus the evaluated tree for the roundtrip check. */
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
  const runtimeErrors: OpenUIError[] = [];
  const tree = evaluateRoot(result, { ctx, library, store, errors: runtimeErrors });
  // The error objects of language.md, section 8.3.
  const errorObjects = [
    ...result.meta.errors.map((e) => ({ source: "parser", ...e, path: e.path || undefined })),
    ...runtimeErrors,
  ];
  return {
    tree,
    root: summarize(tree, (ast) => evaluate(ast as never, ctx)),
    errors: errorObjects.map(({ code, statementId }) => ({ code, statementId })),
    errorObjects,
    unresolved: result.meta.unresolved,
    orphans: result.meta.orphaned,
    incomplete: result.meta.incomplete,
    state: json(result.stateDeclarations ?? {}),
  };
}

// ─── Comparison (README, "Comparison") ───

/**
 * Each expected entry claims its own actual entry that agrees on the keys it lists, so an
 * `errors` entry without `statementId` matches any statement. Entries listing more keys go first.
 */
function claims(expected: Dict[], actual: object[]): boolean {
  const pool = [...actual] as Dict[];
  return [...expected]
    .sort((a, b) => Object.keys(b).length - Object.keys(a).length)
    .every((e) => {
      const i = pool.findIndex((a) => Object.entries(e).every(([k, v]) => same(v, a[k] ?? null)));
      return i !== -1 && pool.splice(i, 1).length === 1;
    });
}

const asSet = (xs: unknown) => (Array.isArray(xs) ? [...new Set(xs)].sort() : xs);
const COMPARE: Record<string, (want: unknown, got: unknown) => boolean> = {
  root: same,
  errors: (w, g) =>
    (w as Dict[]).length === (g as Dict[]).length && claims(w as Dict[], g as Dict[]),
  unresolved: (w, g) => same(asSet(w), asSet(g)),
  orphans: (w, g) => same(asSet(w), asSet(g)),
  incomplete: same,
  state: same,
  statements: same,
  errorObjects: (w, g) => claims(w as Dict[], g as Dict[]),
};
const OPTIONAL = ["state", "statements", "errorObjects"];

function check(id: string, expected: Dict, result: ParseResult, statements?: string[]): string[] {
  const actual: Dict = { ...evaluateResult(result), statements };
  const diffs = Object.entries(COMPARE)
    .filter(([k, ok]) => (k in expected || !OPTIONAL.includes(k)) && !ok(expected[k], actual[k]))
    .map(
      ([k]) => `${k}: expected ${JSON.stringify(expected[k])}, got ${JSON.stringify(actual[k])}`,
    );

  if (id.includes("-roundtrip-") && actual.tree) {
    const text = jsonToOpenUI(actual.tree as ElementNode, library);
    const again = evaluateResult(parse(text)).root;
    if (!same(again, expected.root))
      diffs.push(`roundtrip: ${JSON.stringify(text)} parses to ${JSON.stringify(again)}`);
  }
  return diffs;
}

// ─── Running a case ───

const parse = (text: string) => createParser(schema, spec.root).parse(text);

function runProgram(id: string, files: Record<string, string>): string[] {
  const expected = JSON.parse(files["expected.json"]) as Dict;

  if (files["chunks.json"]) {
    const chunks = JSON.parse(files["chunks.json"]) as string[];
    const parser = createStreamingParser(schema, spec.root);
    chunks.forEach((chunk, i) => parser.push(chunk, i === chunks.length - 1));
    return [
      ...check(id, expected, parser.getResult(true)).map((d) => `streamed ${d}`),
      ...check(id, expected, parse(chunks.join(""))).map((d) => `batch ${d}`),
    ];
  }

  const patch = files["patch.oui"];
  if (patch === undefined) return check(id, expected, parse(files["input.oui"]));
  const merged = mergeStatements(files["input.oui"], patch);
  const statements = merged.split("\n").flatMap((l) => /^(\$?\w+)\s*=(?!=)/.exec(l)?.[1] ?? []);
  return check(id, expected, parse(merged), statements);
}

function runValidation(files: Record<string, string>): string[] {
  const { cases } = JSON.parse(files["validation.json"]) as {
    cases: { rules: unknown; value: unknown; valid: boolean }[];
  };
  return cases.flatMap(({ rules, value, valid }, i) => {
    const error = validate(value, parseStructuredRules(rules));
    if ((error === undefined) === valid) return [];
    return [
      `case ${i} ${JSON.stringify(rules)} ${JSON.stringify(value)}: got ${JSON.stringify(error)}`,
    ];
  });
}

// ─── Registration ───

const results: Record<string, { status: string; diffs?: string[] }> = {};

describe("OpenUI conformance fixtures", () => {
  for (const area of dirs()) {
    for (const name of dirs(area)) {
      const id = `${area}/${name}`;
      it(id, () => {
        const files = Object.fromEntries(
          fs.readdirSync(path.join(FIXTURES_DIR, id)).map((f) => [f, read(id, f)]),
        );
        const diffs = files["validation.json"] ? runValidation(files) : runProgram(id, files);
        results[id] = diffs.length ? { status: "fail", diffs } : { status: "pass" };
        if (diffs.length) expect.fail(`${id}\n  ${diffs.join("\n  ")}`);
      });
    }
  }

  // OPENUI_CONFORMANCE_REPORT=<file> writes `{ "<id>": { status, diffs? } }`.
  afterAll(() => {
    const report = process.env.OPENUI_CONFORMANCE_REPORT;
    if (report) fs.writeFileSync(report, JSON.stringify(results, null, 2) + "\n");
  });
});
