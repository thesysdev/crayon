import { MODEL_BOARD_SIZE } from "@/lib/benchmark-data";
import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/benchmarks",
  title: "Generative UI Benchmark: JSON vs OpenUI Lang token usage",
  description: `We generated the same 46 interfaces with 6 models and 3 UI formats. OpenUI produced the fewest blank screens, used the fewest tokens, and cost the least on every priced model.`,
  openGraph: {
    title: "Generative UI Benchmark | OpenUI",
    description: `OpenUI results across ${MODEL_BOARD_SIZE} models, plus a six-model comparison across OpenUI, A2UI and json-render.`,
  },
} satisfies PageMetadataInput;
