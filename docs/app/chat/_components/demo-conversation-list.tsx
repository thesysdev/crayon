"use client";

import type { ReactNode } from "react";

import { useThreadList } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import { ChartNoAxesCombined, Columns3, Map } from "lucide-react";
import styles from "../chat-page.module.css";
import { DEMO_CONVERSATIONS, type DemoConversationIcon } from "./demo-conversations";

const ICONS: Record<DemoConversationIcon, ReactNode> = {
  analytics: <ChartNoAxesCombined aria-hidden="true" size={15} />,
  travel: <Map aria-hidden="true" size={15} />,
  compare: <Columns3 aria-hidden="true" size={15} />,
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
          trailing={
            <span className={styles.demoThreadBadge}>
              {conversation.artifact.type === "slides" ? "Deck" : "Report"}
            </span>
          }
          aria-label={`${conversation.title}, ${conversation.description}, read-only demo thread`}
          onClick={() => selectThread(conversation.id)}
        >
          {conversation.title}
        </AgentInterface.SidebarItem>
      ))}
    </div>
  );
}
