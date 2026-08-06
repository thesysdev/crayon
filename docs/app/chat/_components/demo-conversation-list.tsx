"use client";

import type { ReactNode } from "react";

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

interface DemoConversationListProps {
  onNavigate: (path: string | undefined) => void;
}

export function DemoConversationList({ onNavigate }: DemoConversationListProps) {
  const selectThread = useThreadList((state) => state.selectThread);
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);

  return (
    <div className={styles.demoThreadGroup} aria-label="Demo threads">
      <div className={styles.demoThreadGroupLabel}>Featured demos</div>
      {DEMO_CONVERSATIONS.map((conversation) => (
        <AgentInterface.SidebarItem
          key={conversation.id}
          selected={selectedThreadId === conversation.id}
          icon={ICONS[conversation.icon]}
          data-attribute-element="featured-demo"
          aria-label={`${conversation.title}, ${conversation.description}, read-only demo thread`}
          onClick={() => {
            onNavigate(undefined);
            selectThread(conversation.id);
          }}
        >
          {conversation.title}
        </AgentInterface.SidebarItem>
      ))}
    </div>
  );
}
