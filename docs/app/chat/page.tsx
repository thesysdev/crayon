import type { Metadata } from "next";
import { ChatPageClient } from "./_components/chat-page-client";

export const metadata: Metadata = {
  title: "OpenUI Chat",
  description: "Try OpenUI OSS and OpenUI Cloud in a live generative UI chat.",
  alternates: {
    canonical: "/chat",
  },
};

export default function ChatPage() {
  return <ChatPageClient />;
}
