import { createPageMetadata } from "@/lib/page-metadata";
import { ChatPageClient } from "./_components/chat-page-client";

export const metadata = createPageMetadata({
  pathname: "/chat",
  title: "OpenUI Chat",
  description: "Try OpenUI OSS and OpenUI Cloud in a live generative UI chat.",
  image: "/nav/chat-light.webp",
  imageAlt: "OpenUI Chat preview",
});

export default function ChatPage() {
  return <ChatPageClient />;
}
