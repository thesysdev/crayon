// Offline scorer: replays every committed raw through each protocol's own
// validator and writes results/results-<label>.json. Needs no API keys, so
// anyone can rescore the published data and diff the verdicts.
//
// Usage: node score.mjs [label ...]        (default: every label under raw/)
// Env:   A2UI_PYTHON  python with the official A2UI agent SDK installed
//        BENCH_MAX_REP  score repeats <= N (default 4, the published rule)
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SCENARIOS } from "./briefs/briefs.mjs";
import { evaluate as evalOpenui } from "./protocols/openui/validator.ts";
import { evaluate as evalJr } from "./protocols/jsonrender/validator.ts";
import { evalA2ui } from "./protocols/a2ui/validator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "raw");
const briefByName = new Map(SCENARIOS.map((s) => [s.name, s]));
const MAXREP = Number(process.env.BENCH_MAX_REP) || 4;

const args = process.argv.slice(2);
if (args.some((a) => a.startsWith("-"))) {
  console.error("usage: node score.mjs [label ...]   (labels are directories under raw/)");
  process.exit(2);
}
const labels = args.length ? args : readdirSync(RAW).sort();
for (const label of labels) {
  if (!existsSync(join(RAW, label))) {
    console.error(`no raw/${label}/ directory; labels: ${readdirSync(RAW).sort().join(", ")}`);
    process.exit(2);
  }
}

// A2UI scoring shells to the official python SDK. Probe once so a missing venv
// degrades to skipping a2ui rows instead of crashing mid-scoring.
let a2uiReady = true;

// Row order in the results files: openui, a2ui, jsonrender, each sorted by
// filename. Keep stable so rescoring committed raws reproduces the committed
// results byte for byte.
const FMT_RANK = { openui: 0, a2ui: 1, jsonrender: 2 };

for (const label of labels) {
  const rows = [];
  // Recorded output-token counts survive rescoring; they come from the
  // generation-time API usage fields, which raws cannot carry.
  const prevTokens = new Map();
  const resultsPath = join(__dirname, `results/results-${label}.json`);
  if (existsSync(resultsPath)) {
    for (const r of JSON.parse(readFileSync(resultsPath, "utf8"))) {
      prevTokens.set(`${r.fmt}__${r.scenario}__r${r.repeat}`, r.tokens ?? null);
    }
  }

  const dir = join(RAW, label);
  const truncPath = join(dir, "truncated.json");
  const truncated = new Set(existsSync(truncPath) ? JSON.parse(readFileSync(truncPath, "utf8")) : []);
  const files = readdirSync(dir)
    .map((f) => ({ f, m: f.match(/^(openui|jsonrender|a2ui)__(.+)__r(\d+)\.txt$/) }))
    .filter((x) => x.m)
    .sort((a, b) => FMT_RANK[a.m[1]] - FMT_RANK[b.m[1]] || a.f.localeCompare(b.f));
  for (const { f, m } of files) {
    const [, fmt, scn, r] = m;
    if (Number(r) > MAXREP) continue;
    if (!briefByName.has(scn)) continue;
    const id = `${fmt}__${scn}__r${r}`;
    const reqs = briefByName.get(scn)?.reqs ?? 0;
    const path = join(dir, f);
    const text = readFileSync(path, "utf8");
    if (fmt === "a2ui" && !a2uiReady) continue;
    let res;
    try {
      res =
        fmt === "openui"
          ? evalOpenui(text, { truncated: truncated.has(id), reqs })
          : fmt === "jsonrender"
            ? evalJr(text, { reqs })
            : evalA2ui(path, { reqs });
    } catch (e) {
      if (fmt === "a2ui") {
        a2uiReady = false;
        console.error(
          `a2ui scoring unavailable (${String(e.message).split("\n")[0].slice(0, 80)}). ` +
            "Set A2UI_PYTHON to a venv with the official SDK (see README); skipping a2ui rows.",
        );
        continue;
      }
      throw e;
    }
    rows.push({
      fmt,
      scenario: scn,
      axis: briefByName.get(scn)?.axis ?? "",
      repeat: Number(r),
      tokens: prevTokens.get(id) ?? null,
      renderable: res.renderable,
      complete: res.complete,
      errs: res.errs,
      classes: res.classes ?? [...new Set(res.errs.map((e) => e.cls))],
      ...(res.n !== undefined ? { n: res.n } : {}),
    });
  }

  if (a2uiReady) {
    writeFileSync(resultsPath, JSON.stringify(rows, null, 1));
  } else {
    console.error(`${label}: a2ui rows were skipped; ${resultsPath} left untouched.`);
  }

  const fmts = {};
  for (const row of rows) {
    const o = (fmts[row.fmt] ??= { n: 0, complete: 0, renderable: 0, fails: {} });
    o.n++;
    if (row.complete) o.complete++;
    if (row.renderable) o.renderable++;
    if (!row.complete) for (const c of row.classes) o.fails[c] = (o.fails[c] || 0) + 1;
  }
  console.log(`== ${label}`);
  for (const [f, o] of Object.entries(fmts)) {
    const pct = ((100 * o.complete) / o.n).toFixed(1);
    console.log(
      `${f.padEnd(12)} complete ${o.complete}/${o.n} (${pct}%)  renderable ${o.renderable}/${o.n}  ${JSON.stringify(o.fails)}`,
    );
  }
}
