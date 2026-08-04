import { createPageMetadata } from "@/lib/page-metadata";
import { ChatPageClient } from "./_components/chat-page-client";

export const metadata = createPageMetadata({
  pathname: "/chat",
  title: "OpenUI Cloud Chat",
  description: "Explore OpenUI Cloud through live and curated generative UI conversations.",
  image: "/nav/chat-light.webp",
  imageAlt: "OpenUI Chat preview",
});

export default function ChatPage() {
  return <ChatPageClient />;
}
