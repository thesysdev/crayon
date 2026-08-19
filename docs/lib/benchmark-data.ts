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

/**
 * % of 184 runs where everything asked for renders and every reference resolves.
 * Stored as the exact complete/184 fraction so the table cells round to one
 * decimal for display while completionMean() averages the true rates (averaging
 * pre-rounded cells would drift, e.g. a2ui 95.75 vs the true 95.74).
 */
export const completionByModel: Record<ModelId, Record<FormatId, number>> = {
  sol: { openui: 99.457, a2ui: 96.196, jsonRender: 82.609 },
  opus: { openui: 98.913, a2ui: 99.457, jsonRender: 87.5 },
  kimi: { openui: 96.739, a2ui: 95.652, jsonRender: 71.196 },
  gemini: { openui: 95.109, a2ui: 95.109, jsonRender: 77.174 },
  qwen: { openui: 91.848, a2ui: 91.304, jsonRender: 80.978 },
  muse: { openui: 96.739, a2ui: 96.739, jsonRender: 81.522 },
};

/**
 * Unweighted mean of the six per-model rates — each model gets equal weight.
 * With the uniform 4-rep condition this equals the pooled rate. Computed from
 * the exact per-model fractions, never typed. Re-sync the prose if these move.
 */
export const completionMean = (id: FormatId) =>
  MODELS.reduce((sum, m) => sum + completionByModel[m.id][id], 0) / MODELS.length;

export const winnerFor = (modelId: ModelId): FormatId =>
  FORMAT_ORDER.reduce((best, id) =>
    completionByModel[modelId][id] > completionByModel[modelId][best] ? id : best,
  );

/** Models where each format takes the top score. Ties resolve to the first in FORMAT_ORDER. */
export const modelWins = (id: FormatId) =>
  MODELS.filter((m) => winnerFor(m.id) === id).map((m) => m.label);

/* ------------------------------------------------------------------ */
/* 2. Blank screens                                                    */
/* ------------------------------------------------------------------ */

/**
 * Runs where the user saw nothing at all, out of RUNS_PER_FORMAT.
 * A2UI's count is its shipped renderer dropping whole updateComponents
 * messages on any invalid component.
 */
export const blankScreens: Record<FormatId, number> = {
  openui: 1,
  a2ui: 35,
  jsonRender: 4,
};

/** A2UI's own shipped renderer drops a whole updateComponents message on any
 *  invalid component. */
export const a2uiShippedRendererBlanks = 35;

/** OpenUI's single blank is an empty API response from Qwen. */
export const openuiBlankCause = { models: ["qwen"] as ModelId[], reason: "empty response" };

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
  { band: "2–3", briefs: 10, openui: 100.0, a2ui: 99.583, jsonRender: 89.583 },
  { band: "4–6", briefs: 10, openui: 99.583, a2ui: 98.75, jsonRender: 81.667 },
  { band: "7–9", briefs: 10, openui: 98.75, a2ui: 94.167, jsonRender: 85.417 },
  { band: "11–13", briefs: 8, openui: 91.146, a2ui: 91.667, jsonRender: 68.229 },
  { band: "16–18", briefs: 8, openui: 90.625, a2ui: 93.229, jsonRender: 71.875 },
];

/* ------------------------------------------------------------------ */
/* 4. Tokens                                                           */
/* ------------------------------------------------------------------ */

/** tiktoken o200k on the exact prompts and outputs. */
export const tokens = {
  /** Generated by each SDK's own generator over the same 70-component catalog.
   *  The OpenUI prompt includes its component groups, two worked examples and
   *  three rules, all passed through generatePrompt's official options. */
  systemPrompt: { openui: 5_031, a2ui: 12_610, jsonRender: 7_651 } as Record<FormatId, number>,
  /** Mean output per screen over all 1,104 scored runs (six models). */
  outputPerScreen: { openui: 1_362, a2ui: 2_823, jsonRender: 3_258 } as Record<FormatId, number>,
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
  gemini: { openui: 0.42, a2ui: 0.95, jsonRender: 0.85 },
  muse: { openui: 0.71, a2ui: 1.38, jsonRender: 1.34 },
  qwen: { openui: 0.81, a2ui: 1.9, jsonRender: 1.46 },
  kimi: { openui: 1.53, a2ui: 3.16, jsonRender: 2.91 },
  opus: { openui: 2.27, a2ui: 5.85, jsonRender: 4.88 },
};

/** The procurement unit: dollars per 1,000 screens. */
export const costPer1kScreens = (modelId: ModelId, id: FormatId) =>
  (costPerPass[modelId]![id] / BRIEFS) * 1000;

/* ------------------------------------------------------------------ */
/* 6. Production: failure taxonomy + repair                            */
/*    Percentages only, from a recent week of OpenUI Cloud streaming    */
/*    traffic (managed-openui embed). No absolute counts published.     */
/* ------------------------------------------------------------------ */

/** Share of first-pass validation failures by family (streaming, one week).
 *  Rendered as a markdown table in the post, kept here as the source of truth. */
export const failureTaxonomy = [
  { family: "No valid root (often truncation-related)", share: 44 },
  { family: "Reference graph (dangling or orphaned refs)", share: 36 },
  { family: "Enum, type and argument errors", share: 16 },
  { family: "Truncation", share: 4 },
];

/** Production repair, streaming OpenUI-Lang, one week. All percentages. The
 *  repair is a single LLM sanitizer pass (the parser already absorbs markdown,
 *  comments and unclosed brackets, so those never reach the repair layer). */
export const production = {
  /** ~% of streaming generations that trip validation on the first pass. */
  triggerRate: 7,
  /** ~% of those first-pass failures the sanitizer recovers. */
  repairedShare: 88,
  /** ~% of all streaming requests that reach a user broken. */
  userVisibleShare: 0.9,
};

/* ------------------------------------------------------------------ */
/* Confounds — these belong in chart footnotes, not an appendix        */
/* ------------------------------------------------------------------ */

export const CONFOUNDS = {
  promptConditions:
    "One condition for all models and formats: the same two worked examples through each SDK's official prompt generator. OpenUI's also carries its component groups and three rules, json-render its three custom rules; A2UI adds no rules of its own beyond the examples.",
  attachRule:
    "Prompt content moves these numbers about as much as format choice does: one rule telling the model to attach every component it defines was worth 13 points to OpenUI on Kimi in earlier runs.",
  scoring:
    "Scoring is each SDK's own shipped code plus one shared completeness layer with a coverage floor; the layer credits json-render's native children slot wherever a component's single ref prop allows it, and consumes A2UI validation errors its itemized checks would miss.",
  firstParty: "We built OpenUI Lang. Read this as a first-party benchmark with everything disclosed.",
};
