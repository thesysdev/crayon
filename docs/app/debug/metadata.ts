import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/debug",
  title: "OpenUI Debug",
  description:
    "Try OpenUI Lang against any published @openuidev/lang-core version, replay it as a simulated LLM stream, and see what renders.",
} satisfies PageMetadataInput;
