import { MODEL_BOARD_SIZE } from "@/lib/benchmark-data";
import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/benchmarks/language",
  title: "OpenUI language and model benchmark",
  description: `Compare structural validity and measured cost across ${MODEL_BOARD_SIZE} models generating OpenUI, with exact server-rendered data and machine-readable downloads.`,
  openGraph: {
    title: "Language and model benchmark",
    description: `Structural validity and cost across ${MODEL_BOARD_SIZE} models generating OpenUI.`,
  },
} satisfies PageMetadataInput;
