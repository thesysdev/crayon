"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { openAIMessageFormat, openAIReadableStreamAdapter } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { defaultLibrary, defaultPromptOptions } from "@openuidev/react-ui/genui-lib";
import Link from "next/link";

const systemPrompt = defaultLibrary.prompt(defaultPromptOptions);

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <nav
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 50,
          display: "flex",
          gap: 8,
        }}
      >
        <Link
          href="/theme-test"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid rgba(128,128,128,0.3)",
            background: "rgba(0,0,0,0.05)",
            color: "#333",
            textDecoration: "none",
            backdropFilter: "blur(8px)",
          }}
        >
          Theme Tests →
        </Link>
        <Link
          href="/chat"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid rgba(128,128,128,0.3)",
            background: "rgba(0,0,0,0.05)",
            color: "#333",
            textDecoration: "none",
            backdropFilter: "blur(8px)",
          }}
        >
          Chat (Themed) →
        </Link>
        <Link
          href="/agent"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid rgba(128,128,128,0.3)",
            background: "rgba(0,0,0,0.05)",
            color: "#333",
            textDecoration: "none",
            backdropFilter: "blur(8px)",
          }}
        >
          Agent →
        </Link>
      </nav>
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
              systemPrompt,
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIReadableStreamAdapter()}
        componentLibrary={defaultLibrary}
        agentName="OpenUI Chat"
        disableThemeProvider
      />
    </div>
  );
}
