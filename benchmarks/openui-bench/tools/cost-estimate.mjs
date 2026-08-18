// API cost of the benchmark runs per model x format at provider list prices:
// sum over runs of (system prompt + brief) input tokens plus output tokens
// from the raws. Per-pass = total / repeats. Thinking models' hidden reasoning
// tokens are not in raws, so real bills run slightly higher. Sol has no public
// list price and is omitted.
// Usage: node tools/cost-estimate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { get_encoding } from "tiktoken";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const enc = get_encoding("o200k_base");
const tok = (s) => enc.encode(s).length;

const { SCENARIOS } = await import(join(ROOT, "briefs/briefs.mjs"));
const briefTok = Object.fromEntries(SCENARIOS.map((s) => [s.name, tok(s.prompt) + 20]));

const { systemPrompt: openuiPrompt } = await import(join(ROOT, "protocols/openui/prompt.ts"));
const { systemPrompt: jrPrompt } = await import(join(ROOT, "protocols/jsonrender/prompt.ts"));
const SYS = {
  openui: tok(openuiPrompt()),
  jsonrender: tok(jrPrompt()),
  a2ui: tok(readFileSync(join(ROOT, "protocols/a2ui/system-prompt.txt"), "utf8")),
};

// USD per token (provider list prices).
const PRICE = {
  gemini: { in: 0.75e-6, out: 3.75e-6 },
  kimi: { in: 3e-6, out: 15e-6 },
  opus48: { in: 5e-6, out: 25e-6 },
  muse: { in: 1.25e-6, out: 4.25e-6 },
  qwen: { in: 2e-6, out: 6e-6 },
};

const money = (x) => `$${x.toFixed(2)}`;
let grand = 0;
for (const model of Object.keys(PRICE)) {
  let modelTotal = 0;
  const parts = [];
  for (const fmt of ["openui", "jsonrender", "a2ui"]) {
    const dir = join(ROOT, "raw", `${model}-${fmt === "openui" ? "native" : "official"}`);
    const files = readdirSync(dir).filter((f) => f.startsWith(`${fmt}__`));
    let inTok = 0;
    let outTok = 0;
    const reps = new Set();
    for (const f of files) {
      const [, scn, rep] = f.match(/^\w+__(.+)__r(\d+)\.txt$/) ?? [];
      if (!scn) continue;
      reps.add(rep);
      inTok += SYS[fmt] + (briefTok[scn] ?? 170);
      outTok += tok(readFileSync(join(dir, f), "utf8"));
    }
    const cost = inTok * PRICE[model].in + outTok * PRICE[model].out;
    modelTotal += cost;
    parts.push(
      `${fmt} ${money(cost)} total / ${money(cost / reps.size)} per pass (${files.length} runs)`,
    );
  }
  grand += modelTotal;
  console.log(`${model}: ${money(modelTotal)}  ->  ${parts.join(" · ")}`);
}
console.log(`TOTAL: ${money(grand)}`);
enc.free();
