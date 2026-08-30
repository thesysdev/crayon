"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { OpenUIProvider } from "@openuidev/copilotkit";

const prompts = [
  "Compare our quarterly revenue in a bar chart and suggest two follow-up views.",
  "Create a short event registration form and ask me to submit it.",
  "Show a table comparing three project plans with a clickable drill-down action.",
];

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <OpenUIProvider />
      <main className="app-shell">
        <section className="intro-panel">
          <div>
            <p className="eyebrow">OpenUI × CopilotKit</p>
            <h1>Generative interfaces in the CopilotKit shell</h1>
            <p className="lede">
              CopilotKit runs the conversation. OpenUI renders streamed, typed tool interfaces and
              routes their actions back through CopilotKit.
            </p>
          </div>

          <div className="prompt-card">
            <p className="prompt-title">Try these prompts</p>
            <ol>
              {prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="chat-panel" aria-label="CopilotKit chat">
          <CopilotChat agentId="default" className="copilot-chat" />
        </section>
      </main>
    </CopilotKit>
  );
}
