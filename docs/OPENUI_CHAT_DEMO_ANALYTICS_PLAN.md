# OpenUI Chat Demo Analytics Plan

Date: 2026-08-06
Scope: `/chat` OpenUI Cloud demo in `docs/`

## Objective

Measure the path from demo exposure to meaningful OpenUI Cloud use and upgrade intent:

`experience view -> curated exploration -> continuation -> prompt -> completed generation`

Use unique users for reach and conversion metrics. Use event counts only for repeat behavior such as preview switching or prompt volume.

## End-goal metrics

| Metric                  | Definition                                                | Denominator                                  |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Demo reach              | Unique users with `chat_demo:experience_view`             | Unique `/chat` visitors                      |
| Curated exploration     | Unique users with a featured thread or artifact view      | Demo reach                                   |
| Continuation conversion | Unique users with `chat_demo:continuation_create`         | Unique featured-thread viewers               |
| Deep activation         | Unique users with a successful `chat_demo:generation_end` | Demo reach, segmented by conversation origin |
| Preview switch rate     | Unique explicit switchers                                 | Viewers offered at least two previews        |
| Why-upgrade CTR         | Unique prompt clickers                                    | Unique users who saw the upgrade prompt      |
| Upgrade CTA CTR         | Unique upgrade CTA clickers                               | Unique prompt clickers                       |
| Navbar build intent     | Unique users who open the Build for free menu             | Demo reach                                   |

`generation_outcome=success` is the primary product activation. Prompt submission alone is intent, not success.

## Event contract

All properties are fixed enums or allowlisted identifiers. No content, thread IDs, request IDs, user IDs, URLs, or errors are captured.

| Event                            | When it fires                                  | Properties                                                      |
| -------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `chat_demo:experience_view`      | Once after the host breakpoint is known        | `host_breakpoint`, `available_preview_count`, `initial_preview` |
| `chat_demo:thread_view`          | A featured demo is selected                    | `demo_id`                                                       |
| `chat_demo:artifact_view`        | A bundled artifact detail opens                | `artifact_id`, `artifact_type`, optional `demo_id`              |
| `chat_demo:preview_change`       | A user explicitly chooses another preview      | `from_preview`, `to_preview`, `host_breakpoint`                 |
| `chat_demo:upgrade_prompt_view`  | Why upgrade is at least 50% visible            | none                                                            |
| `chat_demo:upgrade_prompt_click` | Why upgrade opens the sheet                    | optional `demo_id`                                              |
| `chat_demo:upgrade_cta_click`    | A Build for free link in the sheet is clicked  | `placement`, `destination`, optional `demo_id`                  |
| `chat_demo:build_menu_open`      | Navbar Build for free opens the CLI menu       | none                                                            |
| `chat_demo:continuation_create`  | A private demo continuation is created         | `demo_id`                                                       |
| `chat_demo:prompt_submit`        | A turn reaches the chat transport              | `conversation_origin`, `model`, optional `demo_id`              |
| `chat_demo:generation_end`       | The response completes, fails, or is cancelled | prompt properties plus `generation_outcome`                     |

Every custom event also carries `instrumentation_version` and `analytics_environment`.

## Semantic DOM tags

Use only `data-attribute-element`; state and placement belong in custom-event properties.

- `preview-option`
- `featured-demo`
- `continue-conversation`
- `new-chat`
- `composer-submit`
- `why-upgrade`
- `upgrade-cta`
- `build-for-free`

The two Build for free journeys are intentionally separate:

- Navbar `build-for-free` opens a CLI command menu and emits `chat_demo:build_menu_open`.
- Upgrade-sheet `upgrade-cta` opens the Cloud getting-started docs and emits `chat_demo:upgrade_cta_click`.
- The desktop and mobile upgrade-sheet links are responsive render variants of the same semantic CTA. They share the tag while the event records `placement`.

## Semantics and denominators

- Automatic preview coercion at responsive breakpoints does not count as a switch.
- The preview-switch denominator includes only viewers with `available_preview_count >= 2`.
- `upgrade_prompt_view` is visibility-based so collapsed sidebars and closed mobile drawers do not enter the CTR denominator.
- A continuation is counted only after the private thread is created successfully.
- Prompt submission is observed at the transport boundary so click, Enter, starter, and rendered-action paths are covered consistently.
- A generation succeeds only after the upstream SSE stream emits `response.completed`; failed, incomplete, aborted, and prematurely ended streams do not count as activation.
- Localhost capture is disabled. Vercel hosts are labeled `preview`; other non-local hosts are labeled `production`.

## Privacy

- Disable PostHog DOM autocapture on `/chat`; the custom event contract is canonical.
- Mask all replay text inside `.chat-agent-surface` so submitted prompts and generated responses are not recorded after rendering.
- Keep person profiles limited to identified users while anonymous unique-user and session counts continue to use PostHog identity semantics.
- Never capture prompts, responses, artifact contents, form values, arbitrary labels, raw storage IDs, full URLs, or exception text.

## Dashboard

Create one **OpenUI Chat Demo** dashboard with:

1. Demo reach, curated exploration, continuation conversion, and deep activation.
2. Featured demo and artifact popularity.
3. Preview switch rate and `from_preview -> to_preview` transitions.
4. Upgrade funnel: prompt view, prompt click, upgrade CTA click.
5. Navbar Build for free menu opens and existing CLI-copy conversion.
6. Prompt and generation outcomes split by `conversation_origin`, `demo_id`, and `model`.

Exclude internal/test traffic. Default conversion cards to unique users and record the exact denominator filters in every insight description.

## Validation

1. Verify the eight semantic tags are present on the intended controls, including responsive duplicates.
2. Confirm experience view fires once and automatic viewport coercion emits no switch.
3. Confirm the upgrade prompt is not counted while hidden and is counted once when visible.
4. Open all curated threads and artifacts and verify only allowlisted IDs leave the browser.
5. Continue a demo, submit multiple turns, and verify its origin remains `demo_continuation` after the first seeded request.
6. Verify successful, failed, cancelled, and prematurely closed streams emit one terminal event each.
7. Confirm localhost sends no chat-demo events and session replay masks chat surface text.
8. Run docs formatting, lint, typecheck, build, and `git diff --check`.
9. Verify production Live Events before creating dashboard insights.
