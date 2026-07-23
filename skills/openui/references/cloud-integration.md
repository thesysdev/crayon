# Integrate OpenUI Cloud into an Existing Project

Use this runbook to add the stock OpenUI Cloud Agent Interface to an existing React application. Use the host application's framework, package manager, route conventions, authentication, layout, and design system. Verify version-sensitive details against the installed packages, generated templates, and current first-party OpenUI sources before editing.

## Contents

1. [Supported Contract](#supported-contract)
2. [Audit the Host](#audit-the-host)
3. [Install and Configure](#install-and-configure)
4. [Wire the Client](#wire-the-client)
5. [Authorize Cloud Conversations](#authorize-cloud-conversations)
6. [Add the Generation Proxy](#add-the-generation-proxy)
7. [Add the Frontend Token Route](#add-the-frontend-token-route)
8. [Add Tools and MCP](#add-tools-and-mcp)
9. [Multi-User and Multi-App Convention](#multi-user-and-multi-app-convention)
10. [Adapt Beyond Next.js](#adapt-beyond-nextjs)
11. [Verify](#verify)

## Supported Contract

The verified happy path provides:

- React `AgentInterface` backed by OpenUI Cloud.
- Cloud conversation and artifact persistence.
- The managed `chatLibrary` component set.
- Managed report and presentation artifacts.
- A server-side Responses proxy and a server-side frontend-token mint.
- Server-side Cloud tools (artifacts, web/image search, remote MCP) and app-owned function tools via the documented loop ([Add Tools and MCP](#add-tools-and-mcp)).

Do not imply that a browser-only app can safely integrate Cloud: it needs a trusted server boundary. Custom tool execution is supported via the documented function-tool loop ([Add Tools and MCP](#add-tools-and-mcp)). Treat historical data import and generation with a custom component library as separate capabilities that require current first-party support. Do not assume the installed SDK exports a conversation-ownership helper; a production generation proxy needs the explicit ownership design below.

## Audit the Host

Before editing:

1. Detect the package manager and installed React/Next versions.
2. Find the correct client route or component where chat belongs; do not replace the application root unless requested.
3. Find the server route convention and runtime. Prefer a Node-compatible runtime for the OpenAI SDK recipe.
4. Identify the host's server-side authentication API and stable end-user id.
5. Identify how the host can authorize a Cloud `threadId` for that user. Use a host-owned mapping only when the app has a trusted way to create or bind the Cloud conversation id. Use a token-scoped Cloud membership check only when its exact endpoint, header, and pagination contract are documented for the installed version. If neither path is supported, leave generation disabled in production and report the blocker.
6. Inventory existing chat state, rate limits, routes, CSP/proxy rules, styles, themes, tools, and artifact behavior.
7. Inspect installed `@openuidev/*` declarations when they differ from the repository template.

## Install and Configure

Add only missing packages using the host package manager. The canonical Cloud template uses:

```text
@openuidev/lang-core
@openuidev/react-headless
@openuidev/react-lang
@openuidev/react-ui
@openuidev/thesys
@openuidev/thesys-server
openai
zod
zustand@^4.5.5
```

`@openuidev/react-ui` re-exports headless APIs, but keep `@openuidev/react-headless` installed when required as a peer dependency. Import the re-exported APIs from `@openuidev/react-ui` in React UI applications.

Configure server-only environment values:

```bash
THESYS_API_KEY=sk-th-your-key
OPENUI_MODEL=google/gemini-3.1-pro-free
```

Use a current supported `provider/model` value for `OPENUI_MODEL`; prefer the generated template or console over a stale hardcoded list. A scaffold may also use `DEMO_USER_ID=demo-user`, but production must derive the user id from authenticated server state.

## Wire the Client

In Next.js, keep the existing page/layout as a server component so it can retain
server-side authentication and the product shell. Keep the Cloud UI plus all
`@openuidev/thesys` imports in a separate client component. Follow the dynamic
rendering boundary used by the installed first-party template. The current App
Router template marks the server page as dynamic:

```tsx
// app/assistant/page.tsx
import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";
import CloudAgent from "./cloud-agent";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return <CloudAgent />;
}
```

Apply the host's normal server auth guard on that page when its parent layout
does not already enforce authentication. If the installed Cloud client still
fails during the production prerender, add a small client loader that imports
`cloud-agent.tsx` with `dynamic(..., { ssr: false })`; do not impose that fallback
without reproducing the need. Import each stylesheet once in a location allowed
by the host framework.

```tsx
"use client";

import {
  AgentInterface,
  defineArtifactCategories,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";

const artifacts = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

const llm: ChatLLM = {
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

export default function CloudAgent() {
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  return (
    <AgentInterface
      llm={llm}
      storage={storage}
      componentLibrary={chatLibrary}
      {...artifacts}
      agentName="My Agent"
    />
  );
}
```

Preserve the host's routing, slots, theme, logo, starters, and layout. The Cloud-specific changes are the `llm`, `storage`, component library, artifact props, and Cloud stylesheet.

## Authorize Cloud Conversations

The frontend token scopes browser storage calls to a `user_id`, but `/api/chat`
uses the server key. Possession of a `threadId` is therefore not sufficient
authorization for the generation proxy.

Use one of these designs:

1. **Host-owned mapping:** only when the app has a trusted conversation-creation
   or binding path, transactionally store `{ conversationId, ownerUserId }` in
   the host database. Browser-created ids are not trusted bindings by
   themselves. This is the preferred constant-time check at scale.
2. **Verified Cloud membership check:** only when the installed package,
   generated template, or current first-party documentation exposes one,
   authenticate the request and verify `threadId` through a token scoped to that
   exact user. Copy the documented endpoint, auth header, response shape, and
   pagination behavior instead of inferring them. Cache a positive result in a
   host-owned mapping when appropriate.

Do not add a browser endpoint that merely “claims” a supplied id; without an
independent Cloud check, a malicious user could claim another user's id. The
frontend-token mint needed by `useOpenuiCloudStorage()` is separate from this
ownership decision:

```ts
// lib/openui-cloud.server.ts
type FrontendToken = { token: string; expires_at: number };

export async function mintCloudFrontendToken(userId: string): Promise<FrontendToken> {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("THESYS_API_KEY is not configured");

  const response = await fetch("https://api.thesys.dev/v1/frontend-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      user_id: userId,
      // Stable per-app identity — see Multi-User and Multi-App Convention.
      ...(process.env.APP_ID ? { app_id: process.env.APP_ID } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cloud frontend-token mint failed with ${response.status}`);
  }
  return (await response.json()) as FrontendToken;
}
```

Minting a token for a user does not itself prove that an arbitrary `threadId`
belongs to that user. If the stock browser storage path cannot populate a host
mapping and no documented membership lookup exists, do not emit placeholder
authorization or call the production integration complete.

## Add the Generation Proxy

For Next.js App Router, add or adapt `app/api/chat/route.ts`. API routes do not
inherit page/layout auth: authenticate and rate-limit this route independently.
Validate input, authorize the untrusted `threadId` for the authenticated user,
keep the key server-side, forward the abort signal, and return Responses SSE
without converting protocols.

Create a server-only `parseCloudChatRequest(req)` helper before enabling the
route. Require JSON, accept a bounded `threadId`, allow exactly one bounded text item with
`{ type: "message", role: "user" }`, and reconstruct the provider item from
those allowlisted fields. Do not forward the browser's `ResponseInputItem[]`
verbatim: it could contain system, developer, function-call, or oversized input.
If the product supports images or files, extend the allowlist and size limits
deliberately instead of weakening it to the entire Responses union.

Configure the host framework's request-body byte limit before JSON parsing. If
the framework cannot enforce one, read the request stream with an explicit cap.
Validate the bounded JSON with the host's schema library, then reconstruct this
allowlisted shape rather than returning the parsed browser object directly:

```ts
type CloudChatRequest = {
  threadId: string;
  input: [{ type: "message"; role: "user"; content: string }];
};
```

Reject extra root and message fields. If the existing UI sends attachments or
other content parts, preserve its old path until the installed Cloud contract is
verified and the allowlist is extended deliberately. If the UI exposes a model
selector, accept only ids from a server-maintained allowlist; never pass an
arbitrary browser-supplied model to Cloud.

The route below is a structural baseline, not a standalone drop-in.
`getAuthenticatedUserId`, `parseCloudChatRequest`, and
`userOwnsCloudConversation` are host-supplied boundaries, not OpenUI exports.
Implement and test all three before enabling the route; if the host cannot
provide trusted conversation ownership, stop at the production blocker instead
of weakening the check.

```ts
import { getAuthenticatedUserId } from "@/lib/auth.server";
import { parseCloudChatRequest } from "@/lib/cloud-request";
import { userOwnsCloudConversation } from "@/lib/conversation-ownership.server";
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const request = await parseCloudChatRequest(req);
  if (!request.ok) {
    return Response.json({ error: { message: request.message } }, { status: request.status });
  }
  const { threadId, input } = request.value;

  let authorized: boolean;
  try {
    authorized = await userOwnsCloudConversation(userId, threadId);
  } catch (error) {
    console.error("[api/chat] Unable to verify Cloud conversation ownership", error);
    return Response.json(
      { error: { message: "Unable to verify conversation access" } },
      { status: 503 },
    );
  }
  if (!authorized) {
    return Response.json({ error: { message: "Forbidden" } }, { status: 403 });
  }

  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: "THESYS_API_KEY is not configured" } },
      { status: 500 },
    );
  }

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey,
  });

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      {
        model: process.env.OPENUI_MODEL || "google/gemini-3.1-pro-free",
        conversation: threadId,
        input,
        stream: true,
        store: true,
        tools: [artifactTool({ artifacts: ["slides", "report"] })],
        instructions: createResponsesInstructions(),
        // The Cloud artifact tool extends the stock OpenAI Responses tool union.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { signal: req.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (error) {
    const upstream = error as { status?: number; error?: unknown; message?: string };
    console.error("[api/chat] Cloud request failed", upstream.status, upstream.message);
    return Response.json(
      { error: { message: "Cloud request failed" } },
      { status: upstream.status === 429 ? 429 : 502 },
    );
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[api/chat] Cloud stream failed", message);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Cloud stream failed" })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

Adapt the `getAuthenticatedUserId` import to the application's real server auth
API and apply its normal rate limiter. A host-owned ownership lookup may replace
the sample `userOwnsCloudConversation` boundary; alternatively implement a
documented Cloud membership lookup for the installed version. Copy or adapt the
bounded request parser rather than replacing it with `req.json()` plus a type assertion. Keep
the compatibility cast scoped to this request object. Use the exact cast required
by the installed OpenAI SDK and `@openuidev/thesys-server` versions; do not weaken
unrelated types across the host application.

## Add the Frontend Token Route

The route must mint a token for the authenticated user and use the host's normal
rate limiter. API routes do not inherit page/layout auth. Never accept the
authoritative `user_id` from an untrusted request body.

```ts
import { getAuthenticatedUserId } from "@/lib/auth.server";
import { mintCloudFrontendToken } from "@/lib/openui-cloud.server";

export async function POST(req: Request) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });

  let frontendToken: { token: string; expires_at: number };
  try {
    frontendToken = await mintCloudFrontendToken(userId);
  } catch (error) {
    console.error("[frontend-token] Cloud rejected token mint", error);
    return Response.json({ error: { message: "Unable to mint frontend token" } }, { status: 502 });
  }

  return Response.json(frontendToken, { headers: { "Cache-Control": "private, no-store" } });
}
```

Adapt `getAuthenticatedUserId` to the project's real server-side session lookup.
The token route and generation-route ownership check must derive exactly the
same stable user id. Treat a scaffold's `DEMO_USER_ID` as local-demo identity
only; replace it with real authentication, authorization, and rate limiting
before enabling either route in production.

## Add Tools and MCP

OpenUI Cloud executes several tools **server-side, inside the platform** — declare them in `tools` and they run without any client code. Only `type: "function"` tools run on the app's server.

| Tool | Declare as | Executes |
|---|---|---|
| Report/slide artifacts — generate + edit (editing auto-enabled) | `artifactTool({ artifacts: ["slides", "report"] })` | Cloud |
| Web search | `{ type: "web_search" }` | Cloud |
| Image search | `{ type: "image_search" }` | Cloud |
| Remote MCP servers | `{ type: "mcp", server_label, server_url, headers? }` | Cloud |
| App-owned function tools | `{ type: "function", name, description, parameters }` | The app's server |

### Remote MCP — zero client code

```ts
tools: [
  artifactTool({ artifacts: ["slides", "report"] }),
  { type: "web_search" },
  {
    type: "mcp",
    server_label: "deepwiki",
    server_url: "https://mcp.deepwiki.com/mcp", // public, no auth — good smoke test
    // headers: { Authorization: `Bearer ${process.env.MCP_TOKEN}` },
  },
],
```

MCP servers do not auto-attach; every request declares its own. The stream carries an `mcp_list_tools` item once per fresh server and one `mcp_call` item per invocation. A failed connection surfaces as `mcp_list_tools` with an `error` field — check for it before concluding the model "chose not to" use the server.

### App-owned function tools

The model emits a `function_call`; the app executes it and posts a `function_call_output` back on a continuation request, looping until the model answers. **Do not write this loop from scratch.** `runFunctionToolLoop` is not published as a package — copy the template's `src/lib/tool-loop.ts` plus `src/lib/tools/get-weather.ts` (a complete, no-auth reference tool) from a current scaffold or `packages/openui-cli/src/templates/openui-cloud/` in the openui repository, and register executors keyed by tool name. In a non-TypeScript stack, port the file and keep its two rules below intact.

Two rules make any such loop safe next to Cloud's server-side tools; the template loop enforces both internally:

1. **Execute only the tool names the app declared.** Cloud streams some of its own tools as real-named `function_call` items (names starting `thesys_`, e.g. the artifact program carrier) — they are already executed server-side; running or answering them corrupts the conversation.
2. **Skip any call whose `call_id` already has a `function_call_output` on the same stream.** The platform never streams an output for a call it expects the app to execute, so an output's presence means "already settled".

## Multi-User and Multi-App Convention

Ask the user two questions before wiring identity; do not assume either answer:

1. **"What is the app called?"** → `APP_ID`, the app's stable identity (scaffolds generate `<name>-<suffix>` into `.env`). Never derive it from the API key — key rotation would orphan every user's history — and never change it after launch.
2. **"Single-user demo or real multi-user?"** Demo: keep the scaffold's `DEMO_USER_ID`. Multi-user: derive `user_id` from the host's server-side session; only the token route changes.

How scoping works on the Cloud conversation plane:

- **The fct_ token binds the scope.** Mint it with `POST /v1/frontend-tokens` `{ user_id, app_id }`. With an fct_ token, conversation create/list are locked to the token's user and app — `user_id`/`app_id` in request bodies or query are rejected, so the browser can never widen its own scope.
- **The master key is the server plane.** Create conversations with `user_id` / `app_id` in the body; list org-wide or filtered with `GET /v1/conversations?user_id=<id>`.
- **Ownership fields are first-class, not metadata.** The `metadata` object on conversations (create/update) and the `metadata` param on `POST /v1/embed/responses` are for the app's own data; reserved keys (`userId`, `appId`, `orgId`) are stripped server-side. Do not encode ownership in metadata.
- **Generation still needs an ownership check.** `/api/chat` runs on the master key, so verify the untrusted `threadId` belongs to the session user ([Authorize Cloud Conversations](#authorize-cloud-conversations)).

Working code: the template's `src/app/api/frontend-token/route.ts` sends `app_id` + demo identity; this runbook's mint helper and ownership designs cover the multi-user variants.

Brownfield recipe (existing app, real users):

1. Locate the host's server-side session lookup and its stable user id.
2. Choose `APP_ID` with the user; put it in the host's server env.
3. Token route: mint the fct with `{ user_id: sessionUserId, app_id: process.env.APP_ID }` — never accept `user_id` from the request body.
4. Generation route: enforce thread ownership per [Authorize Cloud Conversations](#authorize-cloud-conversations).
5. Verify isolation: two signed-in users see disjoint thread lists, and two apps with different `APP_ID`s on one org key see disjoint thread lists.

## Adapt Beyond Next.js

Keep the same contracts in other server frameworks:

- Client `ChatLLM.send` posts `{ threadId, input }` to the host server.
- The generation endpoint validates input, calls `POST https://api.thesys.dev/v1/embed/responses` or the equivalent OpenAI SDK base URL, and streams SSE unchanged.
- The token endpoint resolves the user from trusted server auth, calls `POST https://api.thesys.dev/v1/frontend-tokens`, and returns `{ token, expires_at }`.
- The generation endpoint verifies the untrusted conversation id through a host mapping or a documented Cloud membership contract for the installed version.
- The browser never receives `THESYS_API_KEY`.
- If the host uses a restrictive CSP, allow `https://api.thesys.dev` in
  `connect-src` for the browser-to-Cloud storage plane.

The managed client packages are React packages. Do not promise a Vue, Svelte, React Native, or browser-only Cloud client without a current first-party example or package contract.

## Verify

1. Run formatter, typecheck, tests, and a production build.
2. In Next.js, match the installed first-party template's dynamic-rendering
   boundary and run the actual production bundler. Add `ssr: false` only if the
   installed Cloud client otherwise fails during prerender.
3. Confirm `THESYS_API_KEY` appears only in server code and environment documentation.
4. Confirm `messages.slice(-1)`, `conversation: threadId`, `stream: true`, and `store: true` remain intact.
5. Confirm `openAIResponsesAdapter()` is paired with `openAIConversationMessageFormat`.
6. Test invalid JSON/content type, request and message size limits, non-user/provider input injection, missing configuration, token-mint failure, Cloud 4xx/5xx, abort, and stream close.
7. Verify logged-out requests receive `401` from both routes and rate limits apply.
8. Verify ownership-check failures return a service error rather than accidentally authorizing or misreporting them as `403`.
9. Verify a user cannot proxy generation into another user's `threadId`, then confirm two authenticated users receive isolated thread lists.
10. With an authorized test key, stream a reply, reload the page to verify persistence, then create and open one report or presentation.
11. Ask a weather-style question: confirm the declared function tool executes, its result reaches the model's final answer, and no `thesys_*` function_call is ever executed or answered by the app's loop.
12. If MCP is declared, confirm `mcp_list_tools` appears on the stream and that an unreachable server surfaces its `error` instead of failing silently.
13. Confirm two different `APP_ID`s sharing one org key produce disjoint thread lists.
