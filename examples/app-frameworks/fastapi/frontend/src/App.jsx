import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  useOpenuiCloudStorage,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

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

  // Threads live in OpenUI Cloud: the backend stores each turn, so switching
  // chats or reloading brings the whole conversation back.
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Chat"
      />
    </div>
  );
}
