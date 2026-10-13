import type { PageMetadataInput } from "@/lib/page-metadata";
import { VS_JSON_SUMMARY, VS_JSON_TITLE } from "./summary";

export default {
  pathname: "/openui-vs-json",
  title: { absolute: VS_JSON_TITLE },
  description: VS_JSON_SUMMARY,
  openGraph: { title: "OpenUI vs JSON" },
} satisfies PageMetadataInput;
