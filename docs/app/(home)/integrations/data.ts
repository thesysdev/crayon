import type { PageMetadataInput } from "@/lib/page-metadata";

export type IntegrationCategoryId = "ai-frameworks" | "design-systems" | "frontend-platforms";

export interface IntegrationLink {
  label: string;
  href: string;
  kind: "Docs" | "Example" | "Guide" | "GitHub" | "npm" | "Website" | "Plugin";
}

/** A snippet copied from the docs guide or example app the page links to. */
export interface IntegrationCode {
  /** Path in the source project, shown as the block's title. */
  filename: string;
  lang: "ts" | "tsx" | "js" | "vue" | "svelte" | "python" | "bash" | "json" | "html";
  code: string;
}

export interface IntegrationStep {
  title: string;
  description: string;
  code?: IntegrationCode;
}

export interface Integration {
  slug: string;
  name: string;
  /** Search title for <title>; the H1 keeps `name`. */
  seoTitle: string;
  logo: string;
  category: IntegrationCategoryId;
  type: string;
  summary: string;
  howItWorks: string;
  steps: IntegrationStep[];
  install?: string;
  links: IntegrationLink[];
}

export interface IntegrationCategory {
  id: IntegrationCategoryId;
  title: string;
  shortTitle: string;
  description: string;
}

export const integrationCategories: IntegrationCategory[] = [
  {
    id: "ai-frameworks",
    title: "AI frameworks, SDKs & protocols",
    shortTitle: "AI stack",
    description:
      "Connect OpenUI to the agent framework, AI SDK, or protocol your application already uses.",
  },
  {
    id: "design-systems",
    title: "Design systems & component libraries",
    shortTitle: "Design systems",
    description:
      "Use OpenUI's built-in components or connect the UI library your product already uses.",
  },
  {
    id: "frontend-platforms",
    title: "Frontend frameworks & platforms",
    shortTitle: "Frontend",
    description:
      "Run OpenUI in an alternative web, mobile, chat framework, or AI application platform.",
  },
];

const packageLinks = (
  packageName: string,
  sourceDirectory: string,
  docsHref?: string,
): IntegrationLink[] => [
  ...(docsHref ? [{ label: "Documentation", href: docsHref, kind: "Docs" as const }] : []),
  {
    label: "npm package",
    href: `https://www.npmjs.com/package/${packageName}`,
    kind: "npm",
  },
  {
    label: "Source code",
    href: `https://github.com/thesysdev/openui/tree/main/packages/${sourceDirectory}`,
    kind: "GitHub",
  },
];

const exampleLink = (directory: string, label = "OpenUI example"): IntegrationLink => ({
  label,
  href: `https://github.com/thesysdev/openui/tree/main/examples/${directory}`,
  kind: "Example",
});

