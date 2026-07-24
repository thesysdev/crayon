# OSS to Cloud Migration

Use this runbook for application-code migration from OSS (open-source or self-hosted) OpenUI to the managed Cloud backend. Read [cloud-integration.md](cloud-integration.md) as well; it contains the canonical Cloud client and server contracts.

## Contents

1. [Define the Migration](#define-the-migration)
2. [Classify the Existing App](#classify-the-existing-app)
3. [Apply the Migration Map](#apply-the-migration-map)
4. [Migrate AgentInterface Apps](#migrate-agentinterface-apps)
5. [Handle Renderer-Only and Custom-Library Apps](#handle-renderer-only-and-custom-library-apps)
6. [Handle Dual Mode](#handle-dual-mode)
7. [Respect Unsupported Boundaries](#respect-unsupported-boundaries)
8. [Verify](#verify)

## Define the Migration

Distinguish these goals before removing code:

- **Replace:** Cloud becomes the only generation and storage backend.
- **Dual mode:** Keep the OSS path beside Cloud when a required capability lacks verified Cloud parity, or when the rollout needs a reversible comparison before replacement.
- **Code migration:** Rewire the application to Cloud and start with Cloud-owned conversations.
- **Data migration:** Import historical threads or artifacts into Cloud.

If the request says only “migrate to Cloud,” default to code migration and preserve historical data in place. Do not claim data migration unless a current first-party import API is documented and verified.

If the app uses OSS components, ask whether the user wants to keep them or switch to Cloud's `chatLibrary`. Treat backend, storage, and component-library migration as separate choices; moving to Cloud does not automatically authorize replacing the visible component set.

## Classify the Existing App

Inventory the project before editing:

| Shape                        | Typical signals                                                              | Migration character                                                           |
| ---------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Self-hosted `AgentInterface` | `fetchLLM`, `ChatLLM`, `restStorage`, `openuiLibrary` or `openuiChatLibrary` | Mostly mechanical adapter/storage/library swap                                |
| Legacy flat-prop chat        | `apiUrl`, `threadApiUrl`, `processMessage`, old renderer names               | First migrate to current `AgentInterface`, then migrate backend               |
| Renderer-only GenUI          | `Renderer`, `library.prompt()`, app-owned messages and model stream          | Architectural change; not a backend-only swap                                 |
| Custom component library     | `defineComponent`, `createLibrary`, custom prompt options                    | Rendering may be reusable; Cloud generation instructions require verification |
| Tool-heavy agent             | provider tool loop or AG-UI tool events                                      | Preserve self-hosted until the Cloud custom-tool loop is documented           |

Record the current provider, model selector, message wire format, attachments,
storage ownership, user identity, route behavior, tools, component library,
artifacts, custom slots/theme, and tests.

## Apply the Migration Map

| Self-hosted/open-source                              | OpenUI Cloud                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Provider API key and provider route                  | Server-only `THESYS_API_KEY` and Cloud Responses proxy                                                 |
| Full message history sent per turn                   | Latest message only plus `conversation: threadId`                                                      |
| `openAIReadableStreamAdapter()` or `openAIAdapter()` | `openAIResponsesAdapter()`                                                                             |
| `openAIMessageFormat`                                | `openAIConversationMessageFormat`                                                                      |
| In-memory, `restStorage`, or custom `ChatStorage`    | `useOpenuiCloudStorage({ token: "/api/frontend-token" })`                                              |
| `openuiLibrary`/`openuiChatLibrary`                  | `chatLibrary` from `@openuidev/thesys` when the user chooses Cloud components                          |
| `library.prompt(...)` in the provider route          | `createResponsesInstructions()` in the Cloud route                                                     |
| App-owned artifact loop/renderers                    | Managed `artifactTool({ artifacts: ["slides", "report"] })` plus managed renderers for stock artifacts |
| No browser storage credential                        | Short-lived frontend token scoped to the authenticated `user_id`                                       |

Preserve branding, theme, starters, slots, navigation, route placement, error boundaries, analytics, and authentication unless the user requests a redesign.

## Migrate AgentInterface Apps

1. Read [cloud-integration.md](cloud-integration.md) and add the missing Cloud packages and server-only configuration.
2. Replace the client `llm` with a direct `ChatLLM` that sends only the latest formatted message and parses Responses SSE.
3. In Next.js, move the Cloud UI into a separate client component and match the
   installed first-party template's dynamic-rendering boundary. Add an
   `ssr: false` client loader only when the production build requires it.
4. Replace self-hosted storage with `useOpenuiCloudStorage()` and add the frontend-token route.
5. If the user chose Cloud components, replace the stock OSS library with `chatLibrary` and register the managed report/presentation renderers. If they chose OSS components, keep them and verify that managed generation receives compatible component instructions; otherwise retain that generation path in OSS or dual mode.
6. Replace the provider `/api/chat` implementation with the Cloud proxy while preserving independent API authentication, conversation authorization, rate limiting, request validation, abort propagation, error handling, and the route URL expected by the client.
7. Keep the previous provider/storage code until the Cloud path builds and passes tests. Remove it only for an explicitly confirmed replacement migration.
8. Remove provider dependencies, environment variables, storage routes, and dead adapters only when no other application path uses them.
9. Update environment examples and deployment configuration without committing secrets.

Do not send both full history and a Cloud conversation id. Doing so can duplicate context. Do not leave `library.prompt()` in the stock Cloud route; `createResponsesInstructions()` supplies the managed instructions.

## Handle Renderer-Only and Custom-Library Apps

A Renderer-only app owns its messages, model stream, and layout. OpenUI Cloud's verified managed path is `AgentInterface` plus Cloud storage, so migration is not a drop-in provider URL change.

For a stock Cloud migration:

1. Introduce `AgentInterface` at the requested route or surface.
2. Move reusable branding and surrounding layout into `AgentInterface` props/slots.
3. Add the two Cloud server routes and managed library/artifacts from [cloud-integration.md](cloud-integration.md).
4. Retain the old Renderer surface until behavior parity is verified; then remove it only for replacement migrations.

For a custom component library, separate two questions:

- **Can the client render it?** `AgentInterface` accepts a `componentLibrary` prop.
- **Will Cloud generation receive matching component instructions?** Verify the installed `@openuidev/thesys-server` API and current first-party docs. Client-side composition alone does not prove that the managed model knows the custom signatures.

If there is no verified Cloud instruction-composition API, do not pretend the custom library migrated. Keep that generation path self-hosted, migrate only the stock Cloud surface, or report the unsupported boundary.

## Handle Dual Mode

Keep each backend internally consistent. Define two complete configurations rather than mixing adapters and storage:

```text
selfHosted = full-history transport + provider route + self-hosted storage + OSS library prompt
cloud = latest-message Responses transport + Cloud proxy + Cloud storage + Cloud instructions
```

Select the mode on the server or through trusted deployment configuration. Do not expose secrets or allow an untrusted browser value to choose arbitrary upstream credentials. Namespace storage and routes when necessary to avoid thread-id collisions.

## Respect Unsupported Boundaries

- **Historical conversations/artifacts:** no import path is established by the repository sources. Preserve the old store read-only or export it separately; do not fabricate Cloud records.
- **Custom tool execution:** supported. Declare `type: "function"` tools and execute them with the template's `runFunctionToolLoop` (`src/lib/tool-loop.ts`; see cloud-integration.md "Add Tools and MCP"). Never execute or answer Cloud's own `thesys_*` function calls. Prefer a remote MCP server when the capability already exists as one.
- **Custom artifact-producing tools:** managed `artifactTool()` covers the documented report and slide path. Do not infer support for arbitrary custom artifacts.
- **Attachments and media:** preserve an attachment-capable self-hosted path until the installed Cloud client, generation input, storage, and size-limit contracts are verified end to end.
- **Non-React clients:** the verified managed client surface is React. Require a first-party runtime/example before promising another framework.

## Verify

1. Run formatter, typecheck, tests, and production build.
2. Search for stale adapter/format pairs, full-history Cloud sends, browser-exposed keys, and obsolete provider routes.
3. Exercise both modes independently when dual mode is retained.
4. Verify existing self-hosted data remains accessible or deliberately archived; do not describe it as imported without evidence.
5. With an authorized test key, verify streaming, persistence after reload, user isolation, and a managed artifact.
6. Compare user-visible behavior—theme, starters, navigation, tools, and custom components—and explicitly list any capability intentionally left self-hosted.
