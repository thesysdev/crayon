"use client";

import { AmbientLoader } from "@openuidev/react-ui";
import dynamic from "next/dynamic";
import "./boot-shell.css";

// Drawn while the chat's code loads: the same shell (rail + card) with the
// library's loader in the card, so nothing jumps when the real UI arrives. The
// rail's width comes from PrePaintScript in layout.tsx.
function BootShell() {
  return (
    <div className="openui-cloud-page">
      <div className="openui-agent-container">
        <div className="openui-agent-sidebar-container boot-shell__rail" />
        <div className="openui-agent-thread-container">
          <AmbientLoader label="Loading chat…" />
        </div>
      </div>
    </div>
  );
}

// Client-only, so the sidebar's saved open state and width (localStorage) are
// in place for the first paint instead of the server's defaults flipping on
// hydration.
const CloudChat = dynamic(() => import("@/components/cloud-chat"), {
  ssr: false,
  loading: BootShell,
});

export default function CloudChatClient() {
  return <CloudChat />;
}
