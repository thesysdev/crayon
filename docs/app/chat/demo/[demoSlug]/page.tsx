import { pageOgImage, withOgImage } from "@/lib/page-metadata";
import { redirect } from "next/navigation";
import {
  DEMO_CONVERSATIONS,
  getDemoConversationBySlug,
  getDemoConversationPath,
} from "../../_components/demo-conversations";
import chat from "../../metadata";

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

  // Link previews reuse the /chat card.
  return withOgImage(
    {
      title: `${conversation.title} | OpenUI Cloud Chat`,
      description: conversation.description,
      alternates: { canonical: getDemoConversationPath(conversation) },
    },
    pageOgImage(chat),
    { title: chat.title, description: chat.description },
  );
}

export default async function DemoChatPage({ params }: DemoChatPageProps) {
  const { demoSlug } = await params;
  if (!getDemoConversationBySlug(demoSlug)) redirect("/chat");

  return null;
}
