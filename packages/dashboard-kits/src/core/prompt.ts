import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { BASE_RULES, DATA_RULES } from "./base-prompt";
import { toToolSpec, type KitDefinition } from "./kit";

/** A tool implementation: validated arguments in, a result matching the output schema out. */
export type ToolHandler = (args: any) => unknown;

/**
 * The full self-hosted system prompt for one kit: its library spec (written by
 * `openui generate --spec` from the kit's library), its tools, the base and
 * data rules, its own rules, and its gallery dashboards as worked examples.
 */
export function buildSystemPrompt(kit: KitDefinition, spec: LibrarySpec): string {
  const { schema: _schema, ...rest } = spec;
  return generateSystemPrompt({
    ...rest,
    tools: kit.tools.map(toToolSpec),
    preamble: kit.preamble,
    additionalRules: [...BASE_RULES, ...DATA_RULES, ...kit.rules],
    toolExamples: kit.gallery
      .filter((dashboard) => dashboard.example !== false)
      .map((dashboard) => dashboard.program),
  });
}

/** Validates the arguments, runs the handler, and validates its result against the contract. */
export function runTool(
  kit: KitDefinition,
  toolName: string,
  args: unknown,
  handlers: Record<string, ToolHandler>,
): unknown {
  const tool = kit.tools.find((t) => t.name === toolName);
  const handler = handlers[toolName];
  if (!tool || !handler) throw new Error(`Unknown tool: ${kit.id}/${toolName}`);
  return tool.output.parse(handler(tool.input.parse(args ?? {})));
}
