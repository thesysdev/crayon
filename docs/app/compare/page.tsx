import { createPageMetadata } from "@/lib/page-metadata";
import { parseComparisonPair } from "./_components/chat-types";
import { ComparePageClient } from "./_components/compare-page-client";

const TITLE = "Generative UI vs Markdown responses: live comparison | OpenUI";

export const metadata = {
  ...createPageMetadata({
    pathname: "/compare",
    title: TITLE,
    description: "Compare rendered Markdown, OpenUI OSS, and OpenUI Cloud side by side.",
    image: "/nav/compare-light.webp",
    imageAlt: "OpenUI comparison preview",
  }),
  title: { absolute: TITLE },
};

export default async function ComparePage(props: PageProps<"/compare">) {
  const searchParams = await props.searchParams;
  return <ComparePageClient initialPair={parseComparisonPair(searchParams.pair)} />;
}
