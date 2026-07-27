import { createPageMetadata } from "@/lib/page-metadata";
import { parseComparisonPair } from "./_components/chat-types";
import { ComparePageClient } from "./_components/compare-page-client";

export const metadata = createPageMetadata({
  pathname: "/compare",
  title: "Compare OpenUI",
  description: "Compare rendered Markdown, OpenUI OSS, and OpenUI Cloud side by side.",
  imageAlt: "OpenUI comparison preview",
});

export default async function ComparePage(props: PageProps<"/compare">) {
  const searchParams = await props.searchParams;
  return <ComparePageClient initialPair={parseComparisonPair(searchParams.pair)} />;
}
