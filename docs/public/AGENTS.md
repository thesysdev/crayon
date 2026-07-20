# OpenUI Agent Interface: guide for coding agents

OpenUI Agent Interface (`@openuidev/react-ui`) builds a complete streaming chat in
React: generative-UI components rendered inline, durable artifacts (reports,
slides, dashboards) in side panels, conversation history, and a mobile layout. It runs on **OpenUI Cloud** (a managed backend) or your **own backend**.

This file is self-contained: everything needed to build an agent app is here.
Everything imports from `@openuidev/react-ui`. Read the Rules first.

## Rules

- **Import everything from `@openuidev/react-ui`.** It re-exports the headless
  package. Never import from `@openuidev/react-headless`.
- **`<AgentInterface>` requires `llm`.** `storage` is optional (in-memory default,
  wiped on reload). `componentLibrary` turns on generative UI.
- **Stream adapters and message formats are factories. Call them.**
  `openAIResponsesAdapter()`, never bare `openAIResponsesAdapter`.
- **Pair the adapter with its message format.** `openAIResponsesAdapter()` with
  `openAIConversationMessageFormat`; `openAIAdapter()` or
  `openAIReadableStreamAdapter()` with `openAIMessageFormat`; `agUIAdapter()` with
  `identityMessageFormat` (the default); `langGraphAdapter()` with
  `langGraphMessageFormat`.
- **OpenUI Cloud is two planes.** `llm` is a `ChatLLM` whose `send` posts to your
  own `/api/chat` route, which proxies to Cloud with `THESYS_API_KEY`. `storage`
  is `useOpenuiCloudStorage({ token: "/api/frontend-token" })`. `THESYS_API_KEY`
  is server-side only, never in the browser.
- **On Cloud, send only the latest message.** The Responses API replays history
  from the conversation: `input: openAIConversationMessageFormat.toApi(messages.slice(-1))`.
- **For Cloud, the component set, storage hook, and artifacts come from
  `@openuidev/thesys`** (`chatLibrary`, `useOpenuiCloudStorage`,
  `artifactRenderers`, `artifactCategories`); the server route uses
  `@openuidev/thesys-server` (`artifactTool`, `createResponsesInstructions`).
- **Send a message programmatically** with `useThread`:
  `const send = useThread((s) => s.processMessage); send({ role: "user", content })`.
- **An artifact `parser` must tolerate partial data.** While streaming, `args` is
  a partial JSON string and `response` is `null` until the tool result lands.
  Return `null` to skip.
- **Build artifact props with `defineArtifactCategories(...)` and spread the
  result** onto `<AgentInterface>`. Do not hand-write the `artifactCategories` array.
- **Hooks only work inside `<AgentInterface>`**, and all import from
  `@openuidev/react-ui` (including `useNav`).
- **Import the CSS once.** `@openuidev/react-ui/components.css`, plus
  `@openuidev/thesys/styles.css` on Cloud.

## Install

```bash
npm install @openuidev/react-ui
# OpenUI Cloud also:
npm install @openuidev/thesys @openuidev/thesys-server
# Authoring your own GenUI components:
npm install @openuidev/react-lang zod
# The `openui generate` CLI (build-time system-prompt generation):
npm install -D @openuidev/cli
```

## Quickstart: OpenUI Cloud

Three files: the client mount, a generation proxy, and a token mint.

```tsx
// app/page.tsx
"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";

import {
  AgentInterface,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-ui";
import {
  chatLibrary,
  useOpenuiCloudStorage,
  artifactRenderers,
  artifactCategories,
} from "@openuidev/thesys";

const llm: ChatLLM = {
  // Cloud replays history from the conversation, so send only the latest message.
  send: ({ threadId, messages, signal }) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
      }),
      signal,
    }),
  streamProtocol: openAIResponsesAdapter(),
};

export default function App() {
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: true },
  });

  return (
    <AgentInterface
      llm={llm}
      storage={storage}
      componentLibrary={chatLibrary}
      artifactRenderers={artifactRenderers}
      artifactCategories={artifactCategories}
      agentName="My Agent"
    />
  );
}
```

