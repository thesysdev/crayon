/**
 * openui-bench — single source of truth for every number on the benchmark
 * blog post.
 *
 * Rules for this file:
 *  - Charts read from here. Never hardcode a number in a chart component.
 *  - Every value is computed from the committed results files in
 *    benchmarks/openui-bench (results-<model>-{native,official}.json),
 *    never typed from prose.
 */

export type FormatId = "openui" | "a2ui" | "jsonRender";

export const FORMATS = [
  { id: "openui", label: "OpenUI Lang", vendor: "Thesys", series: 1, mark: "openui" },
  { id: "a2ui", label: "A2UI", vendor: "Google", series: 2, mark: "google" },
  { id: "jsonRender", label: "json-render", vendor: "Vercel", series: 3, mark: "vercel" },
] as const satisfies ReadonlyArray<{
  id: FormatId;
  label: string;
  vendor: string;
  series: 1 | 2 | 3;
  mark?: string;
}>;

export const FORMAT_ORDER: FormatId[] = ["openui", "a2ui", "jsonRender"];

export const formatLabel = (id: FormatId) =>
  FORMATS.find((f) => f.id === id)!.label;

/* ------------------------------------------------------------------ */
/* Run accounting — every other n on the page derives from this        */
/* ------------------------------------------------------------------ */

export const BRIEFS = 46;
export const CATALOG_COMPONENTS = 70;

