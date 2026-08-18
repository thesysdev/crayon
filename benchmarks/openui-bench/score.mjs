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

const labels = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [...new Set(readdirSync(RAW).filter((d) => d.endsWith("-native")).map((d) => d.replace(/-native$/, "")))];

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

  for (const kind of ["native", "official"]) {
    const dir = join(RAW, `${label}-${kind}`);
    if (!existsSync(dir)) continue;
    const truncPath = join(dir, "truncated.json");
    const truncated = new Set(existsSync(truncPath) ? JSON.parse(readFileSync(truncPath, "utf8")) : []);
    for (const f of readdirSync(dir).sort()) {
      const m = f.match(/^(openui|jsonrender|a2ui)__(.+)__r(\d+)\.txt$/);
      if (!m) continue;
      const [, fmt, scn, r] = m;
      if (Number(r) > MAXREP) continue;
      if (!briefByName.has(scn)) continue;
      const id = `${fmt}__${scn}__r${r}`;
      const reqs = briefByName.get(scn)?.reqs ?? 0;
      const path = join(dir, f);
      const text = readFileSync(path, "utf8");
      const res =
        fmt === "openui"
          ? evalOpenui(text, { truncated: truncated.has(id), reqs })
          : fmt === "jsonrender"
            ? evalJr(text, { reqs })
            : evalA2ui(path, { reqs });
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
  }

  writeFileSync(resultsPath, JSON.stringify(rows, null, 1));

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
