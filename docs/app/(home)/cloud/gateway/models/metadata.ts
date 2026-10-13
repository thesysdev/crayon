import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/cloud/gateway/models",
  title: "Gateway models",
  description:
    "Browse the models available through OpenUI Gateway, with context windows and pricing.",
  openGraph: {
    title: "OpenUI Gateway models",
    description:
      "Browse the OpenAI, Anthropic, Gemini, and open models available through OpenUI Gateway.",
  },
} satisfies PageMetadataInput;
