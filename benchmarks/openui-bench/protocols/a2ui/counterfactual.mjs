// Counterfactual renderer gate: what if A2UI's web renderer applied components
// individually instead of per-message all-or-nothing?
// Same official @a2ui/web_core validation, atomicity removed: every component in
// an updateComponents message is wrapped in its own single-component message.
// Reports, for each run the atomic gate scored blank, whether anything paints.
// Usage: A2UI_PYTHON=<venv python> node counterfactual.mjs <label> [label ...]
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { evalA2uiRenderer, scoreRaw } from "./validator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_ROOT = join(__dirname, "../../raw");
const RESULTS_ROOT = join(__dirname, "../../results");
const LABELS = process.argv.slice(2);

if (!LABELS.length) {
  console.error("usage: node counterfactual.mjs <label> [label ...]");
  process.exit(2);
}

function explode(messages) {
  // One component per message; non-update messages pass through unchanged.
  const out = [];
  for (const m of messages) {
    const upd = m.updateComponents;
    if (!upd?.components?.length) {
      out.push(m);
      continue;
    }
    for (const c of upd.components) out.push({ ...m, updateComponents: { ...upd, components: [c] } });
  }
  return out;
}

const totals = { blanks: 0, stillBlank: 0, partial: 0, painted: [] };
for (const label of LABELS) {
  const rows = JSON.parse(readFileSync(join(RESULTS_ROOT, `results-${label}.json`), "utf8"));
  const blanks = rows.filter((r) => (r.fmt ?? "a2ui") === "a2ui" && !r.renderable);
  let stillBlank = 0;
  const details = [];
  for (const row of blanks) {
    const s = scoreRaw(join(RAW_ROOT, label, `a2ui__${row.scenario}__r${row.repeat}.txt`));
    const rend = evalA2uiRenderer(explode(s.messages ?? []));
    const paints = Boolean(rend.rootPresent && rend.componentCount > 0);
    if (!paints) stillBlank += 1;
    else {
      const frac = s.components_total ? rend.componentCount / s.components_total : 0;
      totals.painted.push(frac);
      details.push(`${row.scenario} r${row.repeat}: ${rend.componentCount}/${s.components_total} components paint`);
    }
  }
  totals.blanks += blanks.length;
  totals.stillBlank += stillBlank;
  totals.partial += blanks.length - stillBlank;
  console.log(`${label.padEnd(8)} blanks ${blanks.length}  still-blank ${stillBlank}  would-paint-partially ${blanks.length - stillBlank}`);
  for (const d of details) console.log(`  ${d}`);
}
const avg = totals.painted.length ? (100 * totals.painted.reduce((a, b) => a + b, 0)) / totals.painted.length : 0;
console.log(
  `\nTOTAL: ${totals.blanks} atomic blanks -> ${totals.stillBlank} still blank, ${totals.partial} paint partially (avg ${avg.toFixed(0)}% of the screen's components)`,
);
