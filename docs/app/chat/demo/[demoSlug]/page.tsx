import { createPageMetadata } from "@/lib/page-metadata";
import { redirect } from "next/navigation";
import {
  DEMO_CONVERSATIONS,
  getDemoConversationBySlug,
  getDemoConversationPath,
} from "../../_components/demo-conversations";

interface DemoChatPageProps {
  params: Promise<{ demoSlug: string }>;
}

export function generateStaticParams() {
  return DEMO_CONVERSATIONS.map((conversation) => ({ demoSlug: conversation.slug }));
}

export async function generateMetadata({ params }: DemoChatPageProps) {
  const { demoSlug } = await params;
  const conversation = getDemoConversationBySlug(demoSlug);
  if (!conversation) return {};

  return createPageMetadata({
    pathname: getDemoConversationPath(conversation),
    title: `${conversation.title} | OpenUI Cloud Chat`,
    description: conversation.description,
    image: "/nav/chat-light.webp",
    imageAlt: `${conversation.title} demo preview`,
  });
}

export default async function DemoChatPage({ params }: DemoChatPageProps) {
  const { demoSlug } = await params;
  if (!getDemoConversationBySlug(demoSlug)) redirect("/chat");

  return null;
}
