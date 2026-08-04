import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { Artifact, Message, UserMessage } from "@openuidev/react-headless";

export type DemoConversationIcon = "analytics" | "travel" | "compare";
export type DemoArtifactKind = "report" | "slides";

export interface DemoArtifact extends Artifact {
  id: `demo_artifact_${string}`;
  type: DemoArtifactKind;
  content: string;
  program: string;
}

export interface DemoConversation {
  id: `demo_${string}`;
  title: string;
  description: string;
  icon: DemoConversationIcon;
  sourcePrompt: string;
  recordedModel: string;
  artifact: DemoArtifact;
  messages: Message[];
}

const BUSINESS_REPORT_PROGRAM = `root = ReportView("Q2 Business Health", "Executive operating review · Illustrative data", [cover, executive, performance, risks])
cover = Page("cover", MinimalFrontPage("Q2 Business Health", coverCopy, "April–June 2026", "title-bottom"))
coverCopy = TextContent("A decision-ready view of growth, efficiency, customer health, and the risks leadership should watch next quarter.")
executive = Page("executive", ContentPage([executiveHeader, metrics, executiveStatement]))
executiveHeader = InlineHeader("Executive summary", "Growth finished ahead of plan without weakening retention or gross margin.")
metrics = KeyMetrics("row", [{title: "Revenue", text: "$1.40m"}, {title: "Gross margin", text: "72%"}, {title: "Retention", text: "94%"}, {title: "Pipeline", text: "3.2×"}])
executiveStatement = HeadlineStatement("The quarter closed 6% above plan", "Expansion revenue offset a slower enterprise sales cycle. The next operating focus is converting late-stage pipeline without adding discount pressure.", "default")
performance = Page("performance", ContentPage([performanceHeader, revenueChart]))
performanceHeader = InlineHeader("Revenue versus target", "Actual monthly revenue accelerated through the quarter.")
revenueChart = BarChartV2({data: {labels: ["April", "May", "June"], series: [{category: "Actual", values: [420, 468, 515]}, {category: "Target", values: [400, 445, 490]}]}, unit: "k"}, "Month", "Revenue")
risks = Page("risks", ContentPage([riskHeader, riskPoints]))
riskHeader = InlineHeader("Decisions for Q3", "Three actions protect the plan while preserving efficient growth.")
riskPoints = NumberedKeyPoint("column", [{title: "Shorten enterprise cycles", body: "Add executive sponsorship to the 12 largest late-stage opportunities."}, {title: "Protect pricing", body: "Require finance review for discounts above 12%."}, {title: "Expand healthy accounts", body: "Prioritize customers with product adoption above 70% and renewal dates inside 120 days."}])`;

const TRAVEL_DECK_PROGRAM = `root = SlideShow("Five Days in Lisbon", "A balanced spring city break", [cover, whyLisbon, budget, itinerary, neighborhoods, decision])
cover = Slide("cover", StandardTitle("Five Days in Lisbon", "Food, design, coast, and unhurried neighborhoods", "Illustrative spring itinerary"))
whyLisbon = Slide("why-lisbon", KeyInfoWithTitle("Why Lisbon wins", [{title: "Balanced pace", description: "One anchor activity per day with room to explore."}, {title: "Easy variety", description: "Historic districts, modern food halls, and a coastal day trip."}, {title: "Strong value", description: "Premium experiences without Copenhagen-level daily costs."}], "horizontal-grid"))
budget = Slide("budget", HeroMetric("€1,250", "Estimated five-day spend per traveler including hotel, local transport, meals, and activities", "horizontal"))
itinerary = Slide("itinerary", TextBody("The five-day shape", ["Day 1 · Baixa and an evening in Alfama", "Day 2 · Belém, riverside design, and a tasting menu", "Day 3 · Sintra day trip", "Day 4 · Príncipe Real, galleries, and food halls", "Day 5 · Cascais coast before departure"], "title-left"))
neighborhoods = Slide("neighborhoods", ContentClassic("Where to stay", ["Príncipe Real for design, restaurants, and a quieter evening base", "Baixa for first-time convenience and direct transit", "Alfama for atmosphere, with steeper streets and more visitor traffic"], "title-left"))
decision = Slide("decision", HeadlineStatement("Recommendation", "Book Lisbon for the best mix of culture, pace, and value—and keep Sintra as the one structured day trip.", "title-bottom"))`;

