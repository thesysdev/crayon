import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/benchmarks/framework",
  title: "Generative UI framework benchmark",
  description:
    "Compare OpenUI, Google A2UI, and Vercel json-render across six models and 46 interface briefs, with exact server-rendered results and downloads.",
  openGraph: {
    title: "Framework benchmark",
    description: "OpenUI versus Google A2UI versus Vercel json-render under one condition.",
  },
} satisfies PageMetadataInput;