```ts
// app/api/chat/route.ts: proxies to OpenUI Cloud. THESYS_API_KEY stays server-side.
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";

export async function POST(req: Request) {
  const { threadId, input } = await req.json();
  const upstream = await fetch("https://api.thesys.dev/v1/embed/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.THESYS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-5",
      conversation: threadId, // Cloud stores and replays the conversation
      input,
      stream: true,
      store: true,
      tools: [artifactTool()], // managed slides/report tool
      instructions: createResponsesInstructions(),
    }),
    signal: req.signal, // forward browser aborts (stop button)
  });
  // Pipe the SSE stream straight through.
  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
  });
}
```

```ts
// app/api/frontend-token/route.ts: mints a short-lived browser token for storage reads.
export async function POST() {
  const res = await fetch("https://api.thesys.dev/v1/frontend-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.THESYS_API_KEY}`,
    },
    body: JSON.stringify({ user_id: "<your end-user id, from your own auth>" }),
  });
  const { token, expires_at } = await res.json();
  return Response.json({ token, expires_at });
}
```

```bash
# .env.local
THESYS_API_KEY=sk-th-your-key   # server-side only
```

## Quickstart: self-hosted

```tsx
// app/page.tsx
"use client";
import "@openuidev/react-ui/components.css";
import {
  AgentInterface,
  fetchLLM,
  restStorage,
  openAIReadableStreamAdapter,
  openAIMessageFormat,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIReadableStreamAdapter(),
  messageFormat: openAIMessageFormat,
});
const storage = restStorage({ baseUrl: "/api/threads" }); // optional; omit for in-memory

export default function App() {
  return <AgentInterface llm={llm} storage={storage} componentLibrary={openuiLibrary} />;
}
```

```ts
// app/api/chat/route.ts
import OpenAI from "openai";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const systemPrompt = openuiLibrary.prompt(openuiPromptOptions); // teaches the model the components

