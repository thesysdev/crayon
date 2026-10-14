// Generation eval: sends each case's request to the model with the kit's full
// system prompt (the same one the generate route builds), then scores the
// program offline. Needs THESYS_API_KEY or OPENAI_API_KEY in .env.local.
//
//   npm run eval                      every case
//   npm run eval -- week-why profit   only these cases
import { createParser } from "@openuidev/react-lang";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { getKit } from "../../src/kits/index";
import { modelClient } from "../../src/kits/llm";
import { buildSystemPrompt, getKitSpec } from "../../src/kits/server";
import { CASES, type EvalCase } from "./cases";

/** A figure typed into a string, such as "$1.2M", "18%", or "3.4x", instead of read from a tool. */
const TYPED_FIGURE = /\$\s?\d|\d(?:[.,]\d+)?\s?(?:%|x\b|[KM]\b)/;

interface Score {
  id: string;
  kit: string;
  seconds: number;
  statements: number;
  queries: string[];
  checks: Record<"parses" | "knownTools" | "neededTools" | "noTypedFigures", boolean>;
  problems: string[];
  typedFigures: string[];
  response: string;
}

function score(c: EvalCase, response: string, seconds: number): Score {
  const kit = getKit(c.kit)!;
  const spec = getKitSpec(c.kit);
  const result = createParser(spec.schema as any, spec.root).parse(response);
  const { errors, unresolved, orphaned } = result.meta;
  const problems = [
    ...errors.map((e) => `${e.code}: ${e.message}`),
    ...unresolved.map((name) => `unresolved reference: ${name}`),
    ...orphaned.map((name) => `orphaned statement: ${name}`),
  ];
  const queries = result.queryStatements.map(
    (q) => (q.toolAST as { v?: string } | null)?.v ?? "(dynamic)",
  );
  const known = new Set(kit.tools.map((t) => t.name));
  const unknown = queries.filter((q) => !known.has(q));
  unknown.forEach((q) => problems.push(`unknown tool: ${q}`));
  const missing = c.tools.filter((anyOf) => !anyOf.some((t) => queries.includes(t)));
  missing.forEach((anyOf) => problems.push(`needed one of: ${anyOf.join(", ")}`));
  const typedFigures = [...response.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => m[1])
    .filter((text) => TYPED_FIGURE.test(text));
  return {
    id: c.id,
    kit: c.kit,
    seconds,
    statements: result.meta.statementCount,
    queries,
    checks: {
      parses: errors.length + unresolved.length + orphaned.length === 0,
      knownTools: unknown.length === 0,
      neededTools: missing.length === 0,
      noTypedFigures: typedFigures.length === 0,
    },
    problems,
    typedFigures,
    response,
  };
}

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const llm = modelClient();
if (!llm) {
  console.error("Set THESYS_API_KEY or OPENAI_API_KEY in .env.local first.");
  process.exit(2);
}

const only = new Set(process.argv.slice(2));
const cases = CASES.filter((c) => !only.size || only.has(c.id));
const scores: Score[] = [];
for (const c of cases) {
  const started = Date.now();
  let response: string;
  try {
    const completion = await llm.openai.chat.completions.create({
      model: llm.model,
      messages: [
        { role: "system", content: buildSystemPrompt(getKit(c.kit)!) },
        { role: "user", content: c.prompt },
      ],
    });
    response = completion.choices[0]?.message?.content ?? "";
  } catch (error) {
    console.error(`${c.id}: the model API refused the request: ${(error as Error).message}`);
    process.exit(2);
  }
  const s = score(c, response, (Date.now() - started) / 1000);
  scores.push(s);
  const passed = Object.values(s.checks).filter(Boolean).length;
  console.log(
    `${passed === 4 ? "✓" : "✗"} ${c.kit}/${c.id}: ${passed}/4 · ${s.statements} statements · ${s.queries.length} queries · ${s.seconds.toFixed(1)}s`,
  );
  for (const p of s.problems) console.log(`    ${p}`);
  if (s.typedFigures.length) console.log(`    typed figures: ${s.typedFigures.join(" · ")}`);
}

const total = scores.reduce((n, s) => n + Object.values(s.checks).filter(Boolean).length, 0);
console.log(`\n${total}/${scores.length * 4} checks passed · model ${llm.model}`);
mkdirSync("eval-results", { recursive: true });
const file = `eval-results/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ model: llm.model, scores }, null, 2));
console.log(`Saved ${file}`);
