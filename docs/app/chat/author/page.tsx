import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({
  pathname: "/chat/author",
  title: "Artifact Authoring | OpenUI Cloud Chat",
  description: "Generate OpenUI artifacts, preview them, and copy their OpenUI Lang source.",
  image: "/nav/chat-light.webp",
  imageAlt: "OpenUI artifact authoring workspace",
});

export default function ChatAuthorPage() {
  return null;
}
