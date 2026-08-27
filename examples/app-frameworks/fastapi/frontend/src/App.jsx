import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import "@openuidev/thesys/styles.css";

import {
  AgentInterface,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { chatLibrary } from "@openuidev/thesys";
import { useMemo } from "react";

export default function App() {
  // Storage is AgentInterface's built-in in-memory default (wiped on reload).
  // The Cloud system prompt is attached on the FastAPI side.
  const llm = useMemo(
    () => ({
      send: ({ messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: openAIMessageFormat.toApi(messages),
          }),
          signal,
        }),
      streamProtocol: openAIReadableStreamAdapter(),
    }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={chatLibrary} agentName="OpenUI Chat" />
    </div>
  );
}