/** One uniform condition: every model ran every brief 4 times per format. */
export const MODELS = [
  { id: "sol", mark: "openai", label: "Sol", family: "GPT-5.6", vendor: "OpenAI", gensPerBrief: 4 },
  { id: "opus", mark: "anthropic", label: "Claude Opus 4.8", vendor: "Anthropic", gensPerBrief: 4 },
  { id: "kimi", mark: "moonshot", label: "Kimi K3", vendor: "Moonshot", gensPerBrief: 4 },
  { id: "gemini", mark: "google", label: "Gemini 3.6 Flash", vendor: "Google", gensPerBrief: 4 },
  { id: "qwen", mark: "alibaba", label: "Qwen3.8 2.4T", vendor: "Alibaba", gensPerBrief: 4 },
  { id: "muse", mark: "meta", label: "Muse Spark 1.2", vendor: "Meta", gensPerBrief: 4 },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

/** Runs per model per format: 184. */
export const runsFor = (modelId: ModelId) =>
  BRIEFS * MODELS.find((m) => m.id === modelId)!.gensPerBrief;

/** 1,104 — the denominator under every whole-benchmark count. */
export const RUNS_PER_FORMAT = MODELS.reduce((n, m) => n + BRIEFS * m.gensPerBrief, 0);
export const RUNS_TOTAL = RUNS_PER_FORMAT * FORMATS.length;

/* ------------------------------------------------------------------ */
/* 1. Completion by model                                              */
/* ------------------------------------------------------------------ */

/** % of 184 runs where everything asked for renders and every reference resolves. */
export const completionByModel: Record<ModelId, Record<FormatId, number>> = {
  sol: { openui: 99.5, a2ui: 92.9, jsonRender: 90.2 },
  opus: { openui: 96.7, a2ui: 97.3, jsonRender: 87.0 },
  kimi: { openui: 93.5, a2ui: 92.4, jsonRender: 85.3 },
  gemini: { openui: 94.6, a2ui: 90.2, jsonRender: 71.7 },
  qwen: { openui: 89.7, a2ui: 89.7, jsonRender: 73.9 },
  muse: { openui: 83.7, a2ui: 91.8, jsonRender: 79.9 },
};

/**
 * Unweighted mean of the six per-model rates — each model gets equal weight.
 * With the uniform 4-rep condition this equals the pooled rate. Computed,
 * never typed. Note: the openui mean sits on a rounding boundary (92.9499...);
 * any change to a per-model rate can flip the displayed 92.9, so re-sync the
 * prose if these values ever move.
 */
export const completionMean = (id: FormatId) =>
  MODELS.reduce((sum, m) => sum + completionByModel[m.id][id], 0) / MODELS.length;

export const winnerFor = (modelId: ModelId): FormatId =>
  FORMAT_ORDER.reduce((best, id) =>
    completionByModel[modelId][id] > completionByModel[modelId][best] ? id : best,
  );

/** Models where each format takes the top score. Qwen is an exact tie
 *  (89.7 OpenUI and A2UI); winnerFor resolves it to the first in FORMAT_ORDER. */
export const modelWins = (id: FormatId) =>
  MODELS.filter((m) => winnerFor(m.id) === id).map((m) => m.label);

/* ------------------------------------------------------------------ */
/* 2. Blank screens                                                    */
/* ------------------------------------------------------------------ */

/**
 * Runs where the user saw nothing at all, out of RUNS_PER_FORMAT.
 * A2UI counted conservatively: still blank even when each component is
 * rendered individually through the official validator with the renderer's
 * all-or-nothing rule removed (protocols/a2ui/counterfactual.mjs).
 */
export const blankScreens: Record<FormatId, number> = {
  openui: 2,
  a2ui: 53,
  jsonRender: 9,
};

/** A2UI's own shipped renderer drops a whole updateComponents message on any
 *  invalid component, which blanks 56 rather than 53. */
export const a2uiShippedRendererBlanks = 56;

/** Both OpenUI blanks are empty API responses to the same disaster-response
 *  brief (one Muse, one Qwen); both models answer it at full length in the
 *  JSON formats. */
export const openuiBlankCause = { models: ["muse", "qwen"] as ModelId[], reason: "empty response" };

/* ------------------------------------------------------------------ */
/* 3. Completion by screen density                                     */
/* ------------------------------------------------------------------ */

export const densityBands = [
  { band: "2–3", requirements: [2, 3] as const },
  { band: "4–6", requirements: [4, 6] as const },
  { band: "7–9", requirements: [7, 9] as const },
  { band: "11–13", requirements: [11, 13] as const },
  { band: "16–18", requirements: [16, 18] as const },
];

/**
 * Mean completion per band, averaged across the six models.
 * Computed from the per-run verdicts in the results files.
 */
export const completionByDensity: Array<
  { band: string; briefs: number } & Record<FormatId, number>
> = [
  { band: "2–3", briefs: 10, openui: 98.3, a2ui: 97.5, jsonRender: 93.8 },
  { band: "4–6", briefs: 10, openui: 95.4, a2ui: 95.8, jsonRender: 85.0 },
  { band: "7–9", briefs: 10, openui: 92.9, a2ui: 92.1, jsonRender: 79.2 },
  { band: "11–13", briefs: 8, openui: 90.6, a2ui: 88.0, jsonRender: 75.5 },
  { band: "16–18", briefs: 8, openui: 85.4, a2ui: 86.5, jsonRender: 69.8 },
];

/* ------------------------------------------------------------------ */
/* 4. Tokens                                                           */
/* ------------------------------------------------------------------ */

/** tiktoken o200k on the exact prompts and outputs. */
export const tokens = {
  /** Generated by each SDK's own generator over the same 70-component catalog.
   *  The OpenUI prompt includes its component groups, two worked examples and
   *  two rules, all passed through generatePrompt's official options. */
  systemPrompt: { openui: 4_828, a2ui: 11_080, jsonRender: 6_497 } as Record<FormatId, number>,
  /** Mean output per screen over all 1,104 scored runs (six models). */
  outputPerScreen: { openui: 1_284, a2ui: 2_740, jsonRender: 3_558 } as Record<FormatId, number>,
  outputBasis: { runs: 1_104 },
};

export const timesBaseline = (value: number, baseline: number) => value / baseline;

/* ------------------------------------------------------------------ */
/* 5. Cost                                                             */
/* ------------------------------------------------------------------ */

/** USD for one benchmark pass = 46 screens, at provider list prices.
 *  The five models with public per-token pricing (Sol has none published). */
export const COST_MODELS: ModelId[] = ["gemini", "muse", "qwen", "kimi", "opus"];

export const costPerPass: Partial<Record<ModelId, Record<FormatId, number>>> = {
  gemini: { openui: 0.4, a2ui: 1.02, jsonRender: 0.87 },
  muse: { openui: 0.7, a2ui: 1.16, jsonRender: 1.32 },
  qwen: { openui: 0.77, a2ui: 1.87, jsonRender: 1.49 },
  kimi: { openui: 1.4, a2ui: 3.03, jsonRender: 3.08 },
  opus: { openui: 2.04, a2ui: 5.83, jsonRender: 4.71 },
};

/** The procurement unit: dollars per 1,000 screens. */
export const costPer1kScreens = (modelId: ModelId, id: FormatId) =>
  (costPerPass[modelId]![id] / BRIEFS) * 1000;

/* ------------------------------------------------------------------ */
/* 6. Production: failure taxonomy + repair                            */
/* ------------------------------------------------------------------ */

/** Share of production failures by family, from a 15-day OpenUI Cloud parser
 *  log of 1,285 failed generations. */
export const failureTaxonomy = [
  { family: "No valid root", share: 29.6 },
  { family: "Reference graph", share: 27.5 },
  { family: "Enum and type mismatches", share: 22.9 },
  { family: "Truncation", share: 13.6 },
  { family: "Wrong argument counts", share: 4.9 },
  { family: "Everything else", share: 1.5 },
];

/** Repair funnel over a recent production window. Counts, not percentages —
 *  the percentages on the chart are derived from these. */
export const repairFunnel = {
  failed: 277,
  stages: [
    { id: "rules", label: "Fixed by rules, no LLM call", count: 214, shipped: true },
    { id: "llm", label: "Fixed by one LLM pass", count: 52, shipped: true },
    { id: "fellThrough", label: "Fell through", count: 11, shipped: false },
  ],
};

export const repairShare = (count: number) => (count / repairFunnel.failed) * 100;
export const repairedShare = () =>
  repairShare(repairFunnel.stages.filter((s) => s.shipped).reduce((n, s) => n + s.count, 0));

/** Production generation failure rate after migrating to OpenUI (was 15% on the
 *  older JSON format). */
export const productionFailureRate = { low: 4, high: 5, previousJsonFormat: 15 };

/** Compound: a screen fails validation AND survives repair. */
export const userVisibleFailureRate = () => {
  const mid = (productionFailureRate.low + productionFailureRate.high) / 2;
  return (mid * (100 - repairedShare())) / 100;
};

/* ------------------------------------------------------------------ */
/* Confounds — these belong in chart footnotes, not an appendix        */
/* ------------------------------------------------------------------ */

export const CONFOUNDS = {
  promptConditions:
    "One condition for all models and formats. OpenUI's prompt carries its component groups, two rules and two worked examples through lang-core's official generatePrompt options; json-render runs catalog.prompt() with three custom rules; A2UI runs its generator's prompt as-is. The competitors' official options got no worked examples, an asymmetry we plan to close in a follow-up.",
  attachRule:
    "Prompt content moves these numbers about as much as format choice does: one rule telling the model to attach every component it defines was worth 13 points to OpenUI on Kimi in earlier runs.",
  scoring:
    "Scoring is each SDK's own shipped code plus one shared completeness layer with a coverage floor; the layer credits json-render's native children slot wherever a component's single ref prop allows it, and consumes A2UI validation errors its itemized checks would miss.",
  firstParty: "We built OpenUI Lang. Read this as a first-party benchmark with everything disclosed.",
};
