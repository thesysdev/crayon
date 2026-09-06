"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { OpenUIProvider } from "@openuidev/copilotkit";

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <OpenUIProvider />
      <CopilotChat agentId="default" className="copilot-chat" />
    </CopilotKit>
  );
}
