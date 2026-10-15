import { createPageMetadata } from "@/lib/page-metadata";
import { parseComparisonPair } from "./_components/chat-types";
import { ComparePageClient } from "./_components/compare-page-client";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default async function ComparePage(props: PageProps<"/compare">) {
  const searchParams = await props.searchParams;
  return <ComparePageClient initialPair={parseComparisonPair(searchParams.pair)} />;
}
