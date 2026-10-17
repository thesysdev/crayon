// Contract check for every kit: gallery dashboards parse cleanly against the
// kit's library and only call the kit's tools, every tool returns data that
// matches its declared output, and the system prompt builds.
// Run `npm run generate` first.
import { createParser } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { KITS } from "../src/kits/index";
import { buildSystemPrompt, getKitSpec, runTool } from "../src/kits/server";

/** The defaults, plus one call per value of every enum or literal argument. */
function argumentSets(input: z.ZodObject): Record<string, unknown>[] {
  const sets: Record<string, unknown>[] = [{}];
  for (const [key, field] of Object.entries(input.shape)) {
    let inner: z.ZodType = field as z.ZodType;
    while (inner instanceof z.ZodDefault || inner instanceof z.ZodOptional)
      inner = inner.unwrap() as z.ZodType;
    const values =
      inner instanceof z.ZodEnum
        ? inner.options
        : inner instanceof z.ZodUnion
          ? inner.options.flatMap((o) => (o instanceof z.ZodLiteral ? [...o.values] : []))
          : [];
    for (const value of values) sets.push({ [key]: value });
  }
  return sets;
}

/**
 * Prompt size ceilings in characters. Every token of the prompt is paid on each
 * generation and dilutes the rules, so a kit change that grows it past the
 * ceiling has to trim something else first. Both kits, fully built, share one
 * ceiling (the plans aimed for 60,000).
 */
const PROMPT_BUDGET: Record<string, number> = {
  ecommerce: 64_000,
  analytics: 64_000,
};

let failures = 0;
const fail = (message: string) => {
  failures++;
  console.log(`  ✗ ${message}`);
};

for (const kit of KITS) {
  console.log(`\n${kit.name} (${kit.id})`);
  const spec = getKitSpec(kit.id);
  const parser = createParser(spec.schema as any, spec.root);
  const toolNames = new Set(kit.tools.map((t) => t.name));

  for (const dashboard of kit.gallery) {
    const result = parser.parse(dashboard.program);
    const { errors, unresolved, orphaned, incomplete } = result.meta;
    const problems = [
      ...errors.map((e) => `${e.code}: ${e.message}`),
      ...unresolved.map((name) => `unresolved reference: ${name}`),
      ...orphaned.map((name) => `orphaned statement: ${name}`),
      ...(incomplete ? ["program is incomplete"] : []),
    ];
    const queries = result.queryStatements.map(
      (q) => (q.toolAST as { v?: string } | null)?.v ?? "(dynamic)",
    );
    for (const name of queries) {
      if (!toolNames.has(name)) problems.push(`Query calls unknown tool: ${name}`);
    }
    if (problems.length) problems.forEach((p) => fail(`gallery "${dashboard.title}": ${p}`));
    else
      console.log(
        `  ✓ gallery "${dashboard.title}": ${result.meta.statementCount} statements, ${queries.length} queries`,
      );
  }

  let calls = 0;
  for (const tool of kit.tools) {
    for (const args of argumentSets(tool.input)) {
      calls++;
      try {
        runTool(kit.id, tool.name, args);
      } catch (error) {
        fail(`${tool.name}(${JSON.stringify(args)}): ${(error as Error).message.slice(0, 300)}`);
      }
    }
  }
  console.log(
    `  ✓ ${kit.tools.length} tools, ${calls} calls covering every argument value, match their output schemas`,
  );

  const prompt = buildSystemPrompt(kit);
  const budget = PROMPT_BUDGET[kit.id];
  if (budget && prompt.length > budget)
    fail(
      `system prompt: ${prompt.length.toLocaleString()} characters, over the ${budget.toLocaleString()} budget`,
    );
  else
    console.log(
      `  ✓ system prompt: ${prompt.length.toLocaleString()} of ${budget?.toLocaleString() ?? "no"} budget characters`,
    );
}

console.log(failures ? `\n${failures} problem(s) found` : "\nAll kits pass");
process.exit(failures ? 1 : 0);
