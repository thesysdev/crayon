/**
 * openui-bench — single source of truth for every number on the benchmark
 * blog post and the /benchmarks page.
 *
 * Rules for this file:
 *  - Charts read from here. Never hardcode a number in a chart component.
 *  - Every dataset carries `n` and a `source` note.
 *  - Anything not yet traced back to raw benchmark output is marked
 *    `provisional: true` and listed in OPEN_DATA_REQUESTS at the bottom.
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
export const CATALOG_COMPONENTS = 73;

/** Generations per brief. Gemini ran first at 10; later models ran 4 to cap cost. */
export const MODELS = [
  { id: "sol", mark: "openai", label: "Sol", family: "GPT-5.6", vendor: "OpenAI", gensPerBrief: 4 },
  { id: "opus", mark: "anthropic", label: "Claude Opus 4.8", vendor: "Anthropic", gensPerBrief: 4 },
  { id: "kimi", mark: "moonshot", label: "Kimi K3", vendor: "Moonshot", gensPerBrief: 4, outputCeiling: 16_000 },
  { id: "gemini", mark: "google", label: "Gemini 3.6 Flash", vendor: "Google", gensPerBrief: 10, productionDefault: true },
  { id: "qwen", mark: "alibaba", label: "Qwen3.8 2.4T", vendor: "Alibaba", gensPerBrief: 4 },
  { id: "muse", mark: "meta", label: "Muse Spark 1.2", vendor: "Meta", gensPerBrief: 4 },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

/** Runs per model per format, e.g. Gemini 460, everything else 184. */
export const runsFor = (modelId: ModelId) =>
  BRIEFS * MODELS.find((m) => m.id === modelId)!.gensPerBrief;

/** 1,380 — the denominator under every whole-benchmark count. */
export const RUNS_PER_FORMAT = MODELS.reduce((n, m) => n + BRIEFS * m.gensPerBrief, 0);
export const RUNS_TOTAL = RUNS_PER_FORMAT * FORMATS.length;

/* ------------------------------------------------------------------ */
/* 1. Completion by model                                              */
/* ------------------------------------------------------------------ */

/** % of runs where everything asked for renders and every reference resolves. */
export const completionByModel: Record<ModelId, Record<FormatId, number>> = {
  sol: { openui: 98.4, a2ui: 91.8, jsonRender: 93.5 },
  opus: { openui: 82.6, a2ui: 91.8, jsonRender: 96.2 },
  kimi: { openui: 87.0, a2ui: 90.2, jsonRender: 89.1 },
  gemini: { openui: 76.1, a2ui: 57.8, jsonRender: 55.9 },
  qwen: { openui: 78.8, a2ui: 83.2, jsonRender: 69.6 },
  muse: { openui: 82.1, a2ui: 79.9, jsonRender: 22.8 },
};

/**
 * Unweighted mean of the six per-model rates — each model gets equal weight,
 * so Gemini's larger sample doesn't skew it. Computed, never typed.
 */
export const completionMean = (id: FormatId) =>
  MODELS.reduce((sum, m) => sum + completionByModel[m.id][id], 0) / MODELS.length;

export const winnerFor = (modelId: ModelId): FormatId =>
  FORMAT_ORDER.reduce((best, id) =>
    completionByModel[modelId][id] > completionByModel[modelId][best] ? id : best,
  );

/** Models where each format takes the top score. */
export const modelWins = (id: FormatId) =>
  MODELS.filter((m) => winnerFor(m.id) === id).map((m) => m.label);

/* ------------------------------------------------------------------ */
/* 2. Blank screens                                                    */
/* ------------------------------------------------------------------ */

/**
 * Runs where the user saw nothing at all, out of RUNS_PER_FORMAT.
 * Counted conservatively: only payloads so broken that the JSON itself fails
 * to parse, i.e. blank in any client however lenient.
 */
export const blankScreens: Record<FormatId, number> = {
  openui: 4,
  a2ui: 89,
  jsonRender: 11,
};

/** A2UI's own shipped renderer drops a whole updateComponents message on any
 *  invalid component, which blanks 100 rather than 89. */
export const a2uiShippedRendererBlanks = 100;

/** All four OpenUI blanks were one model returning an empty response. */
export const openuiBlankCause = { model: "muse" as ModelId, reason: "empty response" };

/* ------------------------------------------------------------------ */
/* 3. Completion by screen density                                     */
/* ------------------------------------------------------------------ */

export const densityBands = [
  { band: "2–3", requirements: [2, 3] as const },
  { band: "4–6", requirements: [4, 6] as const },
  { band: "7–10", requirements: [7, 10] as const },
  { band: "11–15", requirements: [11, 15] as const },
  { band: "16–20", requirements: [16, 20] as const },
];

/**
 * Mean completion per band, averaged across the six models.
 * PROVISIONAL: recovered from the published chart geometry to 0.1pp, because
 * per-band values were never written down anywhere else. Endpoints agree with
 * the published labels (json-render 88 → 61, OpenUI 72, A2UI 69).
 * Replace with raw per-band values from the harness — and add per-band brief
 * counts, since 46 briefs across 5 bands is ~9 briefs a band.
 */
export const completionByDensity: Array<
  { band: string; briefs: number | null } & Record<FormatId, number>
> = [
  { band: "2–3", briefs: null, openui: 93.3, a2ui: 93.8, jsonRender: 88.1 },
  { band: "4–6", briefs: null, openui: 89.2, a2ui: 85.0, jsonRender: 74.2 },
  { band: "7–10", briefs: null, openui: 82.4, a2ui: 83.9, jsonRender: 64.7 },
  { band: "11–15", briefs: null, openui: 80.7, a2ui: 77.0, jsonRender: 64.3 },
  { band: "16–20", briefs: null, openui: 72.1, a2ui: 68.9, jsonRender: 61.4 },
];
export const completionByDensityProvisional = true;

/* ------------------------------------------------------------------ */
/* 4. Tokens                                                           */
/* ------------------------------------------------------------------ */

/** tiktoken o200k on the exact prompts and outputs. */
export const tokens = {
  /** Generated by each SDK's own generator over the same 73-component catalog. */
  systemPrompt: { openui: 3_764, a2ui: 11_822, jsonRender: 6_575 } as Record<FormatId, number>,
  /** Mean output per screen, over Gemini's 460 generations. */
  outputPerScreen: { openui: 1_546, a2ui: 2_992, jsonRender: 2_837 } as Record<FormatId, number>,
  outputBasis: { model: "gemini" as ModelId, runs: 460 },
};

export const timesBaseline = (value: number, baseline: number) => value / baseline;

/* ------------------------------------------------------------------ */
/* 5. Cost                                                             */
/* ------------------------------------------------------------------ */

/** USD for one benchmark pass = 46 screens, at provider list prices.
 *  Only the four models with public per-token pricing. */
export const COST_MODELS: ModelId[] = ["gemini", "muse", "kimi", "opus"];

export const costPerPass: Partial<Record<ModelId, Record<FormatId, number>>> = {
  gemini: { openui: 0.4, a2ui: 0.93, jsonRender: 0.72 },
  muse: { openui: 0.55, a2ui: 1.15, jsonRender: 1.14 },
  kimi: { openui: 1.06, a2ui: 2.96, jsonRender: 2.34 },
  opus: { openui: 1.81, a2ui: 5.63, jsonRender: 4.31 },
};

/** The procurement unit: dollars per 1,000 screens. */
export const costPer1kScreens = (modelId: ModelId, id: FormatId) =>
  (costPerPass[modelId]![id] / BRIEFS) * 1000;

/* ------------------------------------------------------------------ */
/* 6. Production: failure taxonomy + repair                            */
/* ------------------------------------------------------------------ */

/** Share of production failures by family.
 *  PROVISIONAL: needs the sample window and n. */
export const failureTaxonomy = [
  { family: "No valid root", share: 29.6 },
  { family: "Reference graph", share: 27.5 },
  { family: "Enum and type mismatches", share: 22.9 },
  { family: "Truncation", share: 13.6 },
  { family: "Wrong argument counts", share: 4.9 },
  { family: "Everything else", share: 1.5 },
];
export const failureTaxonomyProvisional = true;

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
 *  older JSON format). PROVISIONAL: needs window, volume and n. */
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
  kimiCeiling:
    "Kimi K3 ran with a 16k output ceiling against 8k for the other models — a cross-model confound on any run long enough to hit it.",
  promptConditions:
    "Each model runs its measured-best official prompt condition. OpenUI has two official prompt sources plus one optional rule; json-render ran with and without one extra rule; A2UI ran its generator's prompt as-is.",
  attachRule:
    "Adding one rule — attach every component you define — moved OpenUI on Kimi by 13 points, about as much as the format choice itself moves a score.",
  scoring:
    "Scoring is each SDK's own shipped code plus one shared completeness layer with a coverage floor. For json-render that layer is stricter than its own validator.",
  firstParty: "We built OpenUI Lang. Read this as a first-party benchmark with everything disclosed.",
};

/* ------------------------------------------------------------------ */
/* Still needed before this is fully checkable                         */
/* ------------------------------------------------------------------ */

export const OPEN_DATA_REQUESTS = [
  "Per-band completion values and per-band brief counts for the density chart (currently recovered from chart geometry).",
  "Per-cell run counts and a dispersion measure (SD or CI) so the density and model charts can carry error bars.",
  "Sample window, volume and n behind the production failure taxonomy and the 4–5% failure rate.",
  "How the 277 repaired generations relate to the wider production failure population.",
  "Denominator for Muse's 122 dropped required fields.",
  "The +9pp Gemini production-prompt delta: is the published 76.1 the generated-prompt or the production-prompt condition?",
  "A published 'complete' rubric with worked examples of each verdict.",
  "Whether the three catalogs are one shared 73-component set or each SDK's own generation of it.",
  "Model list prices used for the cost chart, with the date they were pulled.",
  "The benchmark repo itself — benchmarks/openui-bench does not exist on main.",
];
