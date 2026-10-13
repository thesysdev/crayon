import { BRIEFS, COST_MODELS, costPerPass, type FormatId, MODELS } from "@/lib/benchmark-data";

const costRatios = (format: FormatId) =>
  COST_MODELS.map((model) => costPerPass[model]![format] / costPerPass[model]!.openui);

const jsonRatios = [...costRatios("a2ui"), ...costRatios("jsonRender")];

export const VS_JSON_TITLE = "OpenUI vs JSON for generative UI: tokens, speed and cost | OpenUI";

export const VS_JSON_SUMMARY = `OpenUI Lang is a compact language that LLMs write instead of JSON to describe a UI. In our benchmark of ${BRIEFS} screens across ${MODELS.length} models, it used about half the output tokens of JSON formats, so screens stream in about half the time and cost ${Math.min(...jsonRatios).toFixed(1)} to ${Math.max(...jsonRatios).toFixed(1)}× less.`;
