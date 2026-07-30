# OpenUI Docs Demo Migration to OpenUI Cloud

## Status and scope

Status: implemented in the docs application.

This migration covers every hosted, LLM-backed demo linked from the site's **Demos** menu. Tracking
is intentionally more granular than the public page: modes that make separate model calls receive
separate keys.

| Public demo    | Workload                  | Provider API               | Server-only key                        |
| -------------- | ------------------------- | -------------------------- | -------------------------------------- |
| `/chat`        | OpenUI OSS                | Chat Completions           | `THESYS_API_KEY_DOCS_CHAT_OSS`         |
| `/chat`        | OpenUI Cloud              | Responses + frontend token | `THESYS_API_KEY_DOCS_CHAT_CLOUD`       |
| `/compare`     | Rendered Markdown         | Chat Completions           | `THESYS_API_KEY_DOCS_COMPARE_MARKDOWN` |
| `/compare`     | OpenUI OSS                | Chat Completions           | `THESYS_API_KEY_DOCS_COMPARE_OSS`      |
| `/compare`     | OpenUI Cloud              | Responses + frontend token | `THESYS_API_KEY_DOCS_COMPARE_CLOUD`    |
| `/demos`       | OpenUI-vs-JSON playground | Chat Completions           | `THESYS_API_KEY_DOCS_PLAYGROUND`       |
| `/demo/github` | GitHub dashboard          | Chat Completions           | `THESYS_API_KEY_DOCS_GITHUB`           |

`/compare` keeps all three modes mounted and submits every prompt to all three, including a mode
that is not currently visible. A comparison prompt therefore records usage against all three
comparison keys.

## Implementation

### Provider migration

The OSS, Markdown, playground, and GitHub workloads retain their current OpenAI Chat Completions
wire format, streaming adapters, prompts, tools, and renderers. Their upstream changes from
OpenRouter to OpenUI Cloud's OpenAI-compatible endpoint:

```text
https://api.thesys.dev/v1/embed/chat/completions
```

The managed Cloud modes continue to use the Responses API through the OpenAI SDK with:

```text
https://api.thesys.dev/v1/embed
```

This keeps the distinction between the products visible in the demos:

- **OSS modes** still use the open-source component libraries, generated OpenUI Lang prompts, and
  local rendering.
- **Cloud modes** still use managed generation, Cloud storage, artifact rendering, and frontend
  tokens.
- Only the underlying LLM provider is unified.

### Trusted key selection

Key selection belongs to fixed server routes rather than a browser-supplied demo identifier:

| Workload         | Generation route                 | Token route                                |
| ---------------- | -------------------------------- | ------------------------------------------ |
| Chat OSS         | `/api/chat`                      | —                                          |
| Chat Cloud       | `/api/openui-cloud/chat`         | `/api/openui-cloud/frontend-token`         |
| Compare Markdown | `/api/compare/markdown`          | —                                          |
| Compare OSS      | `/api/compare/oss`               | —                                          |
| Compare Cloud    | `/api/openui-cloud/compare/chat` | `/api/openui-cloud/compare/frontend-token` |
| Playground       | `/api/playground/stream`         | —                                          |
| GitHub           | `/api/demo/github/stream`        | —                                          |

Shared handler code receives a hard-coded workload from these route entrypoints. It maps that
allowlisted workload to one environment variable in `lib/openui-cloud/config.ts`; request data
never contains a key name and cannot select an arbitrary environment variable.

There is no fallback to `THESYS_API_KEY` or another workload's key. If the selected key is missing,
the request fails closed with the existing unavailable response. There is no global feature flag:
every configured workload is always enabled.

### Model and behavior preservation

- Chat OSS and comparison Markdown/OSS remain fixed to `openai/gpt-5.4`.
- Managed Chat Cloud defaults to `openai/gpt-5.4` and retains its model switcher.
- The playground retains a three-model selector, server-allowlisted to Cloud catalog entries:
  Claude Sonnet 4.6, Gemini 3.1 Pro, and GPT-5.2.
- The GitHub demo keeps Claude Sonnet 4.6, with its model slug normalized to
  `anthropic/claude-sonnet-4.6`.
- Existing abort propagation, SSE response shapes, prompts, local tools, and component libraries
  remain in place. Chat Completions routes wait for the upstream connection before returning HTTP
  200 so pre-stream credit exhaustion still reaches the existing dialogs as a structured 402.
- OpenRouter-only attribution headers and error wording are removed.

## Deployment plan

1. Configure organization budgets, token scopes, and public-demo rate limits.
2. Create seven separately named OpenUI Cloud keys in the Cloud console.
3. Store them in the deployment using the exact `THESYS_API_KEY_DOCS_*` names in
   [`.env.example`](./.env.example). Never use `NEXT_PUBLIC_*`.
4. Deploy and smoke-test each workload before directing production traffic to it.
5. Confirm the Cloud usage dashboard attributes a test request to the expected key and no other
   key for each workload.

## Verification plan

Implementation validation completed from the repository root:

| Check                                       | Result                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| Prettier on changed source and plan files   | Pass                                                        |
| ESLint on changed TypeScript/TSX files      | Pass                                                        |
| `pnpm --filter @openuidev/docs types:check` | Pass                                                        |
| `pnpm --filter @openuidev/docs build`       | Pass; all seven generation routes are in the manifest       |
| Full docs `format:check`                    | Existing baseline failure in 54 untouched files             |
| Full docs `lint`                            | Existing baseline failure with 17 errors in untouched files |

With authorized test keys, manually verify:

1. `/chat` OSS streams OpenUI Lang rendered by the OSS library and charges only the chat-OSS key.
2. `/chat` Cloud streams a managed response, creates/loads a conversation, and charges only the
   chat-Cloud key.
3. One `/compare` prompt produces Markdown, OSS, and Cloud output and charges the three matching
   comparison keys.
4. `/demos` streams each selectable model into the code and preview panels and charges only the
   playground key.
5. `/demo/github` completes its client-side GitHub tool flow and charges only the GitHub key.
6. Stopping each stream aborts its upstream request.
7. Removing each key independently produces the fail-closed unavailable response for only that
   workload.

Static checks validate the implementation but cannot prove provider-side attribution; the Cloud
usage-dashboard checks are required before rollout.

## Explicitly out of scope

The runnable projects under `examples/` that are linked from tutorials are not hosted docs demos.
They intentionally accept user-supplied provider credentials and remain unchanged. Static code
snippets that teach self-hosting also remain provider-specific and unchanged. Migrating either
group would be a separate product/documentation change and would not improve hosted-demo usage
tracking.
