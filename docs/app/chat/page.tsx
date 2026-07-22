import type { Metadata } from "next";
import { ChatPageClient } from "./_components/chat-page-client";
import { parseComparisonPair } from "./_components/chat-types";

export const metadata: Metadata = {
  title: "Compare OpenUI",
  description: "Compare rendered Markdown, OpenUI OSS, and OpenUI Cloud side by side.",
  alternates: {
    canonical: "/chat",
  },
};

export default async function ChatPage(props: PageProps<"/chat">) {
  const searchParams = await props.searchParams;
  return <ChatPageClient initialPair={parseComparisonPair(searchParams.pair)} />;
}
