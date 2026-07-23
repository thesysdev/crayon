"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";

import { useTheme } from "@/hooks/use-system-theme";
import { shadcnChatLibrary } from "@/lib/shadcn-genui";
import {
  defineArtifactCategories,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

const llm: ChatLLM = {
  send: async ({ threadId, messages, signal }) => {
    const latest = messages.slice(-1);
    return fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, input: openAIConversationMessageFormat.toApi(latest) }),
      signal,
    });
  },
  streamProtocol: openAIResponsesAdapter(),
};

export default function Page() {
  const mode = useTheme();
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "http://localhost:3102",
    features: { artifact: true },
  });

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={shadcnChatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="shadcn/ui Chat"
        scrollVariant="always"
        scrollOnLoad={false}
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Startup dashboard",
            prompt:
              "Build a startup analytics dashboard with tags, Tabs (Revenue BarChart, Growth LineChart, Breakdown PieChart), a key metrics table, a progress bar toward the annual goal, and follow-ups.",
          },
          {
            displayText: "Travel planner",
            prompt:
              "Design a trip planner with a range CalendarBlock (2 months), an Accordion for 3 destinations (Tokyo, Paris, New York) each with description, tags, and a budget progress bar, then a preferences form with select, slider, and checkboxes. Add follow-ups.",
          },
          {
            displayText: "Market watch",
            prompt:
              "Fetch stock prices for AAPL, NVDA, GOOGL, and TSLA. Show a market overview with tags, a comparison table, an alert for the biggest mover, and a DrawerBlock with a BarChart comparing all four. Add follow-ups.",
          },
          {
            displayText: "Event RSVP",
            prompt:
              "Create an event RSVP form for a tech summit with an info alert, and a form containing inputs for name and email, a select for ticket tier, radio group for diet, date picker, slider for group size, checkboxes for sessions, and switches for notifications. Add follow-ups.",
          },
          {
            displayText: "Team standup",
            prompt:
              "Generate a team standup board with a sprint progress bar, a task table (5 members), a warning alert for blockers, an Accordion (Yesterday, Today, Blockers), and a DialogBlock that opens sprint metrics with a PieChart and summary table. Add follow-ups.",
          },
          {
            displayText: "Quarterly deck",
            prompt: "Create a short presentation about our Q2 results with three slides.",
          },
          {
            displayText: "Market report",
            prompt: "Write a brief market-analysis report on the EV sector.",
          },
        ]}
      />
    </div>
  );
}
