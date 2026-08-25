import { agnoOpenUIPromptRenderer, agnoStorage, createAgnoLLM } from "@openuidev/agno";
import { AgentInterface } from "@openuidev/react-ui";
import { ExternalLinkIcon } from "lucide-react";
import { library } from "./library";

declare const __AGNO_BACKEND_MODE__: "real" | "mock";

const isRealAgentOS = __AGNO_BACKEND_MODE__ === "real";
const DEMO_USER_ID = isRealAgentOS ? "openui-live-demo" : "openui-demo-user";
const AGENT_ID = "openui-assistant";
const AGENT_OS_URL = "https://os.agno.com";

const llm = createAgnoLLM({
  url: "/agui",
  forwardedProps: { user_id: DEMO_USER_ID },
  context: [{ description: "openui_client", value: "true" }],
});

const storage = agnoStorage({
  baseUrl: "",
  entityType: "agent",
  entityId: AGENT_ID,
  userId: DEMO_USER_ID,
});

const starters = [
  {
    displayText: "Use an Agno tool",
    prompt: "Use the stored quarterly revenue and show it as a chart with two useful follow-ups.",
  },
  {
    displayText: "Collect structured input",
    prompt: "Create a validated project estimate form with project name, team size, and notes.",
  },
];

const agentOSSessionUrl = (sessionId: string) => {
  const url = new URL(`/sessions/${encodeURIComponent(sessionId)}`, AGENT_OS_URL);
  url.searchParams.set("sort_by", "updated_at_desc");
  url.searchParams.set("type", "all");
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "25");
  return url.toString();
};

export default function App() {
  return (
    <AgentInterface
      llm={llm}
      storage={storage}
      componentLibrary={library}
      artifactRenderers={[agnoOpenUIPromptRenderer]}
      agentName="Agno × OpenUI"
      getThreadMenuActions={({ id, isRunning }) =>
        !isRealAgentOS || isRunning
          ? []
          : [
              {
                id: "open-in-agentos",
                label: "Open in AgentOS",
                icon: <ExternalLinkIcon size="1em" />,
                href: agentOSSessionUrl(id),
                target: "_blank",
                rel: "noopener noreferrer",
              },
            ]
      }
      starterVariant="short"
      starters={starters}
    >
      <AgentInterface.Welcome
        title="OpenUI handles the UI. AgentOS handles everything else."
        description={
          isRealAgentOS
            ? "Connected to a live AgentOS and model. Try a backend Agno tool or ask for an interactive interface."
            : "Try a backend Agno tool or an interactive form. The local harness is deterministic and needs no model key."
        }
      />
    </AgentInterface>
  );
}
