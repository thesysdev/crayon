# OpenUI Chat Demo Artifact Plan

Status: implemented and locally verified; PR push pending
Scope: PR [thesysdev/openui#924](https://github.com/thesysdev/openui/pull/924) and its Vercel preview
Date: 2026-08-05

## Outcome

Ship the updated OpenUI Cloud chat demo only after all of these are true:

1. The **Stock comparison** demo thread contains one working report artifact.
2. The **Blockbuster report** demo thread contains one working slides artifact.
3. The **Reports** tab contains exactly four curated reports.
4. The **Presentations** tab contains exactly four curated slide decks.
5. Every artifact opens and renders correctly, including the Blockbuster images.
6. **Continue conversation** works from a demo fork with Gemini, OpenAI, and Claude models.
7. The complete desktop, tablet, and mobile flow passes on the Vercel preview before merge or production deployment.

## Verified starting point

- PR #924 is open and currently mergeable.
- This checkout has been fast-forwarded to the PR's remote head, `5f1ff1fcd4ecc5856c34819628c4e834049b0019`.
- The latest PR head already replaces the old fixtures with **Stock comparison**, **Japan travel guide**, and **Blockbuster report**.
- The current `DemoConversation` type requires one embedded `artifact` for every conversation, and `DEMO_ARTIFACTS` is derived with `DEMO_CONVERSATIONS.map(...)`. That design limits the tabs to the three conversation-owned artifacts and makes tab-only artifacts awkward.
- Stock comparison currently produces a report. Blockbuster currently produces a report and must be changed to slides.
- The Blockbuster fixture currently hotlinks film images from multiple third-party hosts. These are more fragile than the Unsplash URLs in the Japan fixture and need an explicit asset pass.
- A continued demo is implemented as a private Cloud thread. Its first prompt sends the full fixture history once, then later prompts use normal stored Cloud history. This path must be reproduced with Claude before changing it; the current source alone does not establish the cause of the reported failure.

## Product decisions and assumptions

### Artifact counts

Treat “four reports in the Reports tab” and “four slides in the Presentations tab” as **four total in each tab**, including the artifacts linked from Stock comparison and Blockbuster report. This produces eight canonical artifacts, not ten duplicated artifacts.

If the intended count is four additional tab-only artifacts per type, the registry below will support it, but the acceptance count must be changed before content is added.

### Thread artifacts

Only two curated threads will end in an artifact for this iteration:

| Demo thread        | Linked artifact | Required tool/type                |
| ------------------ | --------------- | --------------------------------- |
| Stock comparison   | Report          | `thesys_generate_report` / report |
| Blockbuster report | Slides          | `thesys_generate_slides` / slides |

The thread title **Blockbuster report** can remain unchanged even though its linked artifact is slides, unless the supplied final content includes a replacement title.

### Source content

The updated content supplied by the team is authoritative. I will preserve its approved facts, wording, order, and visual intent, then make only the structural changes required for valid OpenUI Lang, artifact metadata, image delivery, and responsive rendering.

## Implementation plan

### Phase 1: Inventory and baseline the live PR

1. Confirm the checkout still matches the PR head before editing and fast-forward again only if the PR moves.
2. Recheck PR mergeability and compare the PR head with the latest `thesysdev/openui:main` so fixes are built on the code that will actually deploy.
3. Record the eight-artifact content matrix before coding:
   - stable artifact ID;
   - title;
   - report/slides type;
   - linked demo thread, if any;
   - source program;
   - image and source URLs;
   - display order in its tab.
4. Confirm that the supplied content has four entries of each type and identify any missing programs or assets immediately.

### Phase 2: Decouple tab artifacts from demo conversations

Refactor `docs/app/chat/_components/demo-conversations.ts` so artifacts are a canonical registry rather than a side effect of the conversation list.

1. Define `DEMO_ARTIFACTS` directly with eight stable, unique artifacts: four reports and four slides.
2. Replace the required embedded `DemoConversation.artifact` with an optional `linkedArtifactId` or equivalent reference.
3. Resolve a thread's artifact from the canonical registry. Do not duplicate the artifact program in a second record.
4. Keep `createDemoConversationStorage(...)` responsible for merging the eight read-only fixtures into Cloud artifact results while preserving Cloud-owned artifacts and pagination behavior.
5. Keep demo artifact `get(...)` support and reject `update(...)` for demo IDs so the examples remain immutable.
6. Add development-time registry validation for:
   - exactly four reports and four slides;
   - unique artifact and conversation IDs;
   - valid linked thread/artifact references;
   - valid artifact type, tool name, carrier header, and thread ID pairing;
   - only Stock comparison and Blockbuster report containing artifact turns.
7. Do not introduce a new test framework or package dependency for this content validation.

Expected primary files:

- `docs/app/chat/_components/demo-conversations.ts`
- `docs/app/chat/_components/demo-conversation-storage.ts`
- `docs/app/chat/_components/demo-aware-chat-controls.tsx`, only if continuation metadata must change

### Phase 3: Add the final report and slides content

1. Replace Stock comparison's final artifact turn with the approved report program and metadata.
2. Convert Blockbuster's final artifact from report to slides:
   - use a `SlideShow(...)` program;
   - emit `thesys_generate_slides`;
   - use `artifact_type: "slides"` and `type: "slides"` consistently;
   - use a matching `openui:artifact` carrier header;
   - update the assistant copy from “Report ready” to “Presentation ready.”
3. Add the remaining tab-only artifacts until each category has exactly four entries.
4. Preserve a deterministic display order rather than relying on object/map iteration or Cloud response order.
5. Ensure tab-only artifacts do not appear as synthetic conversations in the sidebar.

### Phase 4: Fix and harden Blockbuster image delivery

1. Build an image manifest from every URL in the supplied Blockbuster thread and slides program.
2. Check each URL for:
   - successful HTTPS response;
   - an image content type;
   - no login, anti-hotlink, expiring query, or redirect dependency;
   - acceptable dimensions and crop behavior;
   - permission to use the asset in the demo.
3. Prefer approved, checked-in assets under `docs/public/chat-demo/blockbuster/` over third-party hotlinks. This makes the Vercel preview and production render deterministic.
4. Update both inline thread cards and slides to use the same canonical asset paths where appropriate.
5. Retain meaningful alt text and verify that a failed asset cannot collapse the surrounding card or slide layout.
6. Check the browser network panel on the deployed preview for image 4xx/5xx responses and mixed-content warnings.

### Phase 5: Diagnose and fix Claude continuation

Reproduce first, then make the narrowest provider-neutral fix.

1. On a fresh user ID, open Stock comparison, select **Continue conversation**, choose a Claude model, and send a short follow-up.
2. Capture the sanitized request/response shape and server error without logging API keys, prompts, artifact contents, or user identifiers.
3. Check these likely boundaries in order:
   - full-history conversion by `openAIConversationMessageFormat`;
   - valid pairing and ordering of fixture tool calls and tool outputs;
   - the route's 16-item input limit;
   - duplicate seed content between thread creation and the first full-history request;
   - whether the fork is marked seeded when headers succeed but the streamed response later fails;
   - Cloud conversation state after retry or refresh.
4. Keep one history format for Gemini, OpenAI, and Claude unless the Cloud API explicitly requires a provider-specific difference.
5. Mark a fork as seeded only after the Cloud request has reached a reliable success point. A failed Claude stream must remain retryable with the complete fixture history.
6. Repeat the same test from Blockbuster so a seeded slides tool result is also valid for Claude.

Expected primary files if a code fix is required:

- `docs/lib/openui-cloud/chat-llm.ts`
- `docs/app/api/openui-cloud/chat/route.ts`
- `docs/app/chat/_components/demo-fork-registry.ts`

### Phase 6: Full pre-deployment flow verification

Run static checks from the correct `docs` working directory, then verify the built PR preview rather than relying only on localhost.

#### Static gates

- focused Prettier check;
- focused ESLint for changed chat and Cloud files;
- docs TypeScript check;
- `git diff --check`;
- no secrets or temporary keys in the staged diff.

#### Browser gates

- Sidebar shows the three curated demo threads and no removed type/turn badges.
- Opening a demo makes no generation request and keeps the source read-only.
- Stock comparison ends with a report that opens from the thread.
- Blockbuster report ends with slides that open from the thread.
- Reports tab shows exactly four unique reports; all four open and render.
- Presentations tab shows exactly four unique decks; all four open and render.
- Tab-only artifacts do not create sidebar threads.
- All Blockbuster and other supplied images load with no broken placeholders.
- Continue conversation creates a private thread, preserves the source demo, and accepts multiple turns.
- Provider matrix passes with at least one representative model from Google, OpenAI, and Anthropic; Claude must include both the Stock and Blockbuster seeded histories.
- Refresh before the first continuation prompt preserves the unseeded fork; refresh after a successful prompt loads Cloud history normally.
- Deleting a private continuation does not delete or mutate its source demo.
- Mobile, tablet, and desktop checks cover 767, 768, 1023, and 1024 px boundaries.
- Navbar, model switcher, artifact viewer, sidebar drawer, and continue CTA remain usable at each supported width.
- New chat, normal prompt submission, Reports/Presentations navigation, and Build for free remain unaffected.

#### Deployment gate

1. Push only after local static and browser checks pass.
2. Wait for the Vercel preview and GitHub checks to complete.
3. Repeat the artifact counts, image checks, and provider continuation smoke tests on the exact preview URL for the final commit.
4. Recheck mergeability against current `main`.
5. Do not merge or deploy to production until the preview checklist is recorded as passing and the user gives approval.

## Local verification result

- The canonical registry contains four reports and four slide decks, with only Stock comparison and Blockbuster report linked to thread artifacts.
- All eight artifacts open and render with the installed Thesys artifact renderers.
- The Blockbuster thread uses working HTTPS image URLs with image content types.
- Both required seeded histories—Stock report and Blockbuster slides—continued successfully with Claude Sonnet 5 using a temporary, process-only OpenUI Cloud key.
- Responsive controls pass the 767, 768, 1023, and 1024 px visibility boundaries.
- Focused Prettier, ESLint, TypeScript, and whitespace checks pass.

The remaining gate is to push the implementation, wait for the updated Vercel preview, and repeat the preview smoke test before merge or production deployment.
