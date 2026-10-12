import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/compare",
  title: { absolute: "Generative UI vs Markdown responses: live comparison | OpenUI" },
  description: "Compare rendered Markdown, OpenUI OSS, and OpenUI Cloud side by side.",
  openGraph: { title: "Compare OpenUI" },
} satisfies PageMetadataInput;
