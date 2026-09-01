import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import "@openuidev/thesys/styles.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { chatLibrary } from "@openuidev/thesys";
import { useMemo } from "react";

export default function App() {
  // Storage is AgentInterface's built-in in-memory default (wiped on reload).
  // The Cloud system prompt is attached on the FastAPI side as a system message.
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIReadableStreamAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={chatLibrary} agentName="OpenUI Chat" />
    </div>
  );
}
