"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { defaultExamples, defaultLibrary } from "@openuidev/react-ui/genui-lib";
import Link from "next/link";
import { useState } from "react";

const systemPrompt = `You are a helpful AI agent with access to tools. Use them when appropriate.

Available tools:
- get_weather: Get current weather for any city
- get_stock_price: Get stock prices by ticker symbol (e.g. AAPL, GOOGL)
- calculate: Evaluate math expressions
- search_web: Search the web for information

Always use the appropriate tool when the user asks about weather, stocks, math, or needs web information. Present results clearly using markdown and GenUI components.

${defaultLibrary.prompt({ examples: defaultExamples })}`;

export default function AgentPage() {
  const [mode, setMode] = useState<"light" | "dark">("light");

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
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid rgba(128,128,128,0.3)",
            background: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            color: mode === "dark" ? "#fff" : "#333",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          {mode === "light" ? "Switch to Dark" : "Switch to Light"}
        </button>
        <Link
          href="/"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid rgba(128,128,128,0.3)",
            background: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            color: mode === "dark" ? "#fff" : "#333",
            textDecoration: "none",
            backdropFilter: "blur(8px)",
          }}
        >
          ← Home
        </Link>
      </nav>
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
              systemPrompt,
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIAdapter()}
        componentLibrary={defaultLibrary}
        theme={{ mode }}
        agentName="GenUI Agent"
        conversationStarters={{
          variant: "short",
          options: [
            { displayText: "Weather in Tokyo", prompt: "What's the weather like in Tokyo right now?" },
            { displayText: "AAPL stock price", prompt: "What's the current stock price for AAPL?" },
            { displayText: "Calculate something", prompt: "What is (42 * 17) + sqrt(144)?" },
          ],
        }}
      />
    </div>
  );
}