export async function POST(req: Request) {
  const { messages } = await req.json();
  const stream = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
  });
  // openAIReadableStreamAdapter() parses this NDJSON.
  return new Response(stream.toReadableStream(), {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
```

`fetchLLM` POSTs `{ threadId, runId, messages: messageFormat.toApi(messages), tools: [], context: [] }`
to `url` and forwards the abort signal. Here `messages` is the **full thread history** (the
SDK loads it from `storage` and holds it client-side), so forward all of it to your
provider. (Contrast Cloud, where you send only the latest because Cloud replays the
conversation.) Your route must **stream** and **close the stream when done** (the
client's `isRunning` flips back to `false` only on close).

## `<AgentInterface>` props

Required:
- `llm: ChatLLM`: produces replies.

Common:
- `storage?: ChatStorage`: persistence (in-memory default, wiped on reload).
- `componentLibrary?: Library`: turns on generative UI.
- `artifactRenderers?: ArtifactRendererConfig[]`: custom artifact renderers.
- `artifactCategories?: ArtifactCategory[]`: sidebar artifact nav groups.
- `components?: { AssistantMessage?, UserMessage? }`: replace message rendering.
- `agentName?: string`, `logoUrl?: string`, `labels?: AgentInterfaceLabels`.
- `starters?: ConversationStarterProps[]`, `starterVariant?: "short" | "long"`.

Routing and scroll:
- `path?` / `defaultPath?` / `onNavigate?`: pass `onNavigate` for controlled nav.
- `scrollVariant?: "always" | "user-message-anchor"` (default `user-message-anchor`).
- `scrollOnLoad?: boolean` (default `true`).

Children are slot overrides (see Customization).

## Backends: `ChatLLM` and adapters

The `llm` is a `ChatLLM`. `fetchLLM` builds one for the common case; for full
control, write the object directly (this is what the Cloud quickstart does).

```ts
interface ChatLLM {
  send(p: { threadId: string; messages: Message[]; signal: AbortSignal }): Promise<Response>;
  streamProtocol: StreamProtocolAdapter; // the adapter that parses the response stream
}

// Factory for the common case:
fetchLLM({ url, streamAdapter, messageFormat?, headers?, fetch? }): ChatLLM;
```

Stream adapters (all factories, call with `()`) and the message format each pairs with:

| Adapter | Wire format | Message format |
|---|---|---|
| `agUIAdapter()` | AG-UI SSE (see AG-UI events) | `identityMessageFormat` (default) |
| `openAIAdapter()` | OpenAI Chat Completions SSE | `openAIMessageFormat` |
| `openAIReadableStreamAdapter()` | OpenAI SDK `toReadableStream()` NDJSON | `openAIMessageFormat` |
| `openAIResponsesAdapter()` | OpenAI Responses SSE | `openAIConversationMessageFormat` |
| `langGraphAdapter(opts?)` | LangGraph named SSE | `langGraphMessageFormat` |

A `MessageFormat` is `{ toApi(messages): unknown; fromApi(data): Message[] }`.
`toApi` shapes outgoing messages for your provider; `fromApi` parses stored
messages back. `identityMessageFormat` passes `Message[]` through unchanged.

## Storage

`storage` is a `ChatStorage` with a required `thread` channel and an optional
`artifact` channel.

```ts
interface ChatStorage { thread: ThreadStorage; artifact?: ArtifactStorage; }

interface ThreadStorage {
  listThreads(cursor?: string): Promise<{ threads: Thread[]; nextCursor?: string }>;
  createThread(firstMessage: UserMessage): Promise<Thread>;
  getMessages(threadId: string): Promise<Message[]>;
  updateThread(thread: Thread): Promise<Thread>;
  deleteThread(id: string): Promise<void>;
}

interface ArtifactStorage {
  list(params?: ArtifactListParams): Promise<{ artifacts: ArtifactSummary[]; nextCursor?: string }>;
  get(id: string): Promise<Artifact>;
  update(patch: { id: string; content: unknown }): Promise<ArtifactSummary>;
}

// ArtifactSummary = { id, title, type, threadId, updatedAt? }
// Artifact extends ArtifactSummary { content: unknown }
// Thread = { id, title, createdAt: string | number, isPending? }
```

`Message` is a discriminated union on `role` (re-exported from `@ag-ui/core`); every
message carries an `id`:

```ts
type Message =
  | { id: string; role: "user"; content: string | InputContent[] } // array = multimodal
  | { id: string; role: "assistant"; content?: string; toolCalls?: ToolCall[] }
  | { id: string; role: "tool"; toolCallId: string; content: string }
  | { id: string; role: "system" | "developer" | "reasoning"; content: string };
```

`restStorage({ baseUrl, messageFormat?, headers?, fetch? })` implements the
`thread` channel against this fixed REST contract (no `artifact` channel):

| Operation | Method + path | Body | Returns |
|---|---|---|---|
| List threads | `GET {baseUrl}/get` (`?cursor=` to paginate) | none | `{ threads, nextCursor? }` |
| Create thread | `POST {baseUrl}/create` | `{ messages: [...] }` (first user message) | the new `Thread` |
| Get messages | `GET {baseUrl}/get/{threadId}` | none | `Message[]` |
| Update thread | `PATCH {baseUrl}/update/{threadId}` | the full `Thread` | the updated `Thread` |
| Delete thread | `DELETE {baseUrl}/delete/{threadId}` | none | nothing |

`restStorage` applies `messageFormat` to the `/create` body (`toApi`) and the
`/get/{id}` response (`fromApi`), so it can match a backend that stores a
provider-specific shape; the default is identity (no transform).

For anything else, pass a hand-written `ChatStorage`. To add an artifact channel,
supply `storage.artifact` yourself (restStorage does not).

A minimal Next.js App Router backend for the `restStorage` contract (back the
`Map` with your database):

```ts
// app/api/threads/[...path]/route.ts
import type { Thread, Message } from "@openuidev/react-ui";

const store = new Map<string, { thread: Thread; messages: Message[] }>(); // use your DB

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path[0] === "get" && path[1]) return Response.json(store.get(path[1])?.messages ?? []);
  return Response.json({ threads: [...store.values()].map((r) => r.thread) }); // list
}
export async function POST(req: Request) {
  const { messages } = await req.json(); // create: body is { messages: [firstUserMessage] }
  const thread: Thread = { id: crypto.randomUUID(), title: "New chat", createdAt: Date.now() };
  store.set(thread.id, { thread, messages });
  return Response.json(thread);
}
export async function PATCH(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const thread: Thread = await req.json();
  const row = store.get(path[1]);
  if (row) row.thread = thread;
  return Response.json(thread);
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  store.delete(path[1]);
  return new Response(null, { status: 204 });
}
```

On Cloud, `useOpenuiCloudStorage({ token, features?, apiBaseUrl? })` provides both
the thread and artifact channels. `features.artifact` defaults to `true` (omit
`features` to keep artifacts on).

## Generative UI

The agent renders components from a `Library` inline, streaming their props as
they arrive. Pass the library as `componentLibrary`.

```tsx
import { AgentInterface } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

