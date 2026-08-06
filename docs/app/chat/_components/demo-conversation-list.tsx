"use client";

import type { ReactNode } from "react";

import { CHAT_DEMO_EVENTS, captureChatDemoEvent, getChatDemoId } from "@/lib/chat-demo-analytics";
import { useThreadList } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import { ChartNoAxesCombined, Film, Flower } from "lucide-react";
import styles from "../chat-page.module.css";
import { DEMO_CONVERSATIONS, type DemoConversationIcon } from "./demo-conversations";

const ICONS: Record<DemoConversationIcon, ReactNode> = {
  analytics: <ChartNoAxesCombined aria-hidden="true" size={15} />,
  travel: <Flower aria-hidden="true" size={15} />,
  compare: <Film aria-hidden="true" size={15} />,
};

export function DemoConversationList() {
  const selectThread = useThreadList((state) => state.selectThread);

  return (
    <div className={styles.demoThreadGroup} aria-label="Demo threads">
      <div className={styles.demoThreadGroupLabel}>Featured demos</div>
      {DEMO_CONVERSATIONS.map((conversation) => (
        <AgentInterface.SidebarItem
          key={conversation.id}
          path={`demo/${conversation.id}`}
          icon={ICONS[conversation.icon]}
          data-attribute-element="featured-demo"
          aria-label={`${conversation.title}, ${conversation.description}, read-only demo thread`}
          onClick={() => {
            const demoId = getChatDemoId(conversation.id);
            if (demoId) captureChatDemoEvent(CHAT_DEMO_EVENTS.threadView, { demo_id: demoId });
            selectThread(conversation.id);
          }}
        >
          {conversation.title}
        </AgentInterface.SidebarItem>
      ))}
    </div>
  );
}
