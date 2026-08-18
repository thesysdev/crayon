// Verdict for one json-render generation: their stream compiler replays the
// patches, then validateSpec (runtime gate) and catalog.validate (Zod catalog
// gate), plus the shared semantic layer every protocol in this harness runs.
//
// Two disclosed leniencies, both because the shipped runtime renders what the
// strict Zod gate rejects: fenced output is accepted, and children/visible are
// defaulted before the strict gate.
import { CATALOG, REF_PROP_NAMES, catalog, core } from "./catalog.ts";

const { createSpecStreamCompiler, validateSpec } = core;

export type EvalError = { cls: string; detail: string };
export type EvalResult = { renderable: boolean; complete: boolean; n?: number; errs: EvalError[] };

function extractJsonl(output: string): string[] {
  let text = output.trim();
  const fence = text.match(/```(?:jsonl?|json5)?\s*\n([\s\S]*?)```/);
  if (fence) text = fence[1];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("{") && l.endsWith("}"));
}

export function evaluate(text: string, opts: { reqs?: number } = {}): EvalResult {
  const errs: EvalError[] = [];
  const out: EvalResult = { renderable: false, complete: false, errs };
  const done = (): EvalResult => {
    out.complete = out.renderable && errs.length === 0;
    // Coverage floor: a complete screen must define at least as many components
    // as the brief has requirements.
    const reqs = opts.reqs ?? 0;
    if (out.complete && Number.isFinite(out.n) && (out.n as number) < reqs) {
      errs.push({ cls: "coverage-floor", detail: `components ${out.n} < requirements ${reqs}` });
      out.complete = false;
    }
    return out;
  };

  const lines = extractJsonl(text);
  if (lines.length === 0) {
    errs.push({ cls: "malformed-syntax", detail: "no JSON patch lines" });
    return done();
  }

  const compiler = createSpecStreamCompiler();
  let applied = 0;
  for (const line of lines) {
    try {
      compiler.push(`${line}\n`);
      applied += 1;
    } catch (err: any) {
      errs.push({ cls: "malformed-syntax", detail: `patch ${applied + 1}: ${err.message.slice(0, 80)}` });
      break; // their compiler threw: the stream is broken from here on
    }
  }

  const spec = compiler.getResult();
  if (!spec?.root) {
    errs.push({ cls: "root-missing", detail: "spec has no /root" });
    return done();
  }
  if (!spec.elements || Object.keys(spec.elements).length === 0) {
    errs.push({ cls: "root-missing", detail: "spec has no elements" });
    return done();
  }
  if (!spec.elements[spec.root]) {
    errs.push({ cls: "reference-graph", detail: `dangling:root:${spec.root}` });
    return done();
  }
  // The shipped React renderer draws null for a root whose type has no
  // registered component, so an unknown root type is a blank screen.
  if (!CATALOG[spec.elements[spec.root]?.type]) {
    errs.push({ cls: "root-missing", detail: `root type unregistered: ${spec.elements[spec.root]?.type}` });
    return done();
  }
  out.renderable = true;
  out.n = Object.keys(spec.elements).length;

  // Dangling children silently drop subtrees at render time.
  for (const [id, el] of Object.entries<any>(spec.elements)) {
    if (!Array.isArray(el?.children)) continue;
    for (const child of el.children) {
      if (typeof child === "string" && !spec.elements[child]) {
        errs.push({ cls: "reference-graph", detail: `dangling:${id}>${child}` });
      }
    }
  }

  // Reachability from root over children and ref-typed props: unreachable
  // elements never render, dangling refs break the component that holds them.
  const reached = new Set<string>();
  const queue: string[] = [spec.root];
  while (queue.length) {
    const id = queue.pop() as string;
    if (reached.has(id)) continue;
    reached.add(id);
    const el = spec.elements[id];
    if (!el) continue;
    for (const child of Array.isArray(el.children) ? el.children : []) {
      if (typeof child === "string") queue.push(child);
    }
    const refProps = REF_PROP_NAMES.get(el.type);
    if (refProps && el.props) {
      for (const pn of refProps) {
        const v = el.props[pn];
        for (const x of typeof v === "string" ? [v] : Array.isArray(v) ? v : []) {
          if (typeof x !== "string") continue;
          if (!spec.elements[x]) errs.push({ cls: "reference-graph", detail: `dangling:${id}.${pn}>${x}` });
          else queue.push(x);
        }
      }
    }
  }
  for (const id of Object.keys(spec.elements)) {
    if (!reached.has(id)) errs.push({ cls: "reference-graph", detail: `orphan:${id}` });
  }

  // Shared semantic completeness layer, identical rules for every protocol,
  // applied to the officially compiled spec. Needed because @json-render/core's
  // strict gate validates props as an untyped record when the catalog has more
  // than one component (buildZodType "propsOf" falls back to
  // z.record(z.unknown())), so enum and required-prop violations pass silently.
  for (const [id, el] of Object.entries<any>(spec.elements)) {
    if (!el || typeof el !== "object") {
      // A patch left a hole in the element map (for example an add into a child
      // path of a never-created element). The screen is missing that node:
      // score it, do not crash.
      errs.push({ cls: "reference-graph", detail: `undefined-element:${id}` });
      continue;
    }
    const def = CATALOG[el.type];
    if (!def) continue; // unknown type already flagged by catalog.validate
    const props = el.props ?? {};
    // json-render's native child slot is the top-level `children` array, and its
    // renderer draws it regardless of the catalog's slot name. When a component's
    // only ref-typed prop is absent but the element supplies `children`, credit
    // children as that slot.
    const refProps = def.props.filter(([pn, ty]) => (ty.t === "ref" || ty.t === "refs") && pn !== "children");
    const childAlias =
      refProps.length === 1 && props[refProps[0][0]] === undefined && Array.isArray(el.children)
        ? refProps[0][0]
        : null;
    for (const [pn, ty] of def.props) {
      if (pn === "children") continue;
      const v = pn === childAlias ? el.children : props[pn];
      if (ty.req && (v === undefined || v === null)) {
        errs.push({ cls: "required-field", detail: `${el.type}.${pn} missing (${id})` });
      } else if (ty.enum && typeof v === "string" && !ty.enum.includes(v)) {
        // Objects are json-render dynamic expressions ($state/$cond); their
        // runtime resolves those, so only literal strings are checked.
        errs.push({ cls: "enum-mismatch", detail: `${el.type}.${pn}=${JSON.stringify(v).slice(0, 40)}` });
      }
    }
  }

  // Leniency for the strict-vs-runtime validator divergence: their runtime
  // (validateSpec plus renderer) accepts childless leaves and missing `visible`,
  // only the strict Zod gate insists on them. Default both so this measures what
  // would render, not what the type definition insists on.
  for (const el of Object.values<any>(spec.elements)) {
    if (!el || typeof el !== "object") continue;
    if (el.children === undefined) el.children = [];
    if (el.visible === undefined) el.visible = true;
  }

  // validateSpec itself throws on specs with holes in the element map (their
  // walker reads .children of undefined). Their renderer would crash the same
  // way, so a throw is scored as malformed rather than crashing the harness.
  let runtime: any;
  try {
    runtime = validateSpec(spec);
  } catch (e: any) {
    errs.push({ cls: "malformed-syntax", detail: `validateSpec threw: ${String(e.message).slice(0, 60)}` });
    runtime = { valid: false, issues: [] };
  }
  if (!runtime.valid) {
    for (const issue of (runtime.issues ?? []).slice(0, 12)) {
      const msg = issue.message ?? "invalid";
      const cls = /references child|does not exist in the elements/.test(msg) ? "reference-graph" : "malformed-syntax";
      if (cls === "reference-graph") continue; // already recorded by the dangling-children walk
      errs.push({ cls, detail: `validateSpec ${issue.path ?? ""}: ${msg.slice(0, 80)}` });
    }
  }

  const result = catalog.validate(spec);
  if (!result.success) {
    for (const issue of (result.error?.issues ?? []).slice(0, 20)) {
      const path = (issue.path ?? []).join("/");
      let cls = "malformed-syntax";
      if (issue.code === "invalid_enum_value" || issue.code === "invalid_value") {
        cls = path.endsWith("/type") || path.endsWith("type") ? "hallucinated-component" : "enum-mismatch";
      } else if (issue.code === "invalid_type" && issue.received === "undefined") {
        cls = "required-field";
      } else if (issue.code === "invalid_type") {
        cls = "signature-mismatch";
      } else if (issue.code === "unrecognized_keys") {
        cls = "signature-mismatch";
      }
      errs.push({ cls, detail: `${path}: ${(issue.message ?? issue.code).slice(0, 80)}` });
    }
  }

  return done();
}
