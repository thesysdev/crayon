import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/benchmarks/methodology",
  title: "Benchmark methodology",
  description:
    "How the OpenUI generative UI benchmark is run and scored: 46 briefs, 70 equivalent components, controlled generation settings, and SDK-native validation.",
  openGraph: {
    title: "Benchmark methodology",
    description: "A concise explanation of how the benchmark is generated and scored.",
  },
} satisfies PageMetadataInput;
