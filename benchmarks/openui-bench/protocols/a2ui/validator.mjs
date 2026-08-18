// A2UI evaluation stage 2: the official @a2ui/web_core (v0_9) renderer gate,
// merged with the row verdict built from score.py's official SDK output.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// @a2ui/web_core composes its schemas with its own bundled zod v3; mixing in
// another zod instance fails its schema checks, so both come from its install.
function webCoreBase() {
  if (process.env.A2UI_WEBCORE_DIR) {
    return pathToFileURL(join(process.env.A2UI_WEBCORE_DIR, "/"));
  }
  try {
    return new URL("../../", import.meta.resolve("@a2ui/web_core/v0_9"));
  } catch {
    return new URL("../../node_modules/@a2ui/web_core/", import.meta.url);
  }
}

const WEBCORE = webCoreBase();
const {
  Catalog,
  MessageProcessor,
  ChildListSchema,
  ComponentIdSchema,
  DynamicStringSchema,
  DynamicNumberSchema,
  DynamicBooleanSchema,
} = await import(new URL("src/v0_9/index.js", WEBCORE).href);
const { z } = createRequire(new URL("package.json", WEBCORE))("zod");

const CATALOG = JSON.parse(
  readFileSync(process.env.BENCH_CATALOG ?? join(__dirname, "catalog-surface.json"), "utf8"),
);
// Fallback for messages that declare no catalogId. Single-sourced from the
// compiled catalog so the renderer gate cannot drift from the prompt.
const CATALOG_ID = JSON.parse(
  readFileSync(process.env.A2UI_CATALOG ?? join(__dirname, "catalog-a2ui.json"), "utf8"),
).catalogId;
const PY = process.env.A2UI_PYTHON ?? "python3";

// Scalar props take web_core's Dynamic* schemas: a2ui props are data-bindable
// by design, so a literal-only schema would reject valid bindings.
function zodFor(ty) {
  switch (ty.t) {
    case "string":
      return ty.enum ? z.enum(ty.enum) : DynamicStringSchema;
    case "number":
      return DynamicNumberSchema;
    case "boolean":
      return DynamicBooleanSchema;
    case "array":
      return z.array(z.any());
    case "ref":
      return ComponentIdSchema;
    case "refs":
      return z.array(ComponentIdSchema);
    default:
      return z.any();
  }
}

const components = Object.entries(CATALOG).map(([name, def]) => {
  const shape = {
    weight: z.union([z.number(), z.literal("initial")]).optional(),
    accessibility: z.any().optional(),
  };
  for (const [pn, ty] of def.props) {
    if (pn === "children") {
      shape.children = ChildListSchema.optional();
      continue;
    }
    const base = zodFor(ty);
    shape[pn] = ty.req ? base : base.optional();
  }
  return { name, schema: z.object(shape) };
});

export function evalA2uiRenderer(messages) {
  const catalogId =
    messages.find((m) => m?.createSurface?.catalogId)?.createSurface?.catalogId ?? CATALOG_ID;
  const catalog = new Catalog(catalogId, components);
  const processor = new MessageProcessor([catalog], undefined, { version: "v0.9" });
  const out = { applied: 0, rejected: [], surfaces: 0, rootPresent: false, componentCount: 0 };

  // Per-message atomicity is the renderer's own semantic: one invalid component
  // rejects the whole message. Messages are fed one by one so a rejected
  // message does not hide later valid ones.
  for (const msg of messages) {
    try {
      processor.processMessages([msg]);
      out.applied += 1;
    } catch (e) {
      out.rejected.push(`${e.constructor?.name ?? "Error"}: ${String(e.message).slice(0, 140)}`);
    }
  }

  const list = [...processor.model.surfacesMap.values()];
  out.surfaces = list.length;
  for (const s of list) {
    for (const [id] of s.componentsModel.entries) {
      out.componentCount += 1;
      if (id === "root") out.rootPresent = true;
    }
  }
  return out;
}

export function rowFromScore(s, { reqs = 0 } = {}) {
  const errs = [];
  if (!s.parse_ok) errs.push({ cls: "malformed-syntax", detail: (s.errors?.[0] ?? "parse failed").slice(0, 100) });
  // Full-payload SDK validation exceptions (envelope, topology) are recorded
  // even when parsing succeeded; consume them so they cannot vanish.
  if (s.parse_ok) {
    for (const err of s.errors ?? []) {
      const msg = String(err);
      let cls = "malformed-syntax";
      if (/enum|one of|allowed values|const/i.test(msg)) cls = "enum-mismatch";
      else if (/required/i.test(msg)) cls = "required-field";
      errs.push({ cls, detail: msg.slice(0, 100) });
    }
  }
  for (const u of s.unknown_component_types ?? []) errs.push({ cls: "hallucinated-component", detail: String(u).slice(0, 60) });
  for (const ic of s.invalid_components ?? []) {
    const msg = String(ic.error ?? "invalid");
    let cls = "malformed-syntax";
    if (/enum|one of|allowed values|const/i.test(msg)) cls = "enum-mismatch";
    else if (/required/i.test(msg)) cls = "required-field";
    else if (/type/i.test(msg)) cls = "signature-mismatch";
    errs.push({ cls, detail: `${ic.id ?? "?"}: ${msg.slice(0, 90)}` });
  }
  for (const d of s.dangling_refs ?? []) errs.push({ cls: "reference-graph", detail: `dangling:${d}` });
  for (const o of s.orphaned_ids ?? []) errs.push({ cls: "reference-graph", detail: `orphan:${o}` });

  const rend = evalA2uiRenderer(s.messages ?? []);
  for (const r of rend.rejected) errs.push({ cls: "renderer-rejected", detail: r.slice(0, 120) });
  if (!rend.rootPresent) errs.push({ cls: "root-missing", detail: "renderer surface has no root" });
  if (rend.componentCount < (s.components_total ?? 0) && rend.rejected.length === 0) {
    errs.push({ cls: "renderer-dropped", detail: `rendered ${rend.componentCount}/${s.components_total}` });
  }
  const renderable = Boolean(rend.rootPresent && rend.componentCount > 0);
  const res = {
    renderable,
    complete: renderable && errs.length === 0,
    errs,
    classes: [...new Set(errs.map((e) => e.cls))],
    n: s.components_total ?? 0,
  };
  // Coverage floor: a complete screen must define at least as many components
  // as the brief has requirements.
  if (res.complete && Number.isFinite(res.n) && res.n < reqs) {
    res.errs.push({ cls: "coverage-floor", detail: `components ${res.n} < requirements ${reqs}` });
    res.complete = false;
    res.classes = [...new Set(res.errs.map((e) => e.cls))];
  }
  return res;
}

// Stage 1: the official python SDK scorer, which owns parsing and healing.
export function scoreRaw(rawPath) {
  return JSON.parse(execFileSync(PY, [join(__dirname, "score.py"), rawPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
}

export function evalA2ui(rawPath, opts) {
  return rowFromScore(scoreRaw(rawPath), opts);
}

// CLI: A2UI_PYTHON=<venv python> node validator.mjs <raw.txt> [reqs]
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  const reqs = Number(process.argv[3]) || 0;
  console.log(JSON.stringify(evalA2ui(process.argv[2], { reqs }), null, 1));
}