const integrationCatalog: Integration[] = [
  // Design systems and component libraries.
  {
    slug: "shadcn-ui",
    name: "shadcn/ui",
    seoTitle: "shadcn/ui generative UI: let LLMs render your shadcn components",
    logo: "/integration-logos/shadcn-ui.svg",
    category: "design-systems",
    type: "Design system",
    summary:
      "To add generative UI to shadcn/ui, wrap your shadcn/ui components in an OpenUI library and let the model compose them as streaming interfaces.",
    howItWorks:
      "Each shadcn component is registered with defineComponent and a Zod prop schema. createLibrary produces both the prompt vocabulary and the renderer mapping used by the example chat app.",
    steps: [
      {
        title: "Wrap your shadcn/ui components",
        description:
          "Register each component with defineComponent and a Zod prop schema, then combine them with createLibrary. The example library covers 45+ components, including cards, tables, charts, forms, and dialogs.",
      },
      {
        title: "Generate the library spec",
        description:
          "Run openui generate --spec on the library file. The chat route passes that spec to generateSystemPrompt({ cloud: true }), so the model can only call components the client can render.",
      },
      {
        title: "Render the responses",
        description:
          "Pass the library to Renderer from @openuidev/react-lang wherever your app shows model output. For a ready-made chat app, the example passes it to AgentInterface as componentLibrary instead.",
      },
    ],
    links: [
      {
        label: "Integration guide",
        href: "/docs/openui-lang/examples/design-systems/shadcn",
        kind: "Guide",
      },
      exampleLink("design-systems/shadcn"),
      { label: "shadcn/ui", href: "https://ui.shadcn.com", kind: "Website" },
    ],
  },
  {
    slug: "material-ui",
    name: "Material UI",
    seoTitle: "Material UI (MUI) generative UI with OpenUI",
    logo: "/integration-logos/mui.svg",
    category: "design-systems",
    type: "Design system",
    summary:
      "To add generative UI to Material UI, expose your Material UI components to a model through OpenUI without replacing your existing React design system.",
    howItWorks:
      "The example wraps Material UI components with OpenUI definitions, generates a constrained component prompt, and renders model output back into the same Material UI primitives.",
    steps: [
      {
        title: "Map MUI components to OpenUI",
        description:
          "Wrap Material UI components with defineComponent and Zod schemas, and export them through createLibrary. Charts use @mui/x-charts.",
      },
      {
        title: "Generate the library spec",
        description:
          "Run openui generate --spec on src/library.ts. The chat route sends that spec to OpenUI Cloud and runs app-owned tools with runChatToolLoop.",
      },
      {
        title: "Render inside your MUI theme",
        description:
          "Render responses with Renderer, or with AgentInterface as the example does, inside your MUI ThemeProvider. Generated components then use the app's theme and light or dark mode.",
      },
    ],
    links: [
      exampleLink("design-systems/material-ui"),
      {
        label: "Defining components",
        href: "/docs/openui-lang/defining-components",
        kind: "Guide",
      },
      { label: "Material UI", href: "https://mui.com/material-ui", kind: "Website" },
    ],
  },
  {
    slug: "handsontable",
    name: "Handsontable",
    seoTitle: "Handsontable generative UI with OpenUI",
    logo: "https://raw.githubusercontent.com/handsontable/handsontable/develop/docs/public/favicon.png",
    category: "design-systems",
    type: "Data grid",
    summary:
      "To add generative UI to Handsontable, connect a live Handsontable spreadsheet to OpenUI so agent tools can analyze and update its data.",
    howItWorks:
      "The maintained example shares table state between Handsontable and a custom OpenUI SpreadsheetTable component. Tool calls update the server-side data, and the rendered component synchronizes those results back into the live grid.",
    steps: [
      {
        title: "Share the table state",
        description:
          "Keep the table in a server-side store that both the grid and the chat route use. Edits made in Handsontable sync back to the server through POST /api/table.",
      },
      {
        title: "Give the model spreadsheet tools",
        description:
          "Expose tools such as get_table_data, update_cells, add_rows, and set_formula. After a write, the model responds with a SpreadsheetTable component.",
      },
      {
        title: "Sync results into the grid",
        description:
          "The Renderer draws SpreadsheetTable from the custom library, and the useSpreadsheetSync hook pushes the new data into the live Handsontable instance.",
      },
    ],
    links: [
      exampleLink("miscellaneous/handsontable"),
      { label: "Handsontable", href: "https://handsontable.com", kind: "Website" },
    ],
  },
  {
    slug: "react-email",
    name: "React Email",
    seoTitle: "Generate React Email templates with an LLM",
    logo: "/integration-logos/react-email.svg",
    category: "design-systems",
    type: "Email component library",
    summary:
      "To generate React Email templates with an LLM, use OpenUI's React Email component package to generate, preview, and export email-safe interfaces.",
    howItWorks:
      "@openuidev/react-email provides 44 OpenUI component definitions, an emailLibrary, and prompt rules. OpenUI Lang streams into a React Email preview, which @react-email/render can convert to email-compatible HTML.",
    install: "npm install @openuidev/react-email @openuidev/react-lang",
    steps: [
      {
        title: "Import the email library",
        description:
          "Use emailLibrary from @openuidev/react-email. It covers 44 email-safe components, including headers, feature grids, pricing cards, and checkout tables.",
      },
      {
        title: "Generate the email prompt",
        description:
          "Build the system prompt from emailLibrary and emailPromptOptions, so the model composes emails only from those components.",
      },
      {
        title: "Preview and export HTML",
        description:
          "Stream the response into Renderer from @openuidev/react-lang for a live preview, then convert the email to client-compatible HTML with @react-email/render.",
      },
    ],
    links: [
      { label: "React Email API reference", href: "/docs/api-reference/react-email", kind: "Docs" },
      ...packageLinks("@openuidev/react-email", "react-email", "/docs/api-reference/react-email"),
      exampleLink("miscellaneous/react-email"),
      { label: "React Email", href: "https://react.email", kind: "Website" },
    ],
  },

  // AI frameworks, SDKs, and protocols.
  {
    slug: "langchain-langgraph",
    name: "LangChain & LangGraph",
    seoTitle: "LangGraph generative UI: build a frontend for LangGraph agents",
    logo: "https://raw.githubusercontent.com/langchain-ai/docs/main/src/images/brand/langchain-icon.png",
    category: "ai-frameworks",
    type: "Agent framework adapter",
    summary:
      "To give a LangGraph or LangChain agent a generative UI frontend, add the @openuidev/langchain stream transformer to your graph and render the stream with OpenUI. The agent's responses show up as interactive components instead of plain text.",
    howItWorks:
      "The @openuidev/langchain package transforms LangGraph protocol-v2 events into AG-UI on the server, then agUIAdapter() consumes the stream on the client. If your backend already returns native LangGraph named-event SSE, use the bundled langGraphAdapter() and langGraphMessageFormat instead.",
    install: "npm install @openuidev/langchain @langchain/langgraph",
    steps: [
      {
        title: "Add the stream transformer",
        description:
          "Add openUIStreamTransformer from @openuidev/langchain/transformer to your graph's streamTransformers, and give the agent the generated OpenUI system prompt.",
        code: {
          filename: "src/agent/agent.ts",
          lang: "ts",
          code: `import { cloudInstructions } from "@/lib/cloud-prompt";
import { ChatOpenAI } from "@langchain/openai";
import { openUIStreamTransformer } from "@openuidev/langchain/transformer";
import { createDeepAgent } from "deepagents";

import { getStockPrice, getWeather, searchWeb } from "./tools";

const model = new ChatOpenAI({
  model: "google/gemini-3.6-flash-free",
  apiKey: process.env.THESYS_API_KEY,
  streaming: true,
  configuration: { baseURL: "https://api.thesys.dev/v1/embed" },
});

export const graph = createDeepAgent({
  model,
  tools: [getWeather, getStockPrice, searchWeb],
  systemPrompt: cloudInstructions(
    [
      "You are an OpenUI assistant with weather, finance, and research tools.",
      "Use the tools when they help answer the user's request, then answer only in OpenUI Lang.",
    ].join("\\n"),
  ),
  streamTransformers: [openUIStreamTransformer],
});`,
        },
      },
      {
        title: "Expose an AG-UI route",
        description:
          "Return createLangChainStreamResponse(request, options) from a server route. It starts a protocol-v2 run and relays the output as AG-UI SSE while the API key and deployment URL stay on the server.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `import { createLangChainStreamResponse } from "@openuidev/langchain";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return createLangChainStreamResponse(request, {
    apiUrl: process.env.LANGGRAPH_API_URL ?? "http://localhost:2024",
    assistantId: process.env.LANGGRAPH_ASSISTANT_ID ?? "agent",
    apiKey: process.env.LANGSMITH_API_KEY,
    debug: process.env.NODE_ENV !== "production",
  });
}`,
        },
      },
      {
        title: "Connect your chat UI",
        description:
          "Point fetchLLM at the route with agUIAdapter(), then pass it to AgentInterface for a ready-made chat app or to ChatProvider from @openuidev/react-headless for your own UI. For native LangGraph named-event SSE, use langGraphAdapter() with langGraphMessageFormat instead.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
});

export default function Page() {
  return (
    <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI + DeepAgents Chat" />
  );
}`,
        },
      },
    ],
    links: [
      ...packageLinks("@openuidev/langchain", "langchain", "/docs/api-reference/langchain"),
      {
        label: "Stream adapters",
        href: "/docs/agent/reference/adapters-and-formats#langgraphadapter",
        kind: "Docs",
      },
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/langgraph",
        kind: "Guide",
      },
      exampleLink("agent-frameworks/langgraph-platform"),
    ],
  },
  {
    slug: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    seoTitle: "Vercel AI SDK generative UI with OpenUI",
    logo: "/integration-logos/vercel.svg",
    category: "ai-frameworks",
    type: "AI SDK adapter",
    summary:
      "To add generative UI to a Vercel AI SDK app, return the UIMessage stream from streamText() and render it with OpenUI's vercelAIAdapter(). It works with AI SDK v6 and v7 and handles text, tool calls and multi-step runs.",
    howItWorks:
      "Return the UIMessage SSE produced by streamText().toUIMessageStreamResponse(), then use vercelAIAdapter() with vercelAIMessageFormat on the client. OpenUI validates AI SDK v6 or v7 chunks and maps streamed text, tool inputs, tool results, multi-step lifecycles, and errors into AG-UI events.",
    install: "npm install @openuidev/react-ui ai",
    steps: [
      {
        title: "Stream with streamText",
        description:
          "Call streamText with the generated OpenUI system prompt and your AI SDK tools, then return toUIMessageStreamResponse() from the route.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `import { cloudInstructions } from "@/lib/cloud-prompt";
import { tools } from "@/lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";

const gateway = createOpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: gateway.chat("google/gemini-3.6-flash-free"),
    system: cloudInstructions(),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}`,
        },
      },
      {
        title: "Configure the adapter",
        description:
          "Create the client connection with fetchLLM({ streamAdapter: vercelAIAdapter(), messageFormat: vercelAIMessageFormat }).",
        code: {
          filename: "src/app/page.tsx",
          lang: "ts",
          code: `import { fetchLLM, vercelAIAdapter, vercelAIMessageFormat } from "@openuidev/react-ui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: vercelAIAdapter(),
  messageFormat: vercelAIMessageFormat,
});`,
        },
      },
      {
        title: "Connect your chat UI",
        description:
          "Pass that llm to AgentInterface for a ready-made chat app, or to ChatProvider from @openuidev/react-headless to build your own UI. Either way, streamed text, tool calls, and multi-step runs arrive as the same chat events.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import { AgentInterface } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

// const llm = fetchLLM({ ... }) from the previous step

export default function Page() {
  return (
    <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI + Vercel AI SDK" />
  );
}`,
        },
      },
    ],
    links: [
      {
        label: "Vercel AI adapter",
        href: "/docs/agent/reference/adapters-and-formats#vercelaiadapter",
        kind: "Docs",
      },
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/vercel-ai-sdk",
        kind: "Guide",
      },
      ...packageLinks("@openuidev/react-headless", "react-headless"),
      exampleLink("agent-frameworks/vercel-ai-sdk"),
      { label: "AI SDK", href: "https://ai-sdk.dev", kind: "Website" },
    ],
  },
  {
    slug: "google-adk",
    name: "Google ADK",
    seoTitle: "Google ADK agent UI: render rich interfaces with OpenUI",
    logo: "/integration-logos/google.svg",
    category: "ai-frameworks",
    type: "Agent SDK",
    summary:
      "To give a Google ADK agent a UI, run it in a server route that maps ADK run events to AG-UI, then render the stream with OpenUI. The example uses ADK for TypeScript with tools and multi-turn sessions.",
    howItWorks:
      "A Google ADK Agent and FunctionTool run in a Next.js route. The route maps ADK runAsync events to AG-UI SSE, which agUIAdapter() parses on the client.",
    install:
      "npm install @google/adk adk-llm-bridge @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod",
    steps: [
      {
        title: "Define the agent",
        description:
          "Create an ADK Agent with FunctionTool tools and use the generated OpenUI system prompt as its instruction. The example calls OpenUI Cloud through adk-llm-bridge's Custom() model adapter.",
        code: {
          filename: "src/agent.ts",
          lang: "ts",
          code: `import { cloudInstructions } from "@/lib/cloud-prompt";
import { Agent, FunctionTool } from "@google/adk";
import { Custom } from "adk-llm-bridge";
import { z } from "zod";

export const getWeather = new FunctionTool({
  name: "get_weather",
  description: "Get the current weather for a given city.",
  parameters: z.object({
    city: z.string().describe('The city to get the weather for, e.g. "Tokyo".'),
  }),
  execute: ({ city }) => {
    // ...
  },
});

export function createAgent() {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");
  return new Agent({
    name: "openui-adk-agent",
    model: Custom("google/gemini-3.6-flash-free", {
      name: "openui-adk-agent",
      baseURL: "https://api.thesys.dev/v1/embed",
      apiKey,
    }),
    instruction: cloudInstructions(),
    tools: [getWeather],
  });
}`,
        },
      },
      {
        title: "Bridge events to AG-UI",
        description:
          "Run the agent with a Runner whose sessions are keyed by chat thread, and map text, functionCall, and functionResponse parts to AG-UI text and tool events.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `import { createAgent } from "@/agent";
import { adkToAguiEvents } from "@/lib/adk-to-agui";
import { Runner, StreamingMode } from "@google/adk";
import { NextRequest } from "next/server";
// ...
function getRunner(): Runner {
  runner ??= new Runner({
    appName: APP_NAME,
    agent: createAgent(),
    sessionService,
  });
  return runner;
}
// ...
export async function POST(req: NextRequest) {
  // ...
  for await (const event of adkToAguiEvents(
    getRunner().runAsync({
      userId: USER_ID,
      sessionId,
      newMessage: { parts: [{ text: prompt }] },
      runConfig: { streamingMode: StreamingMode.SSE },
      abortSignal: req.signal,
    }),
    { threadId: resolvedThreadId, runId },
  )) {
    enqueue(event);
  }
  // ...
}`,
        },
      },
      {
        title: "Connect your chat UI",
        description:
          "Create an llm with fetchLLM and agUIAdapter(), then pass it to AgentInterface for a ready-made chat app or to ChatProvider from @openuidev/react-headless for your own UI.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import { AgentInterface, agUIAdapter, fetchLLM, useSystemThemeMode } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useSystemThemeMode();
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: agUIAdapter(),
      }),
    [],
  );

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="OpenUI + Google ADK Chat"
        theme={{ mode }}
        // ...
      />
    </div>
  );
}`,
        },
      },
    ],
    links: [
      exampleLink("agent-frameworks/google-adk"),
      { label: "Google ADK", href: "https://github.com/google/adk-js", kind: "GitHub" },
    ],
  },
  {
    slug: "mastra",
    name: "Mastra",
    seoTitle: "Mastra generative UI: build a frontend for Mastra agents",
    logo: "/integration-logos/mastra.svg",
    category: "ai-frameworks",
    type: "Agent framework",
    summary:
      "To build a UI for a Mastra agent, connect it to OpenUI over AG-UI and render its streamed output as typed interfaces.",
    howItWorks:
      "Mastra owns the agent and tools, the AG-UI transport serializes the run as SSE, and OpenUI's agUIAdapter drives the chat state and component renderer on the client.",
    install:
      "npm install @mastra/core @ag-ui/mastra @ag-ui/core @openuidev/react-ui @openuidev/react-lang @openuidev/lang-core zod",
    steps: [
      {
        title: "Build the Mastra agent",
        description:
          "Define the Agent with createTool tools and the generated OpenUI instructions. The example registers a custom Mastra gateway that routes model calls through OpenUI Cloud.",
        code: {
          filename: "src/mastra.ts",
          lang: "ts",
          code: `import { cloudInstructions } from "@/lib/cloud-prompt";
import { OpenUICloudGateway, openuiCloudModelId } from "@/openui-cloud-gateway";
import { getStockPrice, getWeather } from "@/tools";
import { Agent } from "@mastra/core/agent";
import { Mastra } from "@mastra/core";

export const openuiAgent = new Agent({
  id: "openui-mastra-agent",
  name: "OpenUI x Mastra Agent",
  instructions: cloudInstructions(
    "You are a helpful assistant. Use tools when relevant and help the user with their requests. Always format your responses cleanly.",
  ),
  model: { id: openuiCloudModelId },
  tools: { getWeather, getStockPrice },
});

export const mastra = new Mastra({
  gateways: {
    openuiCloud: new OpenUICloudGateway(),
  },
  agents: {
    openui: openuiAgent,
  },
});`,
        },
      },
      {
        title: "Stream AG-UI events",
        description:
          "Wrap the agent with MastraAgent from @ag-ui/mastra in a server route and stream its AG-UI events to the browser as SSE.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `import { MastraAgent } from "@ag-ui/mastra";
import type { Message } from "@ag-ui/core";
import { NextRequest } from "next/server";
import { openuiAgent } from "@/mastra";

const agent = new MastraAgent({
  agent: openuiAgent,
  resourceId: "chat-user",
});

export async function POST(req: NextRequest) {
  // ...
  const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();
  // ...
  const subscription = agent
    .run({
      messages,
      threadId,
      runId: crypto.randomUUID(),
      tools: [],
      context: [],
    })
    .subscribe({
      next: (event) => {
        controller.enqueue(encoder.encode(\`data: \${JSON.stringify(event)}\\n\\n\`));
      },
      // ...
    });
  // ...
}`,
        },
      },
      {
        title: "Connect your chat UI",
        description:
          "Create an llm with fetchLLM and agUIAdapter(), then pass it to AgentInterface for a ready-made chat app or to ChatProvider from @openuidev/react-headless for your own UI.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  // ...
  // fetchLLM's default message format POSTs { messages, threadId, ... } —
  // exactly what the Mastra route expects. Storage is omitted, so
  // AgentInterface uses its built-in in-memory default (wiped on reload).
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: agUIAdapter(),
      }),
    [],
  );
  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="OpenUI + Mastra Chat"
        // ...
      />
    </div>
  );
}`,
        },
      },
    ],
    links: [
      exampleLink("agent-frameworks/mastra"),
      {
        label: "Mastra integration guide",
        href: "https://mastra.ai/guides/build-your-ui/openui",
        kind: "Guide",
      },
      { label: "Mastra", href: "https://mastra.ai", kind: "Website" },
    ],
  },
  {
    slug: "assistant-ui",
    name: "assistant-ui",
    seoTitle: "assistant-ui + OpenUI: generative UI inside assistant-ui chats",
    logo: "/integration-logos/assistant-ui.svg",
    category: "frontend-platforms",
    type: "Chat framework",
    summary:
      "To add generative UI to an assistant-ui chat, register the @openuidev/assistant-ui toolkit so the model can render cards, tables, charts and forms as Tool UI. assistant-ui keeps control of the conversation lifecycle.",
    howItWorks:
      "The @openuidev/assistant-ui toolkit registers display and human-input tools, generates matching model instructions, renders partial OpenUI Lang, and sends validated form actions back through assistant-ui's tool result flow.",
    install: "npm install @openuidev/assistant-ui @assistant-ui/react",
    steps: [
      {
        title: "Register the OpenUI toolkit",
        description:
          "Inside AssistantRuntimeProvider, add openuiIntegration.toolkit through AuiConfig and pass openuiIntegration.instructions to useAssistantInstructions.",
        code: {
          filename: "src/components/openui-runtime-provider.tsx",
          lang: "tsx",
          code: `"use client";

import {
  AuiConfig,
  AuiProvider,
  Tools,
  useAui,
  useAssistantInstructions,
} from "@assistant-ui/react";
import { openuiIntegration } from "@openuidev/assistant-ui";

function OpenUIModelInstructions() {
  useAssistantInstructions(openuiIntegration.instructions);
  return null;
}

function OpenUIConfigProvider({ children }: { children: React.ReactNode }) {
  const aui = useAui();
  const config = AuiConfig({
    tools: Tools({ toolkit: openuiIntegration.toolkit }),
  });

  return (
    <AuiProvider extends={aui} config={config}>
      <OpenUIModelInstructions />
      {children}
    </AuiProvider>
  );
}`,
        },
      },
      {
        title: "Let the model call the OpenUI tools",
        description:
          "present_openui renders complete cards, tables, and charts. prompt_openui renders forms and choices, and completes only when the user submits a result. With an AI SDK runtime, shouldContinueAfterOpenUIPrompt starts the next model step only after a prompt_openui result.",
        code: {
          filename: "src/components/openui-runtime-provider.tsx",
          lang: "tsx",
          code: `import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { shouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";

// ...

export function OpenUIRuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: shouldContinueAfterOpenUIPrompt,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <OpenUIConfigProvider>{children}</OpenUIConfigProvider>
    </AssistantRuntimeProvider>
  );
}`,
        },
      },
      {
        title: "Bring your own components",
        description:
          "Call createOpenUIIntegration with your own library so the tool schemas, model instructions, and renderers share one component vocabulary.",
        code: {
          filename: "src/lib/openui-integration.ts",
          lang: "ts",
          code: `import { createOpenUIIntegration } from "@openuidev/assistant-ui";
import { createShouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";
import { library } from "./library";

const openui = createOpenUIIntegration({
  library,
  presentToolName: "show_panel",
  promptToolName: "ask_panel",
});
const shouldContinue = createShouldContinueAfterOpenUIPrompt({
  promptToolName: openui.toolNames.prompt,
});`,
        },
      },
    ],
    links: [
      { label: "assistant-ui guide", href: "/docs/build-agents/assistant-ui", kind: "Docs" },
      ...packageLinks("@openuidev/assistant-ui", "assistant-ui"),
      {
        label: "assistant-ui guide",
        href: "https://www.assistant-ui.com/docs/tools/openui",
        kind: "Guide",
      },
      {
        label: "Runnable example",
        href: "https://github.com/assistant-ui/assistant-ui/tree/main/examples/with-openui",
        kind: "Example",
      },
    ],
  },
  {
    slug: "ag-ui",
    name: "AG-UI",
    seoTitle: "AG-UI frontend: render AG-UI streams as generative UI",
    logo: "/integration-logos/ag-ui.svg",
    category: "ai-frameworks",
    type: "Agent protocol",
    summary:
      "OpenUI works as a frontend for AG-UI: point it at any AG-UI SSE endpoint and agUIAdapter() renders the event stream as generative UI. Text message, tool call, tool result and run error events are supported.",
    howItWorks:
      "Point fetchLLM or a direct ChatLLM implementation at an AG-UI SSE endpoint and use agUIAdapter() as the stream adapter. OpenUI maps text message, tool call, tool result and run error events into its chat runtime, and the run ends when the stream closes.",
    steps: [
      {
        title: "Prompt your agent for OpenUI Lang",
        description:
          "Give the agent a system prompt generated from the same component library the client renders, so its text output is valid OpenUI Lang.",
        code: {
          filename: "server.ts",
          lang: "ts",
          code: `import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import library from "./lib/openui.spec.json";

// The complete prompt, ready to send to any model.
const openuiInstructions = generateSystemPrompt({
  library: library as LibrarySpec,
});`,
        },
      },
      {
        title: "Serve AG-UI events",
        description:
          "Expose the agent as an SSE endpoint whose data lines are AG-UI events: TEXT_MESSAGE_* for text, TOOL_CALL_* and TOOL_CALL_RESULT for tools, and RUN_ERROR for failures. Close the stream to end the run.",
        code: {
          filename: "app/api/chat/route.ts",
          lang: "ts",
          code: `import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); // server-side only

export async function POST(req: Request) {
  const { messages } = await req.json(); // { threadId, messages } from fetchLLM
  // ...
  const stream = new ReadableStream({
    async start(controller) {
      const sse = (event: object) =>
        controller.enqueue(new TextEncoder().encode(\`data: \${JSON.stringify(event)}\\n\\n\`));
      const messageId = crypto.randomUUID();

      try {
        const anthropicStream = anthropic.messages.stream({
          // ...
        });

        sse({ type: "TEXT_MESSAGE_START", messageId });
        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            sse({ type: "TEXT_MESSAGE_CONTENT", messageId, delta: chunk.delta.text });
          }
        }
        sse({ type: "TEXT_MESSAGE_END", messageId });
      } catch (err) {
        sse({
          type: "RUN_ERROR",
          message: err instanceof Error ? err.message : "Anthropic call failed",
        });
      } finally {
        controller.close(); // flips the UI loading state off — leave it open and the loader never disappears
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      // ...
    },
  });
}`,
        },
      },
      {
        title: "Connect the adapter",
        description:
          "Point fetchLLM, or your own ChatLLM implementation, at that endpoint with agUIAdapter() as the stream adapter. Pass it to AgentInterface for a ready-made chat app, or to ChatProvider from @openuidev/react-headless for your own UI.",
        code: {
          filename: "app/page.tsx",
          lang: "tsx",
          code: `"use client";

import { AgentInterface, agUIAdapter, fetchLLM, openAIMessageFormat } from "@openuidev/react-ui";
import { library } from "@/lib/openui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
  messageFormat: openAIMessageFormat,
});

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={library} />;
}`,
        },
      },
    ],
    links: [
      {
        label: "Adapters and formats",
        href: "/docs/agent/reference/adapters-and-formats",
        kind: "Docs",
      },
      { label: "AG-UI documentation", href: "https://docs.ag-ui.com", kind: "Website" },
      { label: "AG-UI source", href: "https://github.com/ag-ui-protocol/ag-ui", kind: "GitHub" },
    ],
  },
  {
    slug: "grok-build",
    name: "Grok Build",
    seoTitle: "Grok Build generative UI with OpenUI",
    logo: "https://media.x.ai/v1/website/spacexai-symbol-black-transparent-6435cf42.png",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "To build a UI for Grok Build, use OpenUI as a generative UI frontend for persistent Grok Build coding-agent sessions.",
    howItWorks:
      "The maintained local harness talks to Grok Build through its official Agent Client Protocol stdio mode, injects the generated OpenUI rules, and maps reasoning, text, tools, and interactions into AG-UI events for AgentInterface. As shipped, it is an unauthenticated single-user harness and needs authentication, sandboxing, and a stricter permission policy before networked deployment.",
    steps: [
      {
        title: "Install and sign in to Grok Build",
        description:
          "Put the grok CLI on your PATH and run grok login. In non-interactive environments, set XAI_API_KEY instead.",
      },
      {
        title: "Start the harness on a workspace",
        description:
          "Launch the example with the project directory Grok Build should work in. It runs one grok agent stdio process and opens a separate ACP session for each OpenUI thread, with the OpenUI prompt added as session rules.",
      },
      {
        title: "Answer questions and approve plans in the browser",
        description:
          "Grok's clarifying questions and plan approvals appear as browser dialogs, and your answers go back over ACP so the same turn can continue.",
      },
    ],
    links: [
      exampleLink("harnesses/grok-build", "OpenUI harness"),
      { label: "Grok Build", href: "https://github.com/xai-org/grok-build", kind: "GitHub" },
    ],
  },
  {
    slug: "vercel-eve",
    name: "Vercel Eve",
    seoTitle: "Vercel Eve generative UI with OpenUI",
    logo: "https://raw.githubusercontent.com/vercel/eve/main/.github/assets/eve.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "To build a UI for Vercel Eve, connect Eve's resumable agent sessions to OpenUI while preserving Eve's native runtime.",
    howItWorks:
      "The maintained harness delivers turns over Eve's native session protocol, resumes its event stream from a stored cursor, and translates Eve text, tool, and failure events into AG-UI for AgentInterface. The example uses an unauthenticated local Eve channel; a deployed version must configure channel authentication and appropriate tool permissions.",
    steps: [
      {
        title: "Add the OpenUI instructions",
        description:
          "Add an Eve instruction that injects the generated OpenUI Lang prompt when each session starts, alongside the agent's own identity and tools.",
      },
      {
        title: "Deliver turns over Eve's session protocol",
        description:
          "Send each turn through Eve's HTTP channel and store the session cursor per OpenUI thread, so the NDJSON event stream can resume where it stopped.",
      },
      {
        title: "Map events with eveAdapter()",
        description:
          "Use eveAdapter() from @openuidev/react-headless as the llm's stream protocol. It converts Eve text, tool call, and failure events into AG-UI for AgentInterface or your own UI built on ChatProvider.",
      },
    ],
    links: [
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/vercel-eve",
        kind: "Guide",
      },
      exampleLink("agent-frameworks/vercel-eve", "OpenUI harness"),
      { label: "Vercel Eve", href: "https://github.com/vercel/eve", kind: "GitHub" },
    ],
  },
  {
    slug: "pi-coding-agent",
    name: "Pi Coding Agent",
    seoTitle: "Pi Coding Agent generative UI with OpenUI",
    logo: "/integration-logos/pi.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "To build a UI for Pi Coding Agent, embed the Pi coding-agent SDK behind OpenUI and render its answers, reasoning, and tool activity.",
    howItWorks:
      "The maintained local harness embeds @earendil-works/pi-coding-agent in a Next.js route, injects the prompt generated from OpenUI's component library, and converts Pi text, reasoning, and tool events into an OpenAI-compatible stream consumed by openAIReadableStreamAdapter(). It exposes real filesystem and shell tools, so the shipped unauthenticated harness must not be exposed to a network as-is.",
    steps: [
      {
        title: "Embed the Pi SDK",
        description:
          "Create one Pi AgentSession per chat thread with createAgentSession in a Node.js route. Point its model at OpenUI Cloud and append the generated OpenUI prompt.",
      },
      {
        title: "Translate Pi events",
        description:
          "Write Pi text deltas to delta.content and its reasoning and tool executions to delta.tool_calls, one OpenAI chat.completion.chunk per NDJSON line.",
      },
      {
        title: "Render with the NDJSON adapter",
        description:
          "Parse the stream with openAIReadableStreamAdapter(), then render the answers, reasoning, and tool activity with AgentInterface or your own UI built on ChatProvider.",
      },
    ],
    links: [
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/pi",
        kind: "Guide",
      },
      exampleLink("harnesses/pi", "OpenUI harness"),
      { label: "Pi", href: "https://pi.dev", kind: "Website" },
      { label: "Pi source", href: "https://github.com/earendil-works/pi", kind: "GitHub" },
    ],
  },

  {
    slug: "open-webui",
    name: "Open WebUI",
    seoTitle: "Open WebUI generative UI: render rich interfaces in Open WebUI",
    logo: "https://raw.githubusercontent.com/open-webui/open-webui/main/backend/open_webui/static/favicon-96x96.png",
    category: "frontend-platforms",
    type: "AI platform",
    summary:
      "To add generative UI to Open WebUI, install the OpenUI plugin to render charts, forms, tables, cards, and follow-ups directly inside Open WebUI conversations.",
    howItWorks:
      "The plugin gives the model a render_openui tool and returns a self-contained HTML response. Open WebUI shows it as an inline iframe embed, which loads the OpenUI browser bundle and renders the generated program.",
    steps: [
      {
        title: "Install the tool",
        description:
          "Import the plugin from the Open WebUI community site, or create a tool in Admin > Tools and paste in the plugin's tool.py.",
        code: {
          filename: "tool.py",
          lang: "python",
          code: `"""
title: OpenUI - Generative UI
author: thesysdev/vishxrad
version: 0.5.0
description: Renders interactive generative UI components (charts, forms, tables, cards, follow-ups) in chat using OpenUI Lang.
"""`,
        },
      },
      {
        title: "Enable it for a model",
        description:
          "Turn the tool on for the models or chats that should render UI. The model calls render_openui when an answer needs a chart, form, table, or card.",
        code: {
          filename: "tool.py",
          lang: "python",
          code: `from starlette.responses import HTMLResponse
# ...
class Tools:
    # ...
    async def render_openui(
        self,
        openui_lang_code: str,
        title: str = "Response",
        __event_emitter__=None,
        __event_call__=None,
    ) -> tuple:
        """
        Render interactive UI components inline in the chat using OpenUI Lang.
        Use this tool whenever a visual response would be helpful: tables, charts,
        forms, lists, cards, step guides, follow-up suggestions, etc.
        ...
        """
        # ...
        theme = await _get_openwebui_theme(__event_call__)
        response = HTMLResponse(
            content=_build_openui_html(openui_lang_code, title, self.valves.cdn_base_url, theme),
            headers={"Content-Disposition": "inline"},
        )
        # ...
        return response, result_context`,
        },
      },
      {
        title: "Choose where the bundle loads from",
        description:
          "The cdn_base_url valve sets where the OpenUI browser bundle loads from. By default it is the latest @openuidev/browser-bundle on jsDelivr.",
        code: {
          filename: "tool.py",
          lang: "python",
          code: `from pydantic import BaseModel, Field
# ...
_CDN_BASE = "https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@latest"
# ...
class Tools:
    # ...
    class Valves(BaseModel):
        cdn_base_url: str = Field(
            default=_CDN_BASE,
            description="Base CDN URL for the OpenUI bundle. Change if self-hosting or using a different version.",
        )
    def __init__(self):
        self.valves = self.Valves()`,
        },
      },
    ],
    links: [
      {
        label: "Plugin source",
        href: "https://github.com/thesysdev/openwebui-plugin",
        kind: "Plugin",
      },
      {
        label: "Install guide",
        href: "https://openwebui.com/posts/generative_ui_plugin_for_open_webui_6c017d62",
        kind: "Guide",
      },
      { label: "Open WebUI", href: "https://openwebui.com", kind: "Website" },
    ],
  },

  // Frontend frameworks and platforms.
  {
    slug: "lynx",
    name: "Lynx",
    seoTitle: "Lynx generative UI with OpenUI",
    logo: "/integration-logos/lynx.svg",
    category: "frontend-platforms",
    type: "Cross-platform runtime",
    summary:
      "To add generative UI to Lynx, render streaming OpenUI Lang as cross-platform interfaces through Lynx's native rendering pipeline.",
    howItWorks:
      "@lynx-js/genui/openui incrementally parses OpenUI Lang, maps registered expressions to ReactLynx components, and renders them through Lynx's native pipeline while the host application owns its component definitions, tools, and actions.",
    install: "npm install @lynx-js/genui @lynx-js/react @lynx-js/lynx-ui",
    steps: [
      {
        title: "Create the library",
        description:
          "Build a component library with createOpenUiLibrary() from @lynx-js/genui/openui, and import the renderer stylesheet from @lynx-js/genui/openui/styles/renderer.css.",
      },
      {
        title: "Generate the agent instructions",
        description:
          "On the server, build the system prompt with buildOpenUiSystemPrompt() from @lynx-js/genui/openui/prompt.",
      },
      {
        title: "Render with OpenUiRenderer",
        description:
          "Pass the full text received so far, not just the latest delta, to OpenUiRenderer with the library. Handle host-side effects such as navigation in onAction.",
      },
    ],
    links: [
      {
        label: "OpenUI integration guide",
        href: "https://lynxjs.org/next/react/genui/openui.html",
        kind: "Guide",
      },
      {
        label: "npm package",
        href: "https://www.npmjs.com/package/@lynx-js/genui",
        kind: "npm",
      },
      {
        label: "Source code",
        href: "https://github.com/lynx-family/lynx-stack/tree/main/packages/genui/openui",
        kind: "GitHub",
      },
      { label: "Lynx", href: "https://lynxjs.org", kind: "Website" },
    ],
  },
  {
    slug: "vue",
    name: "Vue 3",
    seoTitle: "Generative UI for Vue",
    logo: "/integration-logos/vue.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "To build generative UI in Vue, register Vue 3 single-file components with Zod schemas and render streamed OpenUI Lang with @openuidev/vue-lang. The Renderer component takes the response as a prop, and composables such as useTriggerAction connect your components to it.",
    howItWorks:
      "Each SFC declares a props prop for the parsed values and a renderNode prop for nested content, and defineComponent pairs it with a Zod schema whose key order sets the positional arguments in OpenUI Lang. Renderer reports back through callback props such as onAction, onStateUpdate and onError rather than emitted events. Inside it, composables like useTriggerAction, useSetFieldValue and useIsStreaming give components access to actions, form state and streaming status.",
    install: "npm install @openuidev/vue-lang zod",
    steps: [
      {
        title: "Write the component as an SFC",
        description:
          "A registered component receives the parsed values in a props prop and a renderNode function. Declare both with defineProps, otherwise Vue forwards renderNode to the root element as an attribute.",
        code: {
          filename: "Greeting.vue",
          lang: "vue",
          code: `<script setup lang="ts">
import type { RenderNodeResult } from "@openuidev/vue-lang";

defineProps<{
  props: { name?: string };
  renderNode: (value: unknown) => RenderNodeResult;
}>();
</script>

<template>
  <p>Hello, {{ props.name }}!</p>
</template>`,
        },
      },
      {
        title: "Register it and generate the prompt",
        description:
          "Pair the SFC with a Zod schema in defineComponent, collect the definitions with createLibrary, and call library.prompt(). A Nuxt server route cannot import .vue files, so share the schemas there and generate the prompt with @openuidev/lang-core ^0.4.",
        code: {
          filename: "library.ts",
          lang: "ts",
          code: `import { createLibrary, defineComponent } from "@openuidev/vue-lang";
import { z } from "zod/v4";
import GreetingComponent from "./Greeting.vue";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Greet the user by name.",
  props: z.object({ name: z.string() }),
  component: GreetingComponent,
});

export const library = createLibrary({
  components: [Greeting],
  root: "Greeting",
});

const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant.",
  examples: ['root = Greeting("Alice")'],
});`,
        },
      },
      {
        title: "Render the stream with Renderer",
        description:
          "Bind the accumulated text, the library and the streaming flag with :response, :library and :is-streaming. Renderer callbacks are props, not emitted events, so bind onAction with :on-action and send continuation actions back to the model as a new turn.",
        code: {
          filename: "AssistantMessage.vue",
          lang: "vue",
          code: `<script setup lang="ts">
import { Renderer, type ActionEvent } from "@openuidev/vue-lang";
import { library } from "./library";

defineProps<{ response: string | null; isStreaming: boolean }>();

function handleAction(event: ActionEvent) {
  // Forward continuation actions to your application's normal send-message path.
  console.log(event.humanFriendlyMessage, event.formState);
}
</script>

<template>
  <Renderer
    :response="response"
    :library="library"
    :is-streaming="isStreaming"
    :on-action="handleAction"
  />
</template>`,
        },
      },
    ],
    links: [
      { label: "Vue Lang API reference", href: "/docs/api-reference/vue-lang", kind: "Docs" },
      ...packageLinks("@openuidev/vue-lang", "vue-lang"),
      exampleLink("app-frameworks/vue"),
      { label: "Vue", href: "https://vuejs.org", kind: "Website" },
    ],
  },
  {
    slug: "angular",
    name: "Angular",
    seoTitle: "Generative UI for Angular",
    logo: "/integration-logos/angular.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "To build generative UI in Angular, register standalone components with Zod schemas and render streamed OpenUI Lang with the <openui-renderer> component from @openuidev/angular-lang. Results reach your app through outputs such as (action) and (error).",
    howItWorks:
      "Each registered component accepts props, renderNode and statementId inputs, and defineComponent pairs its class with a Zod schema. The <openui-renderer> component takes response, library and isStreaming inputs, emits (action), (stateUpdate), (parseResult) and (error) outputs, and runs Query() and mutation calls through a toolProvider. Inside it, injection helpers such as injectTriggerAction and injectIsStreaming expose actions and streaming state, the latter as a Signal.",
    install: "npm install @openuidev/angular-lang zod rxjs",
    steps: [
      {
        title: "Define a standalone component",
        description:
          "Give the component props, renderNode and statementId inputs, which the renderer sets on every instance, and register its class with defineComponent and a Zod schema. Use optional access in the template, since props can be incomplete while the model streams.",
        code: {
          filename: "library.ts",
          lang: "ts",
          code: `import { Component, Input } from "@angular/core";
import { createLibrary, defineComponent } from "@openuidev/angular-lang";
import { z } from "zod/v4";

@Component({
  selector: "demo-greeting",
  template: \`<p>Hello, {{ props?.name }}!</p>\`,
})
export class GreetingComponent {
  @Input() props: { name?: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined;
}

const Greeting = defineComponent({
  name: "Greeting",
  description: "Greet the user by name.",
  props: z.object({ name: z.string() }),
  component: GreetingComponent,
});

export const library = createLibrary({
  components: [Greeting],
  root: "Greeting",
});`,
        },
      },
      {
        title: "Generate the prompt on a Node server",
        description:
          "Keep the Zod schemas in a file both sides import, and rebuild the library on the server with @openuidev/lang-core ^0.4 and component: null so it never loads Angular classes. The example's build script passes library.toSpec() to generateSystemPrompt and writes the prompt to a file the server reads.",
        code: {
          filename: "server/library.mjs",
          lang: "js",
          code: `import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { definitions, promptOptions } from "../src/app/openui/schema.ts";
export { promptOptions };
const blocks = Object.entries(definitions).map(([name, definition]) =>
  defineComponent({ name, ...definition, component: null }),
);
const root = defineComponent({
  name: "Response",
  description: "Root container for every assistant message.",
  props: z.object({ children: z.array(z.union(blocks.map((block) => block.ref))) }),
  component: null,
});
export const library = createLibrary({
  id: "angular-agent-chat",
  root: "Response",
  components: [root, ...blocks],
});`,
        },
      },
      {
        title: "Render with openui-renderer",
        description:
          "Add Renderer to the host component's imports, bind [response], [library] and [isStreaming], and handle (action) to send the next turn. The same element also emits (stateUpdate) and (error) and accepts a [toolProvider] for Query() and mutation calls.",
        code: {
          filename: "assistant-message.ts",
          lang: "ts",
          code: `import { Component, Input } from "@angular/core";
import { Renderer, type ActionEvent } from "@openuidev/angular-lang";
import { library } from "./library";

@Component({
  selector: "assistant-message",
  imports: [Renderer],
  template: \`
    <openui-renderer
      [response]="response"
      [library]="library"
      [isStreaming]="isStreaming"
      (action)="handleAction($event)"
    />
  \`,
})
export class AssistantMessageComponent {
  @Input() response: string | null = null;
  @Input() isStreaming = false;
  readonly library = library;

  handleAction(event: ActionEvent): void {
    // Forward continuation actions to your application's normal send-message path.
    console.log(event.humanFriendlyMessage, event.formState);
  }
}`,
        },
      },
    ],
    links: [
      {
        label: "Angular Lang API reference",
        href: "/docs/api-reference/angular-lang",
        kind: "Docs",
      },
      ...packageLinks(
        "@openuidev/angular-lang",
        "angular-lang",
        "/docs/api-reference/angular-lang",
      ),
      exampleLink("app-frameworks/angular"),
      { label: "Angular", href: "https://angular.dev", kind: "Website" },
    ],
  },
  {
    slug: "react-native",
    name: "React Native",
    seoTitle: "Generative UI for React Native",
    logo: "/integration-logos/react.svg",
    category: "frontend-platforms",
    type: "Mobile framework",
    summary:
      "To add generative UI to a React Native app, render model-generated interfaces in a native mobile chat application with a dedicated component library.",
    howItWorks:
      "The reference project pairs a React Native chat app with a backend that prompts for OpenUI Lang. Native component definitions map the same structured response model to mobile views and actions.",
    steps: [
      {
        title: "Describe the components on the backend",
        description:
          "Define the component vocabulary (Card, Text, and chart components) with defineComponent and createLibrary in a Node-compatible file, with renderers set to null. The CLI compiles it into the system prompt.",
      },
      {
        title: "Stream plain text",
        description:
          "Return raw text/plain chunks from the chat route instead of SSE, so the mobile app can read the stream without a browser EventSource.",
      },
      {
        title: "Render native components",
        description:
          "Use Renderer from @openuidev/react-lang in the Expo app with a library that maps the same component names to native views and charts.",
      },
    ],
    links: [
      exampleLink("app-frameworks/react-native"),
      { label: "React Native", href: "https://reactnative.dev", kind: "Website" },
    ],
  },
  {
    slug: "svelte",
    name: "Svelte 5",
    seoTitle: "Generative UI for Svelte",
    logo: "/integration-logos/svelte.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "To build generative UI in Svelte, register Svelte 5 components with Zod schemas and render streamed OpenUI Lang with @openuidev/svelte-lang. Components read parsed values with $props() and render nested output through a renderNode snippet.",
    howItWorks:
      "Each .svelte component receives the parsed values as props and a renderNode snippet that it renders with {@render}. Renderer takes callbacks such as onAction and onStateUpdate as ordinary props, and context helpers like getTriggerAction and getIsStreaming give components access to actions and streaming state. The Svelte runtime covers components, simple actions and form state; unlike the React, Vue and Angular runtimes, it does not yet run Query() calls, Action([...]) step plans or $variable state.",
    install: "npm install @openuidev/svelte-lang zod",
    steps: [
      {
        title: "Write the component with $props()",
        description:
          "Destructure props and renderNode from $props(). renderNode is a Snippet passed as a prop, not through context, so render children with {@render renderNode(...)} and forward it to any child component that renders nested nodes.",
        code: {
          filename: "Card.svelte",
          lang: "svelte",
          code: `<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    props,
    renderNode,
  }: { props: { title?: string; children?: unknown[] }; renderNode: Snippet<[unknown]> } =
    $props();
</script>

<section>
  {#if props.title}<h3>{props.title}</h3>{/if}
  {@render renderNode(props.children)}
</section>`,
        },
      },
      {
        title: "Register components in a library",
        description:
          "Pair each .svelte file with defineComponent and a Zod schema, and list a container's allowed children with their .ref schemas. Build the system prompt with library.prompt(), or in a SvelteKit server route share the schemas and generate it with @openuidev/lang-core ^0.4.",
        code: {
          filename: "src/lib/library.ts",
          lang: "ts",
          code: `import { createLibrary, defineComponent } from "@openuidev/svelte-lang";
import { z } from "zod";
import Card from "./components/Card.svelte";
import TextContent from "./components/TextContent.svelte";
// ...

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description: "Displays a block of text. Supports markdown formatting within the string.",
  component: TextContent,
});
// ...

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    children: z.array(z.union([TextContentDef.ref, ButtonDef.ref, ChartDef.ref])),
  }),
  description: "A card container with a title and child components",
  component: Card,
});
// ...

export const library = createLibrary({
  components: [TextContentDef, ButtonDef, ChartDef, CardDef, StackDef],
  root: "Stack",
});`,
        },
      },
      {
        title: "Render the stream",
        description:
          "Pass the accumulated text, the library and isStreaming to Renderer, with onAction as an ordinary callback prop. The Svelte Renderer has no onError prop, so read parser errors from onParseResult.",
        code: {
          filename: "AssistantMessage.svelte",
          lang: "svelte",
          code: `<script lang="ts">
  import { Renderer, type ActionEvent } from "@openuidev/svelte-lang";
  import { library } from "$lib/library";

  let { response, isStreaming }: { response: string | null; isStreaming: boolean } = $props();

  function handleAction(event: ActionEvent) {
    // Forward continuation actions to your application's normal send-message path.
    console.log(event.humanFriendlyMessage, event.formState);
  }
</script>

<Renderer {response} {library} {isStreaming} onAction={handleAction} />`,
        },
      },
    ],
    links: [
      { label: "Svelte Lang API reference", href: "/docs/api-reference/svelte-lang", kind: "Docs" },
      ...packageLinks("@openuidev/svelte-lang", "svelte-lang"),
      exampleLink("app-frameworks/svelte"),
      { label: "Svelte", href: "https://svelte.dev", kind: "Website" },
    ],
  },
];

export const integrations: Integration[] = integrationCatalog;

const popularityOrder: Record<IntegrationCategoryId, string[]> = {
  "ai-frameworks": [
    "langchain-langgraph",
    "vercel-ai-sdk",
    "pi-coding-agent",
    "mastra",
    "grok-build",
    "ag-ui",
    "vercel-eve",
    "google-adk",
  ],
  "design-systems": ["shadcn-ui", "material-ui", "handsontable", "react-email"],
  "frontend-platforms": [
    "vue",
    "angular",
    "svelte",
    "react-native",
    "lynx",
    "assistant-ui",
    "open-webui",
  ],
};

export const integrationBySlug = new Map(integrations.map((item) => [item.slug, item]));

export function getIntegrationCategory(id: IntegrationCategoryId): IntegrationCategory {
  const category = integrationCategories.find((item) => item.id === id);
  if (!category) throw new Error(`Unknown integration category: ${id}`);
  return category;
}

export function getIntegrationsByCategory(id: IntegrationCategoryId): Integration[] {
  const order = popularityOrder[id];
  return integrations
    .filter((item) => item.category === id)
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

export function getRelatedIntegrations(integration: Integration, limit = 3): Integration[] {
  return getIntegrationsByCategory(integration.category)
    .filter((item) => item.slug !== integration.slug)
    .slice(0, limit);
}

export function getIntegrationPageMetadata(integration: Integration): PageMetadataInput {
  return {
    pathname: `/integrations/${integration.slug}`,
    title: { absolute: `${integration.seoTitle} | OpenUI` },
    description: integration.summary,
    openGraph: { title: `${integration.name} × OpenUI` },
    // Remote logos are skipped so the build never fetches from third-party hosts.
    ogImage: { partnerLogo: integration.logo.startsWith("/") ? integration.logo : undefined },
  };
}
