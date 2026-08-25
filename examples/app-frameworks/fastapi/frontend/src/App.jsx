import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);

export default function App() {
  // Storage is AgentInterface's built-in in-memory default (wiped on reload). The
  // backend call is unchanged — only the chat surface moved from FullScreen to
  // AgentInterface.
  const llm = useMemo(
    () => ({
      send: ({ messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt,
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
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Chat" />
    </div>
  );
}