<AgentInterface llm={llm} componentLibrary={openuiLibrary} />;
```

`openuiLibrary` (web) / `openuiChatLibrary` cover layout, content, tables, charts,
forms, and buttons. On Cloud use `chatLibrary` from `@openuidev/thesys`. Each
library ships paired prompt options (`openuiPromptOptions`,
`openuiChatPromptOptions`).

The model must be told what components exist. Generate a system prompt from the
library and send it to your provider (self-hosted): `library.prompt(promptOptions)`
(see the self-hosted route above). On Cloud, `createResponsesInstructions()` does this.

### Authoring your own components

Use `@openuidev/react-lang`. A component is a Zod v4 schema (props) plus a React
renderer. `createLibrary` bundles components into a `Library`.

```tsx
import { z } from "zod";
import { defineComponent, createLibrary } from "@openuidev/react-lang";

const StatCard = defineComponent({
  name: "StatCard",
  description: "A single KPI with a label, value, and optional delta percentage.",
  props: z.object({
    label: z.string(),
    value: z.string(),
    delta: z.number().optional(),
  }),
  component: ({ props }) => (
    <div className="stat-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      {props.delta != null && <em>{props.delta}%</em>}
    </div>
  ),
});

export const library = createLibrary({ components: [StatCard] });
export const promptOptions = { additionalRules: ["Prefer StatCard for single metrics."] };
```

- Props **must be a Zod v4 object** (Zod 3 throws). `description` is what the model sees.
- The renderer is `React.FC<{ props, renderNode, statementId? }>`. Because it contains JSX, name the library file `.tsx`.
- **Nesting:** reference another component with `Child.ref` and render it with
  `renderNode`:

```tsx
const Item = defineComponent({
  name: "Item",
  description: "A list row.",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <li>{props.text}</li>,
});

const List = defineComponent({
  name: "List",
  description: "A bulleted list of Items.",
  props: z.object({ children: z.array(Item.ref) }),
  component: ({ props, renderNode }) => <ul>{renderNode(props.children)}</ul>,
});
```

`createLibrary({ components, componentGroups?, root? })` returns a `Library` with
`prompt(options?)`, `toSpec()`, and `toJSONSchema()`. `library.prompt(options)`
takes `PromptOptions`:

```ts
interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  examples?: string[];          // static/layout patterns
  toolExamples?: string[];      // shown when tools present
  tools?: (string | ToolSpec)[];
  editMode?: boolean; inlineMode?: boolean;
  toolCalls?: boolean;          // default true when tools provided
  bindings?: boolean;           // $variables/@Set/@Reset; default true if toolCalls
}
```

Generate the system prompt at build time with the CLI:

```bash
openui generate src/library.tsx --out src/system-prompt.txt
openui generate src/library.tsx --json-schema -o spec.json   # component signatures
```

Mount your library: `componentLibrary={library}`, and feed
`library.prompt(promptOptions)` to your model as the system prompt.

### Interactivity

Generated components can be interactive. From `@openuidev/react-lang`:
`reactive(schema)` marks a prop as accepting a `$variable` binding;
`useStateField(name, value?)` reads/writes form state; `useTriggerAction()` fires
actions (`@Set`, `@Run`, `@ToAssistant`). Helpers: `useFormName`,
`useGetFieldValue`, `useSetFieldValue`, `useIsQueryLoading`, `useIsStreaming`.
Form state is tracked automatically and saved with the thread.

## Artifacts

An artifact is a durable output (report, slide deck, dashboard, code file): an
inline preview in chat plus a full view in a side panel or page. A renderer
matches a tool call by `toolName` and a stored artifact by `type`.

```tsx
import { defineArtifactRenderer } from "@openuidev/react-ui";

