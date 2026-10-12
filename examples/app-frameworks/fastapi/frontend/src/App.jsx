import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";
import { withLocalHistory } from "./lib/local-history";

export default function App() {
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

  // Threads live in this browser's localStorage, so switching chats or
  // reloading brings the whole conversation back.
  const chat = useMemo(() => withLocalHistory(llm, "openui-fastapi"), [llm]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        llm={chat.llm}
        storage={chat.storage}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Chat"
      />
    </div>
  );
}
