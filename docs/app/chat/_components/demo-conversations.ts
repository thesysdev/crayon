import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { Message, UserMessage } from "@openuidev/react-headless";

export type DemoConversationIcon = "analytics" | "travel" | "compare";

export interface DemoConversation {
  id: `demo_${string}`;
  title: string;
  description: string;
  icon: DemoConversationIcon;
  sourcePrompt: string;
  recordedModel: string;
  messages: Message[];
}

export const DEMO_CONVERSATIONS: readonly DemoConversation[] = [
  {
    id: "demo_business_health",
    title: "Business health dashboard",
    description: "Metrics, trends, and a compact operating table",
    icon: "analytics",
    sourcePrompt: "Show me a concise business health dashboard for Q2.",
    recordedModel: DEFAULT_MODEL,
    messages: [
      {
        id: "demo_business_health_user_1",
        role: "user",
        content: "Show me a concise business health dashboard for Q2.",
      },
      {
        id: "demo_business_health_assistant_1",
        role: "assistant",
        content: `root = Card([header, status, chart, table])
header = Header("Business health", "Illustrative Q2 operating snapshot")
status = CalloutV2("success", "Revenue is ahead of plan", "Quarterly revenue finished 6% above target while customer retention remained stable.")
chart = BarChart(["April", "May", "June"], [{category: "Actual", values: [420, 468, 515]}, {category: "Target", values: [400, 445, 490]}], "default", "grouped", "Revenue vs target", "Illustrative monthly performance", "Month", "Revenue", "k")
table = Table([Col("Metric"), Col("Q2"), Col("Trend")], [["Revenue", "$1.40m", "+12%"], ["Gross margin", "72%", "+3 pts"], ["Retention", "94%", "Flat"], ["Pipeline coverage", "3.2×", "+0.4×"]])`,
      },
    ],
  },
  {
    id: "demo_travel_planner",
    title: "Travel planner",
    description: "A responsive shortlist with itinerary ideas",
    icon: "travel",
    sourcePrompt: "Plan three distinct five-day city breaks for spring.",
    recordedModel: DEFAULT_MODEL,
    messages: [
      {
        id: "demo_travel_planner_user_1",
        role: "user",
        content: "Plan three distinct five-day city breaks for spring.",
      },
      {
        id: "demo_travel_planner_assistant_1",
        role: "assistant",
        content: `root = Card([header, shortlist, comparison])
header = Header("Spring city breaks", "Three illustrative five-day itineraries")
shortlist = ContextCardBlock([lisbon, kyoto, copenhagen], "grid", true)
lisbon = ContextCardItem("lisbon", "Lisbon", "Tram rides, tiled neighborhoods, a Sintra day trip, and a relaxed food-focused final day.", "gray")
kyoto = ContextCardItem("kyoto", "Kyoto", "Temple mornings, an Arashiyama day, a tea district walk, and an easy Nara excursion.", "gray")
copenhagen = ContextCardItem("copenhagen", "Copenhagen", "Design districts, harbor cycling, Louisiana Museum, and a day exploring Nordic food halls.", "gray")
comparison = Table([Col("City"), Col("Suggested pace"), Col("Relative budget")], [["Lisbon", "Relaxed", "Medium"], ["Kyoto", "Full", "Medium"], ["Copenhagen", "Balanced", "High"]])`,
      },
    ],
  },
  {
    id: "demo_product_comparison",
    title: "Product comparison",
    description: "Tabbed recommendations and a feature matrix",
    icon: "compare",
    sourcePrompt: "Compare three project-management plans for a growing product team.",
    recordedModel: DEFAULT_MODEL,
    messages: [
      {
        id: "demo_product_comparison_user_1",
        role: "user",
        content: "Compare three project-management plans for a growing product team.",
      },
      {
        id: "demo_product_comparison_assistant_1",
        role: "assistant",
        content: `root = Card([header, recommendation, tabs, matrix])
header = Header("Project plan comparison", "Illustrative options for a 25-person product organization")
recommendation = CalloutV2("info", "Best balanced option: Growth", "It adds portfolio planning and automations without the administration overhead of the Enterprise tier.")
tabs = Tabs([starterTab, growthTab, enterpriseTab])
starterTab = TabItem("starter", "Starter", [starterCopy])
starterCopy = TextContent("Best for one or two teams that need boards, basic reporting, and simple permissions.")
growthTab = TabItem("growth", "Growth", [growthCopy])
growthCopy = TextContent("Best for several collaborating teams that need roadmaps, dependencies, and workflow automation.")
enterpriseTab = TabItem("enterprise", "Enterprise", [enterpriseCopy])
enterpriseCopy = TextContent("Best when centralized security, audit controls, and organization-wide governance are required.")
matrix = Table([Col("Capability"), Col("Starter"), Col("Growth"), Col("Enterprise")], [["Roadmaps", "Basic", "Advanced", "Advanced"], ["Automations", "5 rules", "Unlimited", "Unlimited"], ["Advanced permissions", "No", "Team level", "Organization level"], ["Audit log", "No", "90 days", "1 year"]])`,
      },
    ],
  },
];

const DEMO_CONVERSATIONS_BY_ID = new Map(
  DEMO_CONVERSATIONS.map((conversation) => [conversation.id, conversation]),
);

export function getDemoConversation(id: string | null | undefined): DemoConversation | undefined {
  if (!id) return undefined;
  return DEMO_CONVERSATIONS_BY_ID.get(id as DemoConversation["id"]);
}

export function getDemoFirstUserMessage(conversation: DemoConversation): UserMessage {
  const message = conversation.messages.find((candidate) => candidate.role === "user");
  if (!message || message.role !== "user") {
    throw new Error(`Demo conversation ${conversation.id} is missing its first user message.`);
  }
  return message;
}

export function cloneDemoMessages(conversation: DemoConversation): Message[] {
  return structuredClone(conversation.messages);
}