const reportRenderer = defineArtifactRenderer({
  type: "report",
  toolName: "create_report", // string | string[]; first registration wins on a dup
  parser: ({ args, response }, { isStreaming }) => {
    const data = response as { id: string; title: string; body: string } | null;
    if (!data) return null; // tolerate partial data while streaming
    return {
      props: data,
      // meta null = render without registering in the thread (common while streaming)
      meta: isStreaming ? null : { id: data.id, version: 1, heading: data.title },
    };
  },
  preview: (props, controls) => <ReportCard title={props.title} onOpen={controls.open} />,
  actual: (props) => <ReportView body={props.body} />,
  icon: <ReportIcon />,
  label: "Report",
});
```

Parser contract (two paths, same renderer):
- **Tool-call path:** `{ args, response }` exactly as the backend emitted them.
  `args` is a partial JSON string while the LLM streams; `response` is `null`
  until the tool result arrives (`isStreaming` is `true` until then). The SDK does
  not pre-parse JSON.
- **Storage path:** `{ args: undefined, response: artifact.content }`, `isStreaming`
  false. Stored `content` must match the tool-call response shape.
- Return `null` to skip. Return `meta: null` to render without registering.
  `meta.id` must be stable across re-runs; `meta.type` overrides the static `type`
  for registration. The same component instance is reused across the
  streaming → complete transition (swap UI on `controls.isStreaming`, no remount).

The parser returns `ParsedArtifact` (or `null`):

```ts
interface ParsedArtifact<Props> {
  props: Props;
  meta: { id: string; version: number; heading: string; type?: string } | null;
}
```

- `id`: stable identity across re-runs. Supply it from the tool result (include an `id` field) or derive it from stable content (e.g. a slug of the title); it must not change when the same artifact re-renders.
- `version`: bump when content changes for the same `id`; an `(id, version)` change re-registers the entry.
- `heading`: label shown in the workspace and artifact lists.
- `type?`: override the renderer's static `type` for this entry (one tool-owning renderer can register entries under different kinds).
- `meta: null`: render preview/actual but skip thread registration (use while streaming).

`controls` passed to `preview`/`actual`:
`{ isActive, isStreaming, open(), close(), toggle() }`.

Group renderers into sidebar categories with `defineArtifactCategories`. It
returns both props (renderers and types deduped); spread them onto the component.

```tsx
import { AgentInterface, defineArtifactCategories } from "@openuidev/react-ui";

const artifacts = defineArtifactCategories([
  { name: "Reports", renderers: [reportRenderer], icon: <ReportIcon /> },
  { name: "Dashboards", renderers: [dashboardRenderer], icon: <AppIcon /> },
]);

<AgentInterface llm={llm} {...artifacts} />;
// artifacts === { artifactRenderers, artifactCategories }
```

On OpenUI Cloud, the agent produces **slides and reports** with no renderer to
write: the managed `artifactTool()` (server) plus `artifactRenderers` /
`artifactCategories` from `@openuidev/thesys` (client) cover them. To add your own
artifact types on Cloud, compose: pass your custom renderers and categories
alongside the managed ones (`artifactRenderers={[...artifactRenderers, myRenderer]}`,
`artifactCategories={[...artifactCategories, ...myCategories]}`); a custom
`componentLibrary` works the same way (all just `<AgentInterface>` props). The
renderer side is reliable on Cloud. The tool that *produces* a custom artifact's
content, though, is only fully worked in the self-hosted loop above: the managed
`artifactTool()` generates slides/reports inside Cloud, but running your own
artifact-producing tool on Cloud (catching its streamed call and returning the
content into the conversation) is an advanced, less-trodden path.

## Tools

A tool is a `name`, a `description`, and a JSON Schema for its arguments. The model
proposes a call; **your code runs it** (on Cloud and self-hosted alike, your code
always runs your own tools); the result returns to the conversation. Only Cloud's
built-in tools run inside Cloud.

```ts
const tools = [
  {
    type: "function",
    name: "get_weather",
    description: "Get the current weather for a city.",
    parameters: {
      type: "object",
      properties: { city: { type: "string", description: "City name" } },
      required: ["city"],
      additionalProperties: false,
    },
  },
];
```

**Self-hosted loop:** in your route, declare the tools to your provider, run the
ones it asks for, append each result, and call the provider again until it returns
a turn with no tool calls. If your route emits AG-UI events (with `agUIAdapter()`),
emit `TOOL_CALL_START` / `TOOL_CALL_ARGS` / `TOOL_CALL_END` / `TOOL_CALL_RESULT`
around each call between the text events (see AG-UI events).

```ts
// app/api/chat/route.ts (self-hosted, with tools)
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const run: Record<string, (args: any) => Promise<unknown>> = {
  get_weather: async ({ city }) => ({ tempC: 22, sky: "clear" }), // your real impl
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  const convo = [...messages];
  while (true) {
    const res = await openai.chat.completions.create({ model: "gpt-5", messages: convo, tools });
    const msg = res.choices[0].message;
    if (!msg.tool_calls?.length) {
      // No more tool calls: stream the final answer back to the client.
      const final = await openai.chat.completions.create({ model: "gpt-5", messages: convo, stream: true });
      return new Response(final.toReadableStream(), { headers: { "Content-Type": "application/x-ndjson" } });
    }
    convo.push(msg);
    for (const call of msg.tool_calls) {
      const out = await run[call.function.name](JSON.parse(call.function.arguments));
      convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out) });
    }
  }
}
```

On Cloud, the managed `artifactTool()` runs inside Cloud. You can declare extra
function tools in the `/api/chat` `tools` array, but executing them means catching
the streamed tool call in your app and submitting the result back to Cloud's
Responses API (an advanced pattern not worked here). For a fully worked custom-tool
loop, use the self-hosted route above.

A tool call is also how a custom artifact is produced: name the tool to match a
renderer's `toolName`.

## Customization (slots and primitives)

Pass children to override regions. Every slot and primitive is a **static property
of `AgentInterface`** (`<AgentInterface.Sidebar>`, `<AgentInterface.Welcome>`,
`<AgentInterface.Route>`, and so on), not a separate import. **Slot markers**
replace a whole region; **primitives** compose inside a slot. Omit a slot to get
the default.

Slot markers: `Sidebar`, `SidebarHeader`, `MobileHeader`, `ThreadHeader`,
`Welcome`, `Composer`, `Workspace`, `Route`.
Primitives: `SidebarItem`, `SidebarContent`, `SidebarSeparator`, `NewChatButton`,
`ThreadList`, `ArtifactNav`, `Messages`, `MessageLoading`, `ScrollArea`.

```tsx
<AgentInterface llm={llm}>
  <AgentInterface.Sidebar>
    <AgentInterface.SidebarHeader agentName="Acme" />
    <AgentInterface.NewChatButton />
    <AgentInterface.SidebarItem icon={<HomeIcon />} path="/home">Home</AgentInterface.SidebarItem>
    <AgentInterface.SidebarSeparator />
    <AgentInterface.ThreadList />
  </AgentInterface.Sidebar>

  {/* exact-match custom route; its children replace the thread region */}
  <AgentInterface.Route path="/home">
    <MyHomePanel />
  </AgentInterface.Route>