const PRODUCT_REPORT_PROGRAM = `root = ReportView("Project Platform Decision Brief", "Recommendation for a 25-person product organization", [cover, recommendation, comparison, rollout])
cover = Page("cover", MinimalFrontPage("Project Platform Decision Brief", coverCopy, "Prepared for product and engineering leadership", "title-bottom"))
coverCopy = TextContent("A concise comparison of Starter, Growth, and Enterprise plans using collaboration, governance, automation, and operating-cost criteria.")
recommendation = Page("recommendation", ContentPage([recommendationHeader, recommendationMetric, recommendationStatement]))
recommendationHeader = InlineHeader("Recommendation", "Choose Growth now and define explicit triggers for a future Enterprise migration.")
recommendationMetric = HeroMetric("Growth", "Best balance of cross-team planning, automation, and manageable administration", "row")
recommendationStatement = KeyStatement("Enterprise controls are valuable, but the current team size does not justify the added cost and governance overhead.")
comparison = Page("comparison", ContentPage([comparisonHeader, comparisonTable]))
comparisonHeader = InlineHeader("Plan comparison", "Scored against the needs of five collaborating product squads.")
comparisonTable = Table([Column("Capability"), Column("Starter"), Column("Growth"), Column("Enterprise")], [["Roadmaps", "Basic", "Advanced", "Advanced"], ["Automation", "5 rules", "Unlimited", "Unlimited"], ["Permissions", "Workspace", "Team", "Organization"], ["Audit history", "None", "90 days", "1 year"], ["Relative cost", "Low", "Medium", "High"]])
rollout = Page("rollout", ContentPage([rolloutHeader, rolloutSteps]))
rolloutHeader = InlineHeader("30-day rollout", "Adopt the plan without importing process debt.")
rolloutSteps = NumberedKeyPoint("column", [{title: "Week 1 · Define the operating model", body: "Agree on issue types, ownership, and the minimum required fields."}, {title: "Week 2 · Pilot with two squads", body: "Test roadmap, dependency, and automation workflows before scaling."}, {title: "Week 3 · Migrate active work", body: "Move only current-quarter initiatives and archive stale projects."}, {title: "Week 4 · Measure adoption", body: "Review cycle time, automation usage, and reporting completeness."}])`;

const BUSINESS_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_q2_business_health",
  title: "Q2 Business Health",
  type: "report",
  threadId: "demo_business_health",
  updatedAt: "2026-06-30T12:00:00.000Z",
  program: BUSINESS_REPORT_PROGRAM,
});

const TRAVEL_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_lisbon_city_break",
  title: "Five Days in Lisbon",
  type: "slides",
  threadId: "demo_travel_planner",
  updatedAt: "2026-06-28T12:00:00.000Z",
  program: TRAVEL_DECK_PROGRAM,
});

const PRODUCT_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_project_platform_brief",
  title: "Project Platform Decision Brief",
  type: "report",
  threadId: "demo_product_comparison",
  updatedAt: "2026-06-26T12:00:00.000Z",
  program: PRODUCT_REPORT_PROGRAM,
});

