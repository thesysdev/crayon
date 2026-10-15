import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/cloud/gateway",
  title: { absolute: "OpenUI Gateway | Production reliability for Generative UI" },
  description:
    "An OpenAI-compatible API that validates model output against your component library and repairs it as it streams.",
  openGraph: {
    title: "OpenUI Gateway | Production reliability for Generative UI",
    description:
      "Add production reliability to OpenUI with validation, streaming repair, model routing, and provider fallbacks through an OpenAI-compatible API.",
  },
} satisfies PageMetadataInput;
