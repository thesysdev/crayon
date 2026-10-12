import { blankScreens, COST_MODELS, costPerPass, RUNS_PER_FORMAT } from "@/lib/benchmark-data";
import type { PageMetadataInput } from "@/lib/page-metadata";

const costRatios = COST_MODELS.flatMap((model) =>
  (["a2ui", "jsonRender"] as const).map(
    (format) => costPerPass[model]![format] / costPerPass[model]!.openui,
  ),
);

export default {
  pathname: "/benchmarks",
  title: { absolute: "Generative UI benchmark: OpenUI vs A2UI vs json-render | OpenUI" },
  description: `We generated the same 46 interfaces with 6 models in 3 generative UI formats: OpenUI, A2UI and json-render. OpenUI had the fewest blank screens (${blankScreens.openui} in ${RUNS_PER_FORMAT.toLocaleString("en-US")} runs), used about half the tokens, and cost ${Math.min(...costRatios).toFixed(1)} to ${Math.max(...costRatios).toFixed(1)}× less on every priced model.`,
  openGraph: { title: "Generative UI Benchmark" },
} satisfies PageMetadataInput;
