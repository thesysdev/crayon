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
  /** The complete file the snippet is trimmed from, linked under the block. */
  source?: string;
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
    install:
      "npm install @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod",
    steps: [
      {
        title: "Wrap your shadcn/ui components",
        description:
          "Register each component with defineComponent and a Zod prop schema, then combine them with createLibrary. The example library covers 45+ components, including cards, tables, charts, forms, and dialogs.",
        code: {
          filename: "src/lib/shadcn-genui/index.tsx",
          lang: "tsx",
          code: `import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
// Components the shadcn CLI added to your project.
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Badge = defineComponent({
  name: "Badge",
  props: z.object({
    text: z.string(),
    variant: z.enum(["default", "secondary", "destructive", "outline"]).optional(),
  }),
  description: "Inline label/badge.",
  component: ({ props }) => (
    <ShadcnBadge variant={props.variant ?? "default"}>{props.text}</ShadcnBadge>
  ),
});

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({ children: z.array(Badge.ref) }),
  description: "Vertical container for all content in a chat response.",
  component: ({ props, renderNode }) => (
    <Card>
      <CardContent>{renderNode(props.children)}</CardContent>
    </Card>
  ),
});

export const shadcnChatLibrary = createLibrary({
  root: "Card",
  components: [ChatCard, Badge], // plus every other component you wrap
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/design-systems/shadcn/src/lib/shadcn-genui/index.tsx",
        },
      },
      {
        title: "Generate the library spec",
        description:
          "Run openui generate --spec on the library file. The chat route passes that spec to generateSystemPrompt({ cloud: true }), so the model can only call components the client can render.",
        code: {
          filename: "src/lib/cloud-prompt.ts",
          lang: "ts",
          code: `import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";

// src/library.ts re-exports your library as \`library\`, and this command writes the spec:
//   openui generate src/library.ts --spec --out src/generated/spec.json
export function cloudInstructions(): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec;
  // The chat route sends this as the system message.
  return generateSystemPrompt({ cloud: true, library });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/design-systems/shadcn/src/lib/cloud-prompt.ts",
        },
      },
      {
        title: "Render the responses",
        description:
          "Pass the library to Renderer from @openuidev/react-lang wherever your app shows model output. For a ready-made chat app, the example passes it to AgentInterface as componentLibrary instead.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
} from "@openuidev/react-ui";
// Your wrapped shadcn/ui components from step 1.
import { shadcnChatLibrary } from "@/lib/shadcn-genui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIAdapter(),
  messageFormat: openAIMessageFormat,
});

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={shadcnChatLibrary} />;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/design-systems/shadcn/src/app/page.tsx",
        },
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
    install:
      "npm install @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod",
    steps: [
      {
        title: "Map MUI components to OpenUI",
        description:
          "Wrap Material UI components with defineComponent and Zod schemas, and export them through createLibrary. Charts use @mui/x-charts.",
        code: {
          filename: "src/lib/mui-genui/index.tsx",
          lang: "tsx",
          code: `import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const CardHeader = defineComponent({
  name: "CardHeader",
  props: z.object({ title: z.string(), description: z.string().optional() }),
  description: "Title/description header block for a Card.",
  component: ({ props }) => (
    <>
      <Typography variant="h3">{props.title}</Typography>
      {props.description && <Typography variant="body2">{props.description}</Typography>}
    </>
  ),
});

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({ children: z.array(CardHeader.ref) }),
  description: "Vertical container for all content in a chat response.",
  component: ({ props, renderNode }) => (
    <Card>
      <CardContent>{renderNode(props.children)}</CardContent>
    </Card>
  ),
});

export const muiChatLibrary = createLibrary({
  root: "Card",
  components: [ChatCard, CardHeader], // plus every other component you wrap
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/design-systems/material-ui/src/lib/mui-genui/index.tsx",
        },
      },
      {
        title: "Generate the library spec",
        description:
          "Run openui generate --spec on src/library.ts. The chat route sends that spec to OpenUI Cloud and runs app-owned tools with runChatToolLoop.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `import OpenAI from "openai";
// Wraps src/generated/spec.json in Cloud's prompt block (src/lib/cloud-prompt.ts).
import { cloudInstructions } from "@/lib/cloud-prompt";
// Your tools: OpenAI function declarations plus the functions that run them.
import { appToolDeclarations, appToolExecutors } from "@/lib/app-tools";
// Runs tool calls on the server until the model answers. Copy src/lib/tool-loop.ts.
import { runChatToolLoop } from "@/lib/tool-loop";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});
const encoder = new TextEncoder();

export async function POST(req: Request) {
  const { messages } = await req.json();
  const body = new ReadableStream({
    async start(controller) {
      await runChatToolLoop({
        client,
        model: "google/gemini-3.6-flash-free",
        messages: [{ role: "system", content: cloudInstructions() }, ...messages],
        tools: appToolDeclarations,
        executors: appToolExecutors,
        enqueue: (chunk) =>
          controller.enqueue(encoder.encode(\`data: \${JSON.stringify(chunk)}\\n\\n\`)),
      });
      controller.enqueue(encoder.encode("data: [DONE]\\n\\n"));
      controller.close();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/design-systems/material-ui/src/app/api/chat/route.ts",
        },
      },
      {
        title: "Render inside your MUI theme",
        description:
          "Render responses with Renderer, or with AgentInterface as the example does, inside your MUI ThemeProvider. Generated components then use the app's theme and light or dark mode.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { useMemo } from "react";
// Your wrapped components (step 1) and your MUI createTheme() factory.
import { muiChatLibrary } from "@/lib/mui-genui";
import { createAppTheme } from "@/lib/mui-genui/theme";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIAdapter(),
  messageFormat: openAIMessageFormat,
});

export default function Page() {
  const mode = useSystemThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AgentInterface llm={llm} componentLibrary={muiChatLibrary} theme={{ mode }} />
    </ThemeProvider>
  );
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/design-systems/material-ui/src/app/page.tsx",
        },
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
    install:
      "npm install @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod handsontable @handsontable/react-wrapper hyperformula",
    steps: [
      {
        title: "Share the table state",
        description:
          "Keep the table in a server-side store that both the grid and the chat route use. Edits made in Handsontable sync back to the server through POST /api/table.",
        code: {
          filename: "src/app/api/table/route.ts",
          lang: "ts",
          code: `import { NextResponse } from "next/server";
// In-memory tables keyed by thread id; the chat tools read and write the same store.
import { getTableStore, type TableData } from "../chat/tableStore";

// The grid posts its full contents here after every edit.
export async function POST(req: Request) {
  const { threadId, data, colHeaders } = (await req.json()) as {
    threadId: string;
    data: TableData;
    colHeaders?: string[];
  };

  const store = getTableStore(threadId);
  store.data = data;
  if (colHeaders) store.colHeaders = colHeaders;

  return NextResponse.json({ success: true, message: "Table data synced" });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/miscellaneous/handsontable/src/app/api/table/route.ts",
        },
      },
      {
        title: "Give the model spreadsheet tools",
        description:
          "Expose tools such as get_table_data, update_cells, add_rows, and set_formula. After a write, the model responds with a SpreadsheetTable component.",
        code: {
          filename: "src/app/api/chat/tools.ts",
          lang: "ts",
          code: `// Server-side table store from step 1.
import { setFormula } from "./tableStore";

// The example keeps one shared table, so every tool uses the "default" thread.
const threadId = "default";

// Passed to client.chat.completions.runTools({ tools, ... }) in the chat route.
export const tools = [
  {
    type: "function",
    function: {
      name: "set_formula",
      description: "Set an Excel-like formula in a specific cell.",
      parameters: {
        type: "object",
        properties: {
          row: { type: "number", description: "Zero-based row index" },
          col: { type: "number", description: "Zero-based column index" },
          formula: {
            type: "string",
            description: "Excel-like formula, e.g. =SUM(A1:A5)",
          },
        },
        required: ["row", "col", "formula"],
      },
      parse: JSON.parse,
      function: async (args: { row: number; col: number; formula: string }) =>
        JSON.stringify(setFormula(threadId, args.row, args.col, args.formula)),
    },
  },
  // get_table_data, update_cells, add_rows, delete_rows and others follow this shape.
];`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/miscellaneous/handsontable/src/app/api/chat/tools.ts",
        },
      },
      {
        title: "Sync results into the grid",
        description:
          "The Renderer draws SpreadsheetTable from the custom library, and the useSpreadsheetSync hook pushes the new data into the live Handsontable instance.",
        code: {
          filename: "src/lib/spreadsheet-library.tsx",
          lang: "tsx",
          code: `import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod";

const SpreadsheetTable = defineComponent({
  name: "SpreadsheetTable",
  description:
    "Syncs data to the live spreadsheet panel. ONLY use this AFTER modification tools " +
    "to push updated data to the user's spreadsheet. Always include colHeaders.",
  props: z.object({
    data: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
    colHeaders: z.array(z.string()).optional(),
  }),
  component: ({ props }) => {
    // Sends rows to TableContext, which reloads the Handsontable grid. Copy
    // src/app/useSpreadsheetSync.ts and src/app/TableContext.tsx from the example.
    // Required here, as in the example, so importing this file in Node (the
    // \`openui generate\` script does) doesn't load the client-only hook.
    const { useSpreadsheetSync } = require("@/app/useSpreadsheetSync");
    useSpreadsheetSync(props.data, props.colHeaders);
    return null;
  },
});

// OpenUI's built-in components plus SpreadsheetTable, passed to <Renderer library>.
export const spreadsheetLibrary = createLibrary({
  root: openuiLibrary.root ?? "Stack",
  componentGroups: openuiLibrary.componentGroups,
  components: [...Object.values(openuiLibrary.components), SpreadsheetTable],
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/miscellaneous/handsontable/src/lib/spreadsheet-library.tsx",
        },
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
    install: "npm install @openuidev/react-email @openuidev/react-lang @react-email/render",
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
        code: {
          filename: "system-prompt.ts",
          lang: "ts",
          code: `import { emailLibrary, emailPromptOptions } from "@openuidev/react-email";

// With examples and rules (recommended)
const systemPrompt = emailLibrary.prompt(emailPromptOptions);

// Without — schema only, no examples or rules
const minimalPrompt = emailLibrary.prompt();`,
          source: "https://www.openui.com/docs/api-reference/react-email",
        },
      },
      {
        title: "Preview and export HTML",
        description:
          "Stream the response into Renderer from @openuidev/react-lang for a live preview, then convert the email to client-compatible HTML with @react-email/render.",
        code: {
          filename: "EmailPreview.tsx",
          lang: "tsx",
          code: `"use client";

import { emailLibrary } from "@openuidev/react-email";
import { Renderer } from "@openuidev/react-lang";
import { render } from "@react-email/render";

interface EmailPreviewProps {
  openuiCode: string;
  isStreaming: boolean;
}

// Live preview: re-renders as the OpenUI Lang response streams in.
export function EmailPreview({ openuiCode, isStreaming }: EmailPreviewProps) {
  return (
    <Renderer response={openuiCode} library={emailLibrary} isStreaming={isStreaming} />
  );
}

// After streaming ends, turn the same response into email-client HTML.
export function renderToHtml(openuiCode: string) {
  return render(
    <Renderer response={openuiCode} library={emailLibrary} isStreaming={false} />,
    { pretty: true },
  );
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/miscellaneous/react-email/src/hooks/useEmailRendering.tsx",
        },
      },
    ],
    links: [
      { label: "React Email API reference", href: "/docs/api-reference/react-email", kind: "Docs" },
      ...packageLinks("@openuidev/react-email", "react-email"),
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
          code: `import { ChatOpenAI } from "@langchain/openai";
import { openUIStreamTransformer } from "@openuidev/langchain/transformer";
import { createDeepAgent } from "deepagents";
// Builds the OpenUI system prompt from your component library.
import { cloudInstructions } from "@/lib/cloud-prompt";
// Your LangChain tools.
import { getStockPrice, getWeather, searchWeb } from "./tools";

// OpenUI Gateway is OpenAI-compatible, so ChatOpenAI can call it.
const model = new ChatOpenAI({
  model: "google/gemini-3.6-flash-free",
  apiKey: process.env.THESYS_API_KEY,
  streaming: true,
  configuration: { baseURL: "https://api.thesys.dev/v1/embed" },
});

export const graph = createDeepAgent({
  model,
  tools: [getWeather, getStockPrice, searchWeb],
  systemPrompt: cloudInstructions(),
  // Publishes the run's message and tool events as AG-UI on "custom:openui".
  streamTransformers: [openUIStreamTransformer],
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/langgraph-platform/src/agent/agent.ts",
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
  // Converts the AG-UI request to LangChain messages, runs the graph on your
  // LangGraph server, and streams the result back as AG-UI events.
  return createLangChainStreamResponse(request, {
    apiUrl: process.env.LANGGRAPH_API_URL ?? "http://localhost:2024",
    assistantId: process.env.LANGGRAPH_ASSISTANT_ID ?? "agent",
    apiKey: process.env.LANGSMITH_API_KEY,
  });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/langgraph-platform/src/app/api/chat/route.ts",
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

const llm = fetchLLM({ url: "/api/chat", streamAdapter: agUIAdapter() });

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={openuiLibrary} />;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/langgraph-platform/src/app/page.tsx",
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
          code: `import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
// Builds the OpenUI system prompt from your component library.
import { cloudInstructions } from "@/lib/cloud-prompt";
// Your AI SDK tools, defined with tool() from "ai".
import { tools } from "@/lib/tools";

// OpenUI Gateway is OpenAI-compatible, so the AI SDK's OpenAI provider can call it.
const gateway = createOpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json(); // UIMessage[] from vercelAIMessageFormat
  const result = streamText({
    model: gateway.chat("google/gemini-3.6-flash-free"),
    system: cloudInstructions(),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5), // Run tools and continue, up to 5 steps.
  });
  return result.toUIMessageStreamResponse();
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/vercel-ai-sdk/src/app/api/chat/route.ts",
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
  // Parses the UIMessage stream that toUIMessageStreamResponse() returns.
  streamAdapter: vercelAIAdapter(),
  // Sends UIMessage[], which the route passes to convertToModelMessages().
  messageFormat: vercelAIMessageFormat,
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/vercel-ai-sdk/src/app/page.tsx",
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

// \`llm\` is the fetchLLM() connection from the previous step, in this same file.

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={openuiLibrary} />;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/vercel-ai-sdk/src/app/page.tsx",
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
          code: `import { Agent, FunctionTool } from "@google/adk";
import { Custom } from "adk-llm-bridge";
import { z } from "zod";
// Builds the OpenUI system prompt from your component library.
import { cloudInstructions } from "@/lib/cloud-prompt";

const getWeather = new FunctionTool({
  name: "get_weather",
  description: "Get the current weather for a given city.",
  parameters: z.object({ city: z.string() }),
  execute: ({ city }) => {
    // Call your weather API here.
  },
});

export function createAgent() {
  return new Agent({
    name: "openui-adk-agent",
    model: Custom("google/gemini-3.6-flash-free", {
      name: "openui-adk-agent",
      baseURL: "https://api.thesys.dev/v1/embed",
      apiKey: process.env.THESYS_API_KEY,
    }),
    instruction: cloudInstructions(),
    tools: [getWeather],
  });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/google-adk/src/agent.ts",
        },
      },
      {
        title: "Bridge events to AG-UI",
        description:
          "Run the agent with a Runner and pass its events through the example's adkToAguiEvents() helper, which turns ADK text, functionCall and functionResponse parts into AG-UI events. Stream them to the browser as server-sent events.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `import { InMemorySessionService, Runner, StreamingMode } from "@google/adk";
import { createAgent } from "@/agent";
// Maps ADK events to AG-UI events. Copy src/lib/adk-to-agui.ts from the example.
import { adkToAguiEvents } from "@/lib/adk-to-agui";

const runner = new Runner({
  appName: "openui-adk-chat",
  agent: createAgent(),
  sessionService: new InMemorySessionService(),
});

export async function POST(req: Request) {
  // Read the last user message into \`prompt\`, and find or create the ADK
  // session (\`sessionId\`) for this chat's \`threadId\`.

  const events = runner.runAsync({
    userId: "demo-user",
    sessionId,
    newMessage: { parts: [{ text: prompt }] },
    runConfig: { streamingMode: StreamingMode.SSE },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const runId = crypto.randomUUID();
      for await (const event of adkToAguiEvents(events, { threadId, runId })) {
        controller.enqueue(encoder.encode(\`data: \${JSON.stringify(event)}\\n\\n\`));
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/google-adk/src/app/api/chat/route.ts",
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

const llm = fetchLLM({ url: "/api/chat", streamAdapter: agUIAdapter() });

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={openuiLibrary} />;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/google-adk/src/app/page.tsx",
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
          code: `import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
// Builds the OpenUI system prompt from your component library.
import { cloudInstructions } from "@/lib/cloud-prompt";
// Routes model calls to OpenUI Cloud. Copy src/openui-cloud-gateway.ts from the example.
import { OpenUICloudGateway, openuiCloudModelId } from "@/openui-cloud-gateway";

const getWeather = createTool({
  id: "get_weather",
  description: "Get current weather for a city.",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    // Call your weather API here.
  },
});

export const openuiAgent = new Agent({
  id: "openui-mastra-agent",
  name: "OpenUI x Mastra Agent",
  instructions: cloudInstructions(),
  model: { id: openuiCloudModelId },
  tools: { getWeather },
});

export const mastra = new Mastra({
  gateways: { openuiCloud: new OpenUICloudGateway() },
  agents: { openui: openuiAgent },
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/mastra/src/mastra.ts",
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
import { openuiAgent } from "@/mastra";

const agent = new MastraAgent({ agent: openuiAgent, resourceId: "chat-user" });

export async function POST(req: Request) {
  const { messages, threadId }: { messages: Message[]; threadId: string } =
    await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      agent
        .run({ messages, threadId, runId: crypto.randomUUID(), tools: [], context: [] })
        .subscribe({
          next: (event) => {
            controller.enqueue(encoder.encode(\`data: \${JSON.stringify(event)}\\n\\n\`));
          },
          complete: () => controller.close(),
        });
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/mastra/src/app/api/chat/route.ts",
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

// POSTs { messages, threadId, ... } to the route above and parses its AG-UI stream.
const llm = fetchLLM({ url: "/api/chat", streamAdapter: agUIAdapter() });

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={openuiLibrary} />;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/mastra/src/app/page.tsx",
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
          filename: "src/components/openui-config-provider.tsx",
          lang: "tsx",
          code: `"use client";

import type { ReactNode } from "react";
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

// Render this inside AssistantRuntimeProvider (next step).
export function OpenUIConfigProvider({ children }: { children: ReactNode }) {
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
          source: "https://www.openui.com/docs/api-reference/assistant-ui",
        },
      },
      {
        title: "Let the model call the OpenUI tools",
        description:
          "present_openui renders complete cards, tables, and charts. prompt_openui renders forms and choices, and completes only when the user submits a result. With an AI SDK runtime, shouldContinueAfterOpenUIPrompt starts the next model step only after a prompt_openui result.",
        code: {
          filename: "src/components/openui-runtime-provider.tsx",
          lang: "tsx",
          code: `"use client";

import type { ReactNode } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { shouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";
// The provider from step 1.
import { OpenUIConfigProvider } from "./openui-config-provider";

export function OpenUIRuntimeProvider({ children }: { children: ReactNode }) {
  // The runtime's chat transport forwards both OpenUI tools to your backend.
  // Continue once prompt_openui has the user's answer; a finished
  // present_openui call is the final response and starts no new step.
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: shouldContinueAfterOpenUIPrompt,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <OpenUIConfigProvider>{children}</OpenUIConfigProvider>
    </AssistantRuntimeProvider>
  );
}`,
          source: "https://www.openui.com/docs/api-reference/assistant-ui",
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
// Your component library, made with createLibrary from @openuidev/react-lang.
import { library } from "@/lib/openui";

// Use openui.toolkit and openui.instructions in place of openuiIntegration.
// The tool names are optional; these replace present_openui and prompt_openui.
export const openui = createOpenUIIntegration({
  library,
  presentToolName: "show_panel",
  promptToolName: "ask_panel",
});

// Pass this to useChatRuntime as sendAutomaticallyWhen when you rename the tools.
export const shouldContinue = createShouldContinueAfterOpenUIPrompt({
  promptToolName: openui.toolNames.prompt,
});`,
          source: "https://www.openui.com/docs/api-reference/assistant-ui",
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
// Your component library's spec, written by \`openui generate --spec\`.
import library from "./lib/openui.spec.json";

// The complete prompt, ready to send to any model.
const openuiInstructions = generateSystemPrompt({
  library: library as LibrarySpec,
});`,
          source: "https://www.openui.com/docs/build-agents/ui-generation",
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

const anthropic = new Anthropic(); // Reads ANTHROPIC_API_KEY from the environment.
const encoder = new TextEncoder();

export async function POST(req: Request) {
  const { messages } = await req.json(); // { role, content } turns (openAIMessageFormat)
  const stream = new ReadableStream({
    async start(controller) {
      // Each AG-UI event goes out as one SSE "data:" line.
      const send = (event: object) =>
        controller.enqueue(encoder.encode(\`data: \${JSON.stringify(event)}\\n\\n\`));
      const messageId = crypto.randomUUID();
      try {
        const reply = anthropic.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 64000,
          // If the model declines, Anthropic re-runs the request on a fallback model.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: openuiInstructions, // The OpenUI Lang prompt from step 1.
          messages: messages.filter((m: { role: string }) => m.role !== "system"),
        });
        send({ type: "TEXT_MESSAGE_START", messageId });
        for await (const chunk of reply) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            send({ type: "TEXT_MESSAGE_CONTENT", messageId, delta: chunk.delta.text });
          }
        }
        send({ type: "TEXT_MESSAGE_END", messageId });
      } catch (err) {
        send({ type: "RUN_ERROR", message: (err as Error).message });
      }
      controller.close(); // Closing the stream ends the run in the UI.
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}`,
          source: "https://www.openui.com/docs/agent/reference/self-hosting",
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

import {
  AgentInterface,
  agUIAdapter,
  fetchLLM,
  openAIMessageFormat,
} from "@openuidev/react-ui";
// Your component library: the one step 1's spec was generated from.
import { library } from "@/lib/openui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
  // Sends OpenAI-style { role, content } turns, which the route forwards to Anthropic.
  messageFormat: openAIMessageFormat,
});

export default function Page() {
  return <AgentInterface llm={llm} componentLibrary={library} />;
}`,
          source: "https://www.openui.com/docs/agent/reference/self-hosting",
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
      "The maintained local harness talks to Grok Build through its official Agent Client Protocol stdio mode, injects the generated OpenUI rules, and maps reasoning, text, and tools into AG-UI events for AgentInterface. Grok's questions and plan approvals reach the browser over a separate interactions route and open as dialogs. As shipped, it is an unauthenticated single-user harness and needs authentication, sandboxing, and a stricter permission policy before networked deployment.",
    steps: [
      {
        title: "Install and sign in to Grok Build",
        description:
          "Put the grok CLI on your PATH and run grok login. In non-interactive environments, set XAI_API_KEY instead.",
        code: {
          filename: "Terminal",
          lang: "bash",
          code: `grok login
grok --version
# For a non-interactive environment, set XAI_API_KEY instead.

cd examples/harnesses/grok-build
pnpm install --ignore-workspace
cp .env.example .env.local
pnpm dev -- /absolute/path/to/your/project`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/harnesses/grok-build/README.md",
        },
      },
      {
        title: "Start the harness on a workspace",
        description:
          "Launch the example with the project directory Grok Build should work in. It runs one grok agent stdio process and opens a separate ACP session for each OpenUI thread, with the OpenUI prompt added as session rules.",
        code: {
          filename: "src/lib/grok-build-acp.ts",
          lang: "ts",
          code: `import { ClientSideConnection, ndJsonStream } from "@agentclientprotocol/sdk";
import { spawn } from "node:child_process";
import { Readable, Writable } from "node:stream";
// Builds the OpenUI Lang prompt; copy src/lib/openui-prompt.ts from the example.
import { localSystemPrompt } from "./openui-prompt";

// One long-lived Grok process for the workspace chosen at launch. --always-approve
// lets tools run unattended, so keep this harness local and single-user.
const cwd = process.env.GROK_BUILD_CWD ?? process.cwd();
const args = ["agent", "--always-approve", "--no-leader", "stdio"];
const child = spawn("grok", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
const stream = ndJsonStream(
  Writable.toWeb(child.stdin) as WritableStream<Uint8Array>,
  Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
);
// \`client\` answers Grok's callbacks (next step). Initialize and authenticate the
// connection once; see GrokBuildACPClient.create() in the example.
const connection = new ClientSideConnection(() => client, stream);

// Each OpenUI thread gets a Grok session with the same UUID, and the OpenUI prompt
// rides along as the session's rules.
async function createSession(sessionId: string) {
  await connection.newSession({
    cwd,
    mcpServers: [],
    _meta: {
      clientIdentifier: "openui-grok-build-harness",
      rules: localSystemPrompt(),
      sessionId,
      yoloMode: true,
    },
  });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/harnesses/grok-build/src/lib/grok-build-acp.ts",
        },
      },
      {
        title: "Answer questions and approve plans in the browser",
        description:
          "Grok's clarifying questions and plan approvals appear as browser dialogs, and your answers go back over ACP so the same turn can continue.",
        code: {
          filename: "src/lib/grok-build-acp.ts",
          lang: "ts",
          code: `import { RequestError, type Client } from "@agentclientprotocol/sdk";
// Holds each question or plan approval until the browser answers it.
// Copy src/lib/grok-build-interactions.ts from the example.
import { requestGrokBuildInteraction } from "./grok-build-interactions";

const client: Client = {
  // Grok sends x.ai/ask_user_question and x.ai/exit_plan_mode as blocking requests.
  // The browser long-polls GET /api/interactions?threadId=… and shows a dialog; its
  // POST /api/interactions answer resolves this promise, which ACP returns to Grok
  // so the same turn continues.
  extMethod: async (method, params) => {
    const interaction = requestGrokBuildInteraction(method, params);
    if (interaction) return interaction;
    throw RequestError.methodNotFound(method);
  },
  // Also implement requestPermission and sessionUpdate, which forwards reasoning,
  // text, and tool updates to the chat route; see the example.
};`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/harnesses/grok-build/src/lib/grok-build-acp.ts",
        },
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
        code: {
          filename: "agent/instructions/openui.ts",
          lang: "ts",
          code: `import { defineDynamic, defineInstructions } from "eve/instructions";
// Builds the OpenUI prompt; copy src/lib/cloud-prompt.ts from the example.
import { cloudInstructions } from "../../src/lib/cloud-prompt";

// Eve loads every file in agent/instructions. This one adds the OpenUI Lang
// prompt once, when a session starts.
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: cloudInstructions(),
      }),
  },
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/vercel-eve/agent/instructions/openui.ts",
        },
      },
      {
        title: "Deliver turns over Eve's session protocol",
        description:
          "Send each turn through Eve's HTTP channel and store the session cursor per OpenUI thread, so the NDJSON event stream can resume where it stopped.",
        code: {
          filename: "src/eve-chat.ts",
          lang: "ts",
          code: `import type { SessionState } from "eve/client";

// Eve's HTTP channel is served same-origin by withEve() in next.config.ts.
// \`state\` is this thread's saved cursor: { sessionId?, continuationToken?, streamIndex }.
async function openEveStream(state: SessionState, message: string, signal: AbortSignal) {
  // The first turn creates a session; later turns reuse it with the continuation token.
  const deliverPath = state.sessionId
    ? \`/eve/v1/session/\${encodeURIComponent(state.sessionId)}\`
    : "/eve/v1/session";
  const delivered = await fetch(deliverPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, continuationToken: state.continuationToken }),
    signal,
  });
  const meta: { sessionId?: string; continuationToken?: string } = await delivered.json();
  const sessionId = meta.sessionId ?? state.sessionId;
  if (!sessionId) throw new Error("Eve did not return a session id.");

  // Read Eve's NDJSON event stream, resuming from the saved index.
  const startIndex = state.sessionId === sessionId ? state.streamIndex : 0;
  const response = await fetch(
    \`/eve/v1/session/\${encodeURIComponent(sessionId)}/stream?startIndex=\${startIndex}\`,
    { signal },
  );
  const continuationToken = meta.continuationToken ?? state.continuationToken;
  return { response, sessionId, continuationToken, startIndex };
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/vercel-eve/src/eve-chat.ts",
        },
      },
      {
        title: "Map events with eveAdapter()",
        description:
          "Use eveAdapter() from @openuidev/react-headless as the llm's stream protocol. It converts Eve text, tool call, and failure events into AG-UI for AgentInterface or your own UI built on ChatProvider.",
        code: {
          filename: "src/eve-chat.ts",
          lang: "ts",
          code: `import { eveAdapter, type ChatLLM } from "@openuidev/react-headless";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";

// openEveStream() is the previous step. The example's src/eve-chat.ts also has
// loadSession/saveSession (one cursor per thread) and latestUserText().
let active: { threadId: string; cursor: SessionState };

export const llm: ChatLLM = {
  send: async ({ messages, threadId, signal }) => {
    const state = loadSession(localStorage, threadId);
    const opened = await openEveStream(state, latestUserText(messages), signal);
    const { sessionId, continuationToken, startIndex: streamIndex } = opened;
    active = { threadId, cursor: { sessionId, continuationToken, streamIndex } };
    return opened.response;
  },
  streamProtocol: eveAdapter({
    // eveAdapter() maps Eve events to AG-UI. onEvent also sees every raw event,
    // so count them to keep this thread's cursor current.
    onEvent: (event: HandleMessageStreamEvent) => {
      active.cursor.streamIndex += 1;
      // Completed sessions start fresh next turn; waiting or failed ones resume.
      if (event.type === "session.completed") {
        saveSession(localStorage, active.threadId, { streamIndex: 0 });
      } else if (event.type === "session.waiting" || event.type === "session.failed") {
        saveSession(localStorage, active.threadId, active.cursor);
      }
    },
  }),
};`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/agent-frameworks/vercel-eve/src/eve-chat.ts",
        },
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
        code: {
          filename: "src/lib/pi-session.ts",
          lang: "ts",
          code: `import { join } from "node:path";
// Builds the OpenUI prompt; copy src/lib/cloud-prompt.ts from the example.
import { cloudInstructions } from "./cloud-prompt";

// Call once per chat thread and reuse the session: Pi keeps its own transcript.
export async function createSession(cwd: string) {
  // The Pi SDK is ESM-only, so load it with a native dynamic import().
  const pi = await import("@earendil-works/pi-coding-agent");
  const agentDir = pi.getAgentDir();
  const settingsManager = pi.SettingsManager.create(cwd, agentDir);
  const shared = { cwd, agentDir, settingsManager };

  // OpenUI Cloud is the model; copy src/lib/openui-cloud-models.json from the example.
  const authStorage = pi.AuthStorage.inMemory();
  authStorage.setRuntimeApiKey("openui-cloud", process.env.THESYS_API_KEY!);
  const modelsPath = join(process.cwd(), "src/lib/openui-cloud-models.json");
  const modelRegistry = pi.ModelRegistry.create(authStorage, modelsPath);
  const model = modelRegistry.find("openui-cloud", "google/gemini-3.6-flash-free");

  // Append the OpenUI Lang prompt (the example also passes coding-agent rules to it).
  const resourceLoader = new pi.DefaultResourceLoader({
    ...shared,
    appendSystemPrompt: [cloudInstructions()],
  });
  await resourceLoader.reload();
  const { session } = await pi.createAgentSession({
    ...shared,
    resourceLoader,
    authStorage,
    modelRegistry,
    model,
  });
  return session;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/harnesses/pi/src/lib/pi-session.ts",
        },
      },
      {
        title: "Translate Pi events",
        description:
          "Write Pi text deltas to delta.content and its reasoning and tool executions to delta.tool_calls, one OpenAI chat.completion.chunk per NDJSON line.",
        code: {
          filename: "src/app/api/chat/route.ts",
          lang: "ts",
          code: `// One OpenAI chat.completion.chunk per NDJSON line.
function ndjsonChunk(delta: Record<string, unknown>, finishReason: string | null = null) {
  return \`\${JSON.stringify({
    id: "pi-chat",
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\\n\`;
}

// Inside the POST handler's ReadableStream: \`session\` is this thread's Pi session,
// \`enqueue(line)\` writes to the response, and \`userText\` is the newest user message.
let toolIndex = 0;
const unsubscribe = session.subscribe((event) => {
  if (event.type === "message_update") {
    const ame = event.assistantMessageEvent;
    if (ame.type === "text_delta" && ame.delta) {
      enqueue(ndjsonChunk({ content: ame.delta }));
    }
    // thinking_delta streams into a single "Thinking" tool call the same way.
  } else if (event.type === "tool_execution_start") {
    // Each tool run (read, bash, edit, write) becomes an OpenAI tool call card.
    const call = {
      index: toolIndex++,
      id: event.toolCallId,
      type: "function",
      function: { name: event.toolName, arguments: JSON.stringify(event.args) },
    };
    enqueue(ndjsonChunk({ tool_calls: [call] }));
  }
});
await session.prompt(userText);
unsubscribe();
enqueue(ndjsonChunk({}, "stop"));`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/harnesses/pi/src/app/api/chat/route.ts",
        },
      },
      {
        title: "Render with the NDJSON adapter",
        description:
          "Parse the stream with openAIReadableStreamAdapter(), then render the answers, reasoning, and tool activity with AgentInterface or your own UI built on ChatProvider.",
        code: {
          filename: "src/app/page.tsx",
          lang: "tsx",
          code: `"use client";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

// fetchLLM POSTs { threadId, messages }; the route reuses one Pi session per threadId.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIReadableStreamAdapter(),
  messageFormat: openAIMessageFormat,
});

export default function Home() {
  return <AgentInterface llm={llm} componentLibrary={openuiLibrary} />;
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/harnesses/pi/src/app/page.tsx",
        },
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
"""
# The rest of tool.py: the Tools class with the cdn_base_url valve and render_openui.`,
          source: "https://github.com/thesysdev/openwebui-plugin/blob/main/tool.py",
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


class Tools:
    async def render_openui(
        self,
        openui_lang_code: str,
        title: str = "Response",
        __event_emitter__=None,
        __event_call__=None,
    ) -> tuple:
        # Omitted: the docstring, which tells the model when to call the tool and
        # teaches OpenUI Lang syntax, and the status updates sent to __event_emitter__.

        # Helpers in tool.py: read Open WebUI's light/dark theme, then build an HTML
        # page that loads the OpenUI browser bundle and renders openui_lang_code.
        theme = await _get_openwebui_theme(__event_call__)
        html = _build_openui_html(
            openui_lang_code, title, self.valves.cdn_base_url, theme
        )
        response = HTMLResponse(content=html, headers={"Content-Disposition": "inline"})

        # result_context tells the model the UI is already on screen, so it describes
        # it instead of echoing the OpenUI Lang code.
        return response, result_context`,
          source: "https://github.com/thesysdev/openwebui-plugin/blob/main/tool.py",
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

_CDN_BASE = "https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@latest"


class Tools:
    class Valves(BaseModel):
        # Edit in Admin > Tools. The page loads <cdn_base_url>/dist/openui-bundle.min.js
        # and /dist/openui-styles.css. A URL that isn't https (or http on localhost)
        # falls back to _CDN_BASE.
        cdn_base_url: str = Field(
            default=_CDN_BASE,
            description=(
                "Base CDN URL for the OpenUI bundle. "
                "Change if self-hosting or using a different version."
            ),
        )

    def __init__(self):
        self.valves = self.Valves()`,
          source: "https://github.com/thesysdev/openwebui-plugin/blob/main/tool.py",
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
          "Build a component library with createOpenUiLibrary() from @lynx-js/genui/openui, and import the theme stylesheet from @lynx-js/genui/openui/styles/theme.css. The renderer's own CSS ships with the renderer module.",
        code: {
          filename: "src/library.ts",
          lang: "ts",
          code: `import { createOpenUiLibrary } from '@lynx-js/genui/openui';

// Theme tokens for the built-in components.
import '@lynx-js/genui/openui/styles/theme.css';

// The built-in components; pass { components: [...] } to add your own ReactLynx ones.
// Create it once: the renderer keeps its streaming parser while the library is unchanged.
export const library = createOpenUiLibrary();`,
          source:
            "https://github.com/lynx-family/lynx-stack/blob/main/packages/genui/openui/README.md",
        },
      },
      {
        title: "Generate the agent instructions",
        description:
          "On the server, build the system prompt with buildOpenUiSystemPrompt() from @lynx-js/genui/openui/prompt.",
        code: {
          filename: "server/openuiPrompt.ts",
          lang: "ts",
          code: `import { buildOpenUiSystemPrompt } from '@lynx-js/genui/openui/prompt';

// Teaches the model OpenUI Lang and the built-in components. Send it as the system
// instruction, then return the model's raw text to the app.
export const systemPrompt = buildOpenUiSystemPrompt({
  appendix: 'Use only the tools explicitly provided by this application.',
  // Custom client components go here too, as headless definitions in \`components\`.
});`,
          source:
            "https://github.com/lynx-family/lynx-stack/blob/main/packages/genui/openui/docs/system-prompts.md",
        },
      },
      {
        title: "Render with OpenUiRenderer",
        description:
          "Pass the full text received so far, not just the latest delta, to OpenUiRenderer with the library. Handle host-side effects such as navigation in onAction.",
        code: {
          filename: "src/StreamingSurface.tsx",
          lang: "tsx",
          code: `import { BuiltinActionType, OpenUiRenderer } from '@lynx-js/genui/openui';
import { useEffect, useState } from '@lynx-js/react';
import { library } from './library'; // The library from step 1.

// \`source\` yields the model's text deltas from your Agent transport.
export function StreamingSurface({ source }: { source: AsyncIterable<string> }) {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  useEffect(() => {
    async function consume() {
      setResponse('');
      setIsStreaming(true);
      try {
        // Append each delta: the renderer needs the full text received so far.
        for await (const delta of source) setResponse((current) => current + delta);
      } finally {
        setIsStreaming(false);
      }
    }
    consume();
  }, [source]);

  return (
    <OpenUiRenderer
      response={response}
      library={library}
      isStreaming={isStreaming}
      onAction={(event) => {
        if (event.type === BuiltinActionType.OpenUrl) {
          // Validate event.params.url, then open it with the host navigation API.
        }
      }}
    />
  );
}`,
          source: "https://lynxjs.org/next/react/genui/openui.html#stream-model-output",
        },
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
          source: "https://www.openui.com/docs/api-reference/vue-lang",
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
// The SFC from the previous step.
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

// The system prompt to send with each model request.
export const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant.",
  examples: ['root = Greeting("Alice")'],
});`,
          source: "https://www.openui.com/docs/api-reference/vue-lang",
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
import { BuiltinActionType, Renderer, type ActionEvent } from "@openuidev/vue-lang";
// The library from library.ts.
import { library } from "./library";

// The model's OpenUI Lang output so far, and whether it is still streaming.
defineProps<{ response: string | null; isStreaming: boolean }>();

function handleAction(event: ActionEvent) {
  if (
    event.type === BuiltinActionType.ContinueConversation &&
    event.humanFriendlyMessage
  ) {
    // Send event.humanFriendlyMessage to your chat as the next user message.
  }
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
          source: "https://www.openui.com/docs/api-reference/vue-lang",
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
  // The renderer sets these three inputs on every instance.
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
          source: "https://www.openui.com/docs/api-reference/angular-lang",
        },
      },
      {
        title: "Generate the prompt on a Node server",
        description:
          "Keep the Zod schemas in a file both sides import, and rebuild the library on the server with @openuidev/lang-core ^0.4 and component: null so it never loads Angular classes. The example's build script passes library.toSpec() to generateSystemPrompt and writes the prompt to a file the server reads.",
        code: {
          filename: "server/library.mjs",
          lang: "js",
          code: `import {
  createLibrary,
  defineComponent,
  generateSystemPrompt,
} from "@openuidev/lang-core";
import { z } from "zod/v4";
// { Name: { description, props } } for each component, plus prompt rules and examples.
// The Angular app's library imports the same file and adds the component classes.
import { definitions, promptOptions } from "../src/app/openui/schema.ts";

// component: null keeps Angular classes out of the Node process.
const blocks = Object.entries(definitions).map(([name, definition]) =>
  defineComponent({ name, ...definition, component: null }),
);
const root = defineComponent({
  name: "Response",
  description: "Root container for every assistant message.",
  props: z.object({ children: z.array(z.union(blocks.map((block) => block.ref))) }),
  component: null,
});

export const library = createLibrary({ root: "Response", components: [root, ...blocks] });

// The example runs this in scripts/generate.mjs and saves the result to a file.
export const systemPrompt = generateSystemPrompt({
  library: library.toSpec(),
  promptOptions,
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/app-frameworks/angular/server/library.mjs",
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
import { BuiltinActionType, Renderer, type ActionEvent } from "@openuidev/angular-lang";
// The library from library.ts.
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
    if (
      event.type === BuiltinActionType.ContinueConversation &&
      event.humanFriendlyMessage
    ) {
      // Send event.humanFriendlyMessage to your chat as the next user message.
    }
  }
}`,
          source: "https://www.openui.com/docs/api-reference/angular-lang",
        },
      },
    ],
    links: [
      {
        label: "Angular Lang API reference",
        href: "/docs/api-reference/angular-lang",
        kind: "Docs",
      },
      ...packageLinks("@openuidev/angular-lang", "angular-lang"),
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
      "The reference project pairs a React Native chat app with a backend that prompts for OpenUI Lang. Native component definitions map the same component names to mobile views and charts, and the app renders the streamed text as it arrives.",
    install: "npm install @openuidev/react-lang zod",
    steps: [
      {
        title: "Describe the components on the backend",
        description:
          "Define the component vocabulary (Card, Text, and chart components) with defineComponent and createLibrary in a Node-compatible file, with renderers set to null. The chat route turns it into the system prompt with generateSystemPrompt from @openuidev/lang-core.",
        code: {
          filename: "backend/src/library.ts",
          lang: "ts",
          code: `import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod";

// Same names and schemas as the app's library, with null renderers so it runs in Node.
const TextComponent = defineComponent({
  name: "Text",
  description: "Renders a line of text. Use variant to control emphasis.",
  props: z.object({
    content: z.string().describe("The text to display"),
    variant: z.enum(["body", "heading", "caption"]).optional(),
  }),
  component: () => null,
});

// BarChart, LineChart and PieChart follow the same pattern and go in Card's children.

const CardComponent = defineComponent({
  name: "Card",
  description: "A container card that holds a list of child components.",
  props: z.object({
    children: z.array(TextComponent.ref).optional(),
  }),
  component: () => null,
});

export const library = createLibrary({
  components: [TextComponent, CardComponent],
  root: "Card",
});`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/app-frameworks/react-native/backend/src/library.ts",
        },
      },
      {
        title: "Stream plain text",
        description:
          "Return raw text/plain chunks from the chat route instead of SSE, so the mobile app can read the stream without a browser EventSource.",
        code: {
          filename: "backend/src/app/api/chat/route.ts",
          lang: "ts",
          code: `import { generateSystemPrompt } from "@openuidev/lang-core";
import OpenAI from "openai";
import { library } from "@/library"; // The Node-compatible library from step 1.

// cloud: true matches the OpenUI Cloud client below; omit it for other providers.
const SYSTEM_PROMPT = generateSystemPrompt({ cloud: true, library: library.toSpec() });
const openai = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const completion = await openai.chat.completions.create({
    model: "google/gemini-3.6-flash-free",
    stream: true,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  // Write each text delta as a raw chunk, not an SSE event.
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/app-frameworks/react-native/backend/src/app/api/chat/route.ts",
        },
      },
      {
        title: "Render native components",
        description:
          "Use Renderer from @openuidev/react-lang in the Expo app with a library that maps the same component names to native views and charts.",
        code: {
          filename: "chat-app/screens/ChatScreen.tsx",
          lang: "tsx",
          code: `import { Renderer } from "@openuidev/react-lang";
import React, { useState } from "react";
// Step 1's components with React Native renderers. See library.tsx in the example.
import { library } from "../library";
// Streams the reply with XMLHttpRequest (React Native's fetch has no readable body).
// Copy hooks/useStreamingChat.ts from the example.
import { useStreamingChat } from "../hooks/useStreamingChat";
// Text box and send button. Copy components/ChatInput.tsx from the example.
import { ChatInput } from "../components/ChatInput";

export default function ChatScreen({ backendUrl }: { backendUrl: string }) {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const { sendMessage } = useStreamingChat(backendUrl);

  async function handleSend(text: string) {
    setIsStreaming(true);
    // The example also keeps the conversation history for follow-up turns.
    await sendMessage([{ role: "user", content: text }], (accumulated, isDone) => {
      // \`accumulated\` is the full reply so far, which is what Renderer expects.
      setResponse(accumulated);
      setIsStreaming(!isDone);
    });
  }

  return (
    <>
      <Renderer response={response} library={library} isStreaming={isStreaming} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </>
  );
}`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/app-frameworks/react-native/chat-app/screens/ChatScreen.tsx",
        },
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
          filename: "src/lib/components/Card.svelte",
          lang: "svelte",
          code: `<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    props,
    renderNode,
  }: {
    props: { title?: string; children?: unknown };
    renderNode: Snippet<[unknown]>;
  } = $props();
</script>

<div>
  {#if props.title}
    <h3>{props.title}</h3>
  {/if}
  {#if props.children}
    {@render renderNode(props.children)}
  {/if}
</div>`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/app-frameworks/svelte/src/lib/components/Card.svelte",
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
// Card is the component above; TextContent renders props.text in a <p>.
import Card from "./components/Card.svelte";
import TextContent from "./components/TextContent.svelte";

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description:
    "Displays a block of text. Supports markdown formatting within the string.",
  component: TextContent,
});

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    // The components Card accepts as children, by their .ref schemas.
    children: z.array(TextContentDef.ref),
  }),
  description: "A card container with a title and child components",
  component: Card,
});

export const library = createLibrary({
  components: [TextContentDef, CardDef],
  root: "Card",
});

// The system prompt to send with each model request.
export const systemPrompt = library.prompt();`,
          source:
            "https://github.com/thesysdev/openui/blob/main/examples/app-frameworks/svelte/src/lib/library.ts",
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
  import { BuiltinActionType, Renderer, type ActionEvent } from "@openuidev/svelte-lang";
  // The library from src/lib/library.ts.
  import { library } from "$lib/library";

  // The model's OpenUI Lang output so far, and whether it is still streaming.
  let {
    response,
    isStreaming,
  }: { response: string | null; isStreaming: boolean } = $props();

  function handleAction(event: ActionEvent) {
    if (
      event.type === BuiltinActionType.ContinueConversation &&
      event.humanFriendlyMessage
    ) {
      // Send event.humanFriendlyMessage to your chat as the next user message.
    }
  }
</script>

<Renderer {response} {library} {isStreaming} onAction={handleAction} />`,
          source: "https://www.openui.com/docs/api-reference/svelte-lang",
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