</AgentInterface>
```

- **`Sidebar`**: omit for the default (header + new-chat + artifact nav + thread
  list). With children, you compose the inner content from primitives.
- **`SidebarItem`**: `{ icon?, trailing?, selected?, path?, children }`. With
  `path`, clicking navigates and the item auto-selects when the route matches.
- **`ArtifactNav`**: `{ className?, icon? }`. One item per `artifactCategories`
  (or a single "Artifacts"). Renders nothing without `storage.artifact`.
- **`Welcome`**: `{ title?, description?, image?, starters?, starterVariant? }`
  XOR `{ children }`. Shown only while the thread is empty.
- **`Composer`**: `{ className?, placeholder?, starters?, starterVariant?, children? }`.
- **`Workspace`**: the artifact rail. Omit for the default; pass children to
  replace. Hidden on mobile and on Route/artifact pages.
- **`Route`**: `{ path, children }`, **exact match only**. Active route children
  replace the thread region. Pair with `useNav()` to navigate.
- **`Messages`**: `{ loader?, assistantMessage?, userMessage? }`.

### Starters

```tsx
<AgentInterface
  llm={llm}
  starters={[{ displayText: "Summarize", prompt: "Summarize my latest report.", icon: <Bulb /> }]}
  starterVariant="long" // "short" pills | "long" vertical list
/>;
```

Each starter is `{ displayText, prompt, icon? }`. Clicking one sends `prompt` as a
user message. Starters set on `AgentInterface` flow into Welcome and Composer; pass
`[]` to a slot to suppress them there.

### Custom message rendering

```tsx
import { AgentInterface, type AssistantMessage } from "@openuidev/react-ui";

function CustomAssistantMessage({ message, isStreaming }: {
  message: AssistantMessage;
  isStreaming: boolean;
}) {
  return <div className="prose">{message.content ?? ""}</div>; // content empty until first token
}

