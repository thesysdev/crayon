"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { codeBlockRenderer } from "@/lib/codeBlockRenderer";
import { enrichedArgsAdapter } from "@/lib/enrichedArgsAdapter";
import { artifactDemoLibrary } from "@/library";
import { AgentInterface, fetchLLM, openAIMessageFormat, type ChatLLM } from "@openuidev/react-ui";
import { useMemo } from "react";

export default function Page() {
  const mode = useTheme();

  // AgentInterface uses its built-in in-memory storage by default (wiped on
  // reload). The backend call is unchanged — only the chat surface moved from
  // FullScreen to AgentInterface.
  const llm = useMemo<ChatLLM>(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: enrichedArgsAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        componentLibrary={artifactDemoLibrary}
        artifactRenderers={[codeBlockRenderer]}
        agentName="Artifact Demo"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "React login form",
            prompt: "Build me a React login form with email and password validation",
          },
          {
            displayText: "Python REST API",
            prompt: "Create a FastAPI REST API with CRUD endpoints for a todo app",
          },
          {
            displayText: "CSS animation",
            prompt: "Write a CSS animation for a bouncing loading indicator",
          },
          {
            displayText: "SQL schema",
            prompt: "Design a SQL schema for a blog with users, posts, and comments",
          },
        ]}
      />
    </div>
  );
}
