import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "./catalog.ts";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const core = require(join(HERE, "../../../../packages/lang-core/dist/index.cjs"));

export type BenchError = { cls: string; detail: string };

export type Verdict = {
  renderable: boolean;
  complete: boolean;
  n: number;
  errs: BenchError[];
};

// The parser only needs shapes: "refs" and "array" are both plain arrays to it, and
// a "ref" slot accepts anything, so component-valued slots carry no item schema.
function openuiSchema() {
  const $defs: Record<string, any> = {};
  for (const [name, c] of Object.entries(CATALOG)) {
    const properties: Record<string, any> = {};
    for (const [pn, s] of c.props) {
      if (s.t === "refs" || s.t === "array") properties[pn] = { type: "array", items: {} };
      else if (s.t === "ref") properties[pn] = {};
      else {
        properties[pn] = { type: s.t };
        if (s.enum) properties[pn].enum = s.enum;
      }
    }
    $defs[name] = {
      type: "object",
      properties,
      required: c.props.filter(([, s]) => s.req).map(([n]) => n),
      additionalProperties: false,
      description: c.desc,
    };
  }
  return { type: "object", properties: {}, additionalProperties: false, $defs };
}

const parser = core.createParser(openuiSchema());

// Lenient prop lookup: accept props both under .props and at the node level, as a
// tolerant renderer would. EXCEPT the reserved wire keys type and id, where the
// fallback would read a discriminator as a prop value and invent enum errors.
export function getProp(c: any, pn: string) {
  if (c.props?.[pn] !== undefined) return c.props[pn];
  if (pn === "type" || pn === "id") return undefined;
  return c[pn];
}

function checkNode(node: any, errs: BenchError[]) {
  const cat = CATALOG[node.type];
  if (!cat) {
    errs.push({ cls: "hallucinated-component", detail: node.type });
    return; // props of an unknown component are unknowable
  }
  for (const [pn, s] of cat.props) {
    const v = getProp(node, pn);
    if (s.req && (v === undefined || v === null || (Array.isArray(v) && v.length === 0))) {
      errs.push({ cls: "required-field", detail: `${node.type}.${pn}` });
    }
    if (s.enum && v !== undefined && v !== null && !s.enum.includes(v)) {
      errs.push({
        cls: "enum-mismatch",
        detail: `${node.type}.${pn}=${JSON.stringify(v).slice(0, 30)}`,
      });
    }
  }
}

// Local reasoning models emit thinking inline; API models return it in a separate
// field the bench never sees. Stripping keeps the two paths equivalent.
function stripThink(t: string) {
  return t.includes("</think>") ? t.replace(/^[\s\S]*?<\/think>\s*/, "") : t;
}

function walkOpenui(node: any, errs: BenchError[], seen: Set<any>) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((n) => walkOpenui(n, errs, seen));
  if (node.type === "element" && typeof node.typeName === "string") {
    if (!seen.has(node)) {
      seen.add(node);
      checkNode({ type: node.typeName, props: node.props ?? {} }, errs);
    }
  }
  const props = node.type === "element" ? node.props : node;
  if (props && typeof props === "object")
    for (const v of Object.values(props)) walkOpenui(v, errs, seen);
}

function evalOpenui(text: string, truncated: boolean): Verdict {
  const out: Verdict = { renderable: false, complete: false, n: 0, errs: [] };
  let r: any;
  try {
    r = parser.parse(text);
  } catch (e: any) {
    out.errs.push({ cls: "malformed-syntax", detail: String(e?.message).slice(0, 60) });
    return out;
  }
  if (!r.root) {
    out.errs.push({ cls: "root-missing", detail: "no root element" });
    return out;
  }
  out.renderable = true;
  // Object literals in typed slots surface as an unresolved ref literally named
  // "undefined". A real dangling reference must appear as a token in the text, so
  // when "undefined" is written nowhere the entry is a parser artifact.
  const hasBareUndefined = /(?<![\w"])undefined(?![\w"])/.test(text);
  for (const u of r.meta.unresolved) {
    if (u === "undefined" && !hasBareUndefined) continue;
    out.errs.push({ cls: "reference-graph", detail: `dangling:${u}` });
  }
  for (const o of r.meta.orphaned) out.errs.push({ cls: "reference-graph", detail: `orphan:${o}` });
  for (const e of r.meta.errors) {
    const cls =
      e.code === "unknown-component"
        ? "hallucinated-component"
        : e.code === "missing-required" || e.code === "null-required"
          ? "required-field"
          : e.code === "excess-args"
            ? "signature-mismatch"
            : "other";
    out.errs.push({ cls, detail: `${e.component ?? ""}${e.path ?? ""}` });
  }
  const seen = new Set<any>();
  walkOpenui(r.root, out.errs, seen); // enum/required checks on the rendered tree
  out.n = seen.size; // components reachable from root
  if (truncated) out.errs.push({ cls: "truncation", detail: "hit ceiling" });
  out.complete = out.errs.length === 0;
  return out;
}

// Fences are not stripped here: the parser extracts fenced code itself.
export function evaluate(text: string, opts: { truncated?: boolean; reqs?: number } = {}): Verdict {
  const out = evalOpenui(stripThink(text), opts.truncated === true);
  // Coverage floor: a complete screen must define at least as many components as
  // the brief has requirements, so a trivially small valid output cannot pass.
  if (out.complete && Number.isFinite(out.n) && out.n < (opts.reqs ?? 0)) {
    out.errs.push({
      cls: "coverage-floor",
      detail: `components ${out.n} < requirements ${opts.reqs}`,
    });
    out.complete = false;
  }
  return out;
}