<AgentInterface llm={llm} components={{ AssistantMessage: CustomAssistantMessage }} />;
```

`components.AssistantMessage` / `components.UserMessage` are independent; override
one and the other keeps its default. When `componentLibrary` is set and you do not
override `AssistantMessage`, assistant messages render through the library.

## Hooks

All import from `@openuidev/react-ui`. Call only inside `<AgentInterface>` (a
renderer's `preview`/`actual`, slot children, message components, and `Route`
children are all inside the tree).

| Hook | Returns |
|---|---|
| `useNav()` | `{ path: string \| undefined; navigate(next): void }` |
| `useThread(selector?)` | `{ messages, isRunning, isLoadingMessages, threadError, executingToolCallIds, processMessage, appendMessages, updateMessage, setMessages, deleteMessage, cancelMessage }` |
| `useThreadList(selector?)` | `{ threads, isLoadingThreads, selectedThreadId, hasMoreThreads, loadThreads, loadMoreThreads, switchToNewThread, createThread, selectThread, updateThread, deleteThread }` |
| `useMessage()` | `{ message: Message }` |
| `useArtifactList(filter?)` | per-thread artifact registry, optionally filtered by `type` |
| `useArtifactRenderer(toolName)` | the matched `ArtifactRendererConfig` or `null` |
| `useArtifactRendererRegistry()` | `{ byToolName, byType } \| null` (escape hatch) |
| `useArtifactStorage()` | the `ArtifactStorage` adapter or `null` |
| `useArtifactCategories()` | `ArtifactCategory[]` |
| `useDetailedView(viewId)` / `useActiveDetailedView()` | the detailed-view (side panel) system |
| `useToolActivities(message, allMessages)` | `ToolActivity[]` for a message |

`useThread` and `useThreadList` are selector hooks: pass a function that picks a
slice; the component re-renders only when that slice changes. Send a message:
`const send = useThread((s) => s.processMessage); send({ role: "user", content })`
(`content` is a string, or an array for multimodal input).

## AG-UI events (custom streaming backends)

When your route streams AG-UI SSE (paired with `agUIAdapter()`), the SDK consumes
this event subset. Emit them in order; a run ends when the stream closes.

- `TEXT_MESSAGE_START` `{ messageId, role }`
- `TEXT_MESSAGE_CONTENT` `{ messageId, delta }` (or `TEXT_MESSAGE_CHUNK`)
- `TOOL_CALL_START` `{ toolCallId, toolCallName }`
- `TOOL_CALL_ARGS` `{ toolCallId, delta }` (arguments stream as a partial JSON string)
- `TOOL_CALL_END` `{ toolCallId }`
- `TOOL_CALL_RESULT` `{ messageId, toolCallId, content }` (`content` is always a string)
- `RUN_ERROR` `{ message, code? }`

Tool status progresses `streaming → executing → complete | error`. The event types
are re-exported from `@openuidev/react-ui` (originally `@ag-ui/core`).

A `messageId` groups one assistant text message; a `toolCallId` groups one tool
call (independent ids). For a turn that calls one tool, then replies:

```
TOOL_CALL_START      { toolCallId: "t1", toolCallName: "get_weather" }
TOOL_CALL_ARGS       { toolCallId: "t1", delta: "{\"city\":\"Tokyo\"}" }
TOOL_CALL_END        { toolCallId: "t1" }
TOOL_CALL_RESULT     { messageId: "m1", toolCallId: "t1", content: "22C, clear" }
TEXT_MESSAGE_START   { messageId: "m2", role: "assistant" }
TEXT_MESSAGE_CONTENT { messageId: "m2", delta: "It is 22C in Tokyo." }
(then close the stream)
```

Tool and text events may interleave across rounds in one turn. Keep each tool's
START/ARGS/END/RESULT together, and each text message's START/CONTENT under one
`messageId`.

## Factory and type reference

```ts
fetchLLM({ url, streamAdapter, messageFormat?, headers?, fetch? }): ChatLLM
restStorage({ baseUrl, messageFormat?, headers?, fetch? }): ChatStorage  // thread channel only
defineArtifactRenderer(config): ArtifactRendererConfig
defineArtifactCategories(groups: ArtifactCategoryGroup[]): { artifactRenderers, artifactCategories }

interface ArtifactCategoryGroup { name: string; renderers: ArtifactRendererConfig[]; icon?: ReactNode; } // builder input
interface ArtifactCategory { name: string; filter: { type: string[] }; icon?: ReactNode; }              // builder output
type CreateMessage = { role: "user"; content: string };   // processMessage input
```

Env: OpenUI Cloud uses `THESYS_API_KEY` (server-side only); self-hosted uses your
provider key (e.g. `OPENAI_API_KEY`), also server-side only.
