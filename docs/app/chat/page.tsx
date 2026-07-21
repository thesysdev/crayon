import type { Metadata } from "next";
import { ChatPageClient } from "./_components/chat-page-client";

export const metadata: Metadata = {
  title: "Compare OpenUI",
  description: "Compare rendered Markdown, OpenUI OSS, and OpenUI Cloud side by side.",
  alternates: {
    canonical: "/chat",
  },
};

export default function ChatPage() {
  return <ChatPageClient />;
}
