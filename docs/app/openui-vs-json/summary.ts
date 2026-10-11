import {
  BRIEFS,
  COST_MODELS,
  costPerPass,
  type FormatId,
  formatLabel,
  MODELS,
  tokens,
} from "@/lib/benchmark-data";

const costRatios = (format: FormatId) =>
  COST_MODELS.map((model) => costPerPass[model]![format] / costPerPass[model]!.openui);

const jsonRatios = [...costRatios("a2ui"), ...costRatios("jsonRender")];

export const VS_JSON_TITLE = "OpenUI vs JSON for generative UI: tokens, speed and cost | OpenUI";

export const VS_JSON_SUMMARY = `OpenUI Lang is a compact language that LLMs write instead of JSON to describe a UI. In our benchmark of ${BRIEFS} screens across ${MODELS.length} models, it used about half the output tokens of JSON formats, so screens stream in about half the time and cost ${Math.min(...jsonRatios).toFixed(1)} to ${Math.max(...jsonRatios).toFixed(1)}× less.`;

export const VS_JSON_ROWS = (["openui", "a2ui", "jsonRender"] as const).map((format) => {
  const ratios = costRatios(format);
  return {
    format: formatLabel(format),
    output: tokens.outputPerScreen[format].toLocaleString("en-US"),
    relative: `${(tokens.outputPerScreen[format] / tokens.outputPerScreen.openui).toFixed(1)}×`,
    cost:
      format === "openui"
        ? "1×"
        : `${Math.min(...ratios).toFixed(1)}–${Math.max(...ratios).toFixed(1)}×`,
  };
});