export const DEMO_CONVERSATIONS: readonly DemoConversation[] = [
  {
    id: "demo_business_health",
    title: "Q2 business review",
    description: "Dashboard analysis refined into an executive report",
    icon: "analytics",
    sourcePrompt: "Show me a concise business health dashboard for Q2.",
    recordedModel: DEFAULT_MODEL,
    artifact: BUSINESS_ARTIFACT,
    messages: [
      {
        id: "demo_business_health_user_1",
        role: "user",
        content: "Show me a concise business health dashboard for Q2.",
      },
      {
        id: "demo_business_health_assistant_1",
        role: "assistant",
        content: `root = Card([header, status, chart, metrics, note])
header = Header("Business health", "Illustrative Q2 operating snapshot")
status = CalloutV2("success", "Revenue closed ahead of plan", "Quarterly revenue finished 6% above target while retention and gross margin remained stable.")
chart = BarChart(["April", "May", "June"], [{category: "Actual", values: [420, 468, 515]}, {category: "Target", values: [400, 445, 490]}], "default", "grouped", "Revenue versus target", "Illustrative monthly performance", "Month", "Revenue", "k")
metrics = Table([metricNames, quarterValues, movement], [["Revenue", "$1.40m", "+12%"], ["Gross margin", "72%", "+3 pts"], ["Retention", "94%", "Flat"], ["Pipeline coverage", "3.2×", "+0.4×"]])
metricNames = Col("Metric")
quarterValues = Col("Q2")
movement = Col("Movement")
note = TextContent("The strongest next question is whether enterprise pipeline can convert without increasing discount pressure.", "small")`,
      },
      {
        id: "demo_business_health_user_2",
        role: "user",
        content:
          "Focus the story on leadership decisions and turn it into a concise executive report.",
      },
      ...createArtifactTurn(
        "demo_business_health",
        BUSINESS_ARTIFACT,
        "I tightened the analysis around Q3 decisions and packaged it as an executive report.",
      ),
    ],
  },
  {
    id: "demo_travel_planner",
    title: "Spring city-break deck",
    description: "A shortlist narrowed into a polished Lisbon itinerary",
    icon: "travel",
    sourcePrompt: "Plan three distinct five-day city breaks for spring.",
    recordedModel: DEFAULT_MODEL,
    artifact: TRAVEL_ARTIFACT,
    messages: [
      {
        id: "demo_travel_planner_user_1",
        role: "user",
        content: "Plan three distinct five-day city breaks for spring.",
      },
      {
        id: "demo_travel_planner_assistant_1",
        role: "assistant",
        content: `root = Card([header, shortlist, comparison, recommendation])
header = Header("Spring city breaks", "Three distinct five-day options")
shortlist = List([lisbon, kyoto, copenhagen], "number")
lisbon = ListItem("Lisbon", "Relaxed pace · food, design, tiled neighborhoods, and a Sintra day trip")
kyoto = ListItem("Kyoto", "Full pace · temple mornings, tea districts, Arashiyama, and Nara")
copenhagen = ListItem("Copenhagen", "Balanced pace · harbor cycling, design districts, and Nordic food halls")
comparison = Table([cityNames, paceValues, budgetValues, bestForValues], [["Lisbon", "Relaxed", "Medium", "Value + variety"], ["Kyoto", "Full", "Medium", "Culture depth"], ["Copenhagen", "Balanced", "High", "Design + food"]])
cityNames = Col("City")
paceValues = Col("Pace")
budgetValues = Col("Budget")
bestForValues = Col("Best for")
recommendation = CalloutV2("info", "Best all-round spring option: Lisbon", "It offers the strongest balance of weather, pace, variety, and relative value for a five-day trip.")`,
      },
      {
        id: "demo_travel_planner_user_2",
        role: "user",
        content:
          "Choose Lisbon and turn the recommendation into a visual itinerary I can share with friends.",
      },
      ...createArtifactTurn(
        "demo_travel_planner",
        TRAVEL_ARTIFACT,
        "I turned the recommendation into a six-slide itinerary with the trip logic, budget, and day-by-day shape.",
      ),
    ],
  },
  {
    id: "demo_product_comparison",
    title: "Product plan decision",
    description: "A plan comparison developed into a rollout brief",
    icon: "compare",
    sourcePrompt: "Compare three project-management plans for a growing product team.",
    recordedModel: DEFAULT_MODEL,
    artifact: PRODUCT_ARTIFACT,
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
recommendation = CalloutV2("info", "Best balanced option: Growth", "It adds portfolio planning and automation without the administration overhead of Enterprise.")
tabs = Tabs([starterTab, growthTab, enterpriseTab])
starterTab = TabItem("starter", "Starter", [starterCopy])
starterCopy = TextContent("Best for one or two teams that need boards, basic reporting, and simple permissions.")
growthTab = TabItem("growth", "Growth", [growthCopy])
growthCopy = TextContent("Best for collaborating squads that need roadmaps, dependencies, and workflow automation.")
enterpriseTab = TabItem("enterprise", "Enterprise", [enterpriseCopy])
enterpriseCopy = TextContent("Best when centralized security, audit controls, and organization-wide governance are required.")
matrix = Table([capabilities, starterValues, growthValues, enterpriseValues], [["Roadmaps", "Basic", "Advanced", "Advanced"], ["Automation", "5 rules", "Unlimited", "Unlimited"], ["Permissions", "Workspace", "Team", "Organization"], ["Audit history", "None", "90 days", "1 year"]])
capabilities = Col("Capability")
starterValues = Col("Starter")
growthValues = Col("Growth")
enterpriseValues = Col("Enterprise")`,
      },
      {
        id: "demo_product_comparison_user_2",
        role: "user",
        content: "What would make Growth the wrong choice for us?",
      },
      {
        id: "demo_product_comparison_assistant_2",
        role: "assistant",
        content: `root = Card([header, risks, trigger])
header = Header("Where Growth can break down", "Three conditions would justify moving up to Enterprise")
risks = List([riskOne, riskTwo, riskThree], "number")
riskOne = ListItem("Centralized access governance", "You need organization-wide roles, mandatory controls, or SCIM policy enforcement.")
riskTwo = ListItem("Long audit retention", "Security or regulatory reviews require more than 90 days of history.")
riskThree = ListItem("Cross-portfolio administration", "Several business units need separate controls with centralized oversight.")
trigger = CalloutV2("warning", "Set an explicit upgrade trigger", "Stay on Growth until two of these conditions are true; avoid paying for governance before the organization needs it.")`,
      },
      {
        id: "demo_product_comparison_user_3",
        role: "user",
        content: "Package the recommendation and a 30-day rollout into a decision brief.",
      },
      ...createArtifactTurn(
        "demo_product_comparison",
        PRODUCT_ARTIFACT,
        "I combined the recommendation, upgrade triggers, comparison, and rollout into a decision brief.",
      ),
    ],
  },
];

export const DEMO_ARTIFACTS: readonly DemoArtifact[] = DEMO_CONVERSATIONS.map(
  (conversation) => conversation.artifact,
);

const DEMO_CONVERSATIONS_BY_ID = new Map(
  DEMO_CONVERSATIONS.map((conversation) => [conversation.id, conversation]),
);
const DEMO_ARTIFACTS_BY_ID = new Map(DEMO_ARTIFACTS.map((artifact) => [artifact.id, artifact]));

export function getDemoConversation(id: string | null | undefined): DemoConversation | undefined {
  if (!id) return undefined;
  return DEMO_CONVERSATIONS_BY_ID.get(id as DemoConversation["id"]);
}

export function getDemoArtifact(id: string): DemoArtifact | undefined {
  return DEMO_ARTIFACTS_BY_ID.get(id as DemoArtifact["id"]);
}

export function getDemoTurnCount(conversation: DemoConversation): number {
  return conversation.messages.filter((message) => message.role === "user").length;
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

function createDemoArtifact(artifact: Omit<DemoArtifact, "content">): DemoArtifact {
  return {
    ...artifact,
    content: JSON.stringify({
      artifact_id: artifact.id,
      type: artifact.type,
      name: artifact.title,
      version: "1",
      content: artifact.program,
    }),
  };
}

function createArtifactTurn(idPrefix: string, artifact: DemoArtifact, summary: string): Message[] {
  const toolCallId = `${idPrefix}_artifact_call`;
  const toolName = artifact.type === "slides" ? "thesys_generate_slides" : "thesys_generate_report";
  const artifactLabel = artifact.type === "slides" ? "Presentation" : "Report";
  const toolArguments = JSON.stringify({
    artifact_id: artifact.id,
    artifact_type: artifact.type,
    type: artifact.type,
    name: artifact.title,
    version: "1",
    artifact_content: artifact.program,
  });
  const carrierHeader = JSON.stringify({
    artifact_id: artifact.id,
    type: artifact.type,
    name: artifact.title,
    version: "1",
  });

  return [
    {
      id: `${idPrefix}_artifact_assistant`,
      role: "assistant",
      content: `root = Card([ready, summary])
ready = CalloutV2("success", "${artifactLabel} ready", "Open the artifact to explore the complete, presentation-ready output.")
summary = TextContent(${JSON.stringify(summary)}, "small")`,
      toolCalls: [
        {
          id: toolCallId,
          type: "function",
          function: { name: toolName, arguments: toolArguments },
        },
      ],
    },
    {
      id: `${idPrefix}_artifact_tool`,
      role: "tool",
      toolCallId,
      content: `]]>openui:artifact ${carrierHeader}\n${artifact.program}`,
    },
  ];
}
