import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { z } from "zod/v4";
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
  return tool.output.parse(handler(tool.input.parse(coerceArgs(tool.input, args ?? {}))));
}

/**
 * Brings arguments a model got slightly wrong to the nearest valid value
 * before validation. The prompt shows a tool's numbers as plain `number` and
 * some choices as `string`, so a model may ask for 12 weeks where 10 is the
 * most, or "ytd" where the periods are 7d, 30d, 90d, and mtd: the nearest
 * valid value answers it, where a rejection would leave a card empty.
 *
 * - numbers: rounded where the schema wants integers, clamped to its bounds;
 * - choices: matched without case; a period like "12m", "ytd", or "1y" goes to
 *   the closest day-count option ("90d"); anything else falls back to the
 *   field's default, or is dropped when the field is optional.
 */
export function coerceArgs(input: z.ZodType, args: unknown): unknown {
  if (!(input instanceof z.ZodObject) || args == null || typeof args !== "object") return args;
  const out: Record<string, unknown> = { ...(args as Record<string, unknown>) };
  for (const [key, field] of Object.entries(input.shape)) {
    const value = out[key];
    if (value == null) continue;
    let inner = field as z.ZodType;
    let fallback = false;
    while (inner instanceof z.ZodDefault || inner instanceof z.ZodOptional) {
      fallback = true;
      inner = inner.unwrap() as z.ZodType;
    }
    if (inner instanceof z.ZodNumber && typeof value === "number" && Number.isFinite(value)) {
      let v = inner.isInt ? Math.round(value) : value;
      if (inner.minValue != null && Number.isFinite(inner.minValue))
        v = Math.max(inner.minValue, v);
      if (inner.maxValue != null && Number.isFinite(inner.maxValue))
        v = Math.min(inner.maxValue, v);
      out[key] = v;
    } else if (inner instanceof z.ZodEnum && typeof value === "string") {
      const options = inner.options.map(String);
      if (options.includes(value)) continue;
      const exact = options.find((o) => o.toLowerCase() === value.trim().toLowerCase());
      const period = exact ?? nearestPeriod(value, options);
      if (period) out[key] = period;
      else if (fallback) delete out[key];
    }
  }
  return out;
}

/** Days in a period a model might ask for: "12m", "6 weeks", "ytd", "quarter". */
function periodDays(text: string): number | undefined {
  const t = text.trim().toLowerCase();
  if (/^(ytd|year|this_?year|1y|12m|annual|last_?year|365d?)$/.test(t)) return 365;
  if (/^(qtd|quarter|this_?quarter|3m|1q)$/.test(t)) return 90;
  if (/^(week|this_?week|wtd)$/.test(t)) return 7;
  if (/^(month|this_?month)$/.test(t)) return 30;
  const m = t.match(/^(\d+)\s*(d|days?|w|weeks?|m|months?|y|years?)$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = m[2]![0];
  return unit === "d" ? n : unit === "w" ? n * 7 : unit === "m" ? n * 30 : n * 365;
}

/** The day-count option ("7d", "30d", "90d") nearest a period, or undefined. */
function nearestPeriod(value: string, options: string[]): string | undefined {
  const days = periodDays(value);
  const dayOptions = options.filter((o) => /^\d+d$/.test(o));
  if (days == null || dayOptions.length === 0) return undefined;
  return dayOptions.reduce((best, o) =>
    Math.abs(parseInt(o, 10) - days) < Math.abs(parseInt(best, 10) - days) ? o : best,
  );
}
