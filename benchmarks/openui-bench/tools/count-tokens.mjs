// Token accounting behind the blog's token chart: each protocol's system
// prompt (from its own generator) and the mean output per screen over the
// committed raws, first 4 repeats, all models. tiktoken o200k.
// Usage: node tools/count-tokens.mjs [model ...]
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { get_encoding } from "tiktoken";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const enc = get_encoding("o200k_base");
const tok = (s) => enc.encode(s).length;

const { systemPrompt: openuiPrompt } = await import(join(ROOT, "protocols/openui/prompt.ts"));
const { systemPrompt: jrPrompt } = await import(join(ROOT, "protocols/jsonrender/prompt.ts"));
const a2uiPrompt = readFileSync(join(ROOT, "protocols/a2ui/system-prompt.txt"), "utf8");

console.log(`prompt openui: ${tok(openuiPrompt())} tokens`);
console.log(`prompt jsonrender: ${tok(jrPrompt())} tokens`);
console.log(`prompt a2ui: ${tok(a2uiPrompt)} tokens`);

const MODELS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["sol", "opus48", "kimi", "gemini", "qwen", "muse"];

for (const fmt of ["openui", "jsonrender", "a2ui"]) {
  let sum = 0;
  let n = 0;
  for (const m of MODELS) {
    const dir = join(ROOT, "raw", m);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      const match = f.match(new RegExp(`^${fmt}__.+__r(\\d+)\\.txt$`));
      if (!match || Number(match[1]) > 4) continue;
      sum += tok(readFileSync(join(dir, f), "utf8"));
      n++;
    }
  }
  console.log(`output ${fmt}: mean ${Math.round(sum / n)} tokens over ${n} runs`);
}
enc.free();
