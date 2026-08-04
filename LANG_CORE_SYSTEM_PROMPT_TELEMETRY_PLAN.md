# Lang Core `generateSystemPrompt` Telemetry Plan

## Decision summary

Add server-only, first-use telemetry to the canonical
`generateSystemPrompt()` API in `@openuidev/lang-core`.

The design has four hard boundaries:

1. **Never send from a browser or browser worker.**
2. **Never send for every function call or user request.** Emit at most once
   per distinct system-prompt configuration hash in a server runtime/process,
   after that configuration's first successful `generateSystemPrompt()` call.
3. **Send directly to the PostHog regional ingestion host.**
4. **Use the SDK request's transport IP.** Do not accept or forward a chat
   user's IP or request headers from the application.

The client event is:

```text
lang_core_system_prompt_generation_used
```

It measures adoption of the system-prompt generator and distinct prompt
configuration shapes. It does not measure user requests, installations, page
views, or active users.

## Why this design

This plan applies established telemetry design and privacy constraints:

| Finding                                                                                                | Design applied to OpenUI                                                                                                                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Install hooks count dependency installation, CI churn, and abandoned experiments rather than real use. | Do not add `postinstall` telemetry or Scarf to Lang Core. Emit only after the API actually produces a prompt.                                          |
| A factory or top-level call may execute during framework build-time module evaluation.                 | Describe this as a system-prompt-generation event, not proof of production traffic. Track coarse execution context and CI separately.                  |
| A small `fetch` client avoids embedding a product analytics SDK.                                       | Keep the Lang Core client dependency-free and call the fixed PostHog regional capture endpoint directly.                                               |
| Transport metadata is safer than caller-supplied network fields.                                       | Let PostHog observe the SDK connection's source IP; never accept chat-user IPs or forwarded headers through the Lang Core API.                         |
| Raw error messages and broadly spread objects create content-leak risks.                               | Use a strict allowlist; do not send errors, spec objects, prompt content, or arbitrary properties.                                                     |
| Stable hashes make telemetry pseudonymous and correlatable.                                            | Keep the runtime ID memory-only, document the configuration/project hashes as guessable, and disable PostHog person-profile processing for this event. |
| Split opt-outs across runtime, browser, and install channels are difficult to reason about.            | Respect the existing `DO_NOT_TRACK` and `OPENUI_TELEMETRY_DISABLED` switches, plus a per-call option. No browser or install channel exists.            |

## Goals

- Measure whether `generateSystemPrompt()` is used in real server execution.
- Understand adoption by Lang Core version, runtime, execution environment,
  tool-count bucket, and coarse prompt configuration.
- Distinguish multiple library/tool configurations used in one runtime without
  sending raw library IDs, schemas, or descriptions.
- Approximate which Node.js runtimes belong to the same project without sending
  a raw repository origin or working directory.
- Allow PostHog to process the server/build runner's direct transport IP.
- Avoid request-proportional event volume.
- Keep the generated prompt byte-for-byte unchanged.
- Ensure telemetry can never throw, block, or materially delay prompt
  generation.
- Publish the exact event schema, PostHog destination, transport-IP behavior,
  and opt-out controls.

## Non-goals

- Browser, browser-worker, page-view, click, renderer, or user-interaction
  telemetry.
- Per-chat-request or per-LLM-call telemetry.
- Measuring exact unique users, applications, repositories, or installations.
- Collecting chat-user IPs, forwarded request headers, cookies, authentication,
  or end-user identifiers.
- Collecting prompts, messages, completions, OpenUI Lang output, tool
  arguments/results, model/provider names, or token usage.
- Adding telemetry to `library.prompt()`, the deprecated `generatePrompt()`,
  parsing, rendering, or reactive runtime APIs.
- Adding install-time telemetry.

## Trigger and frequency

### Client-side trigger

Emit after the first successful `generateSystemPrompt()` call for a distinct
system-prompt configuration hash in a recognized server runtime.

Use a versioned `globalThis` symbol or equivalent process-wide state containing:

```ts
{
  runtimeInstanceId: string;
  reservedConfigKeys: Set<string>;
}
```

Required behavior:

- Compute a versioned system-prompt configuration hash after successful prompt
  generation.
- Reserve an in-memory key for the canonical configuration projection before
  starting asynchronous hashing/transport so concurrent calls for the same
  configuration cannot race.
- Allow one event per distinct configuration hash, up to a hard cap of 16 hashes
  per runtime.
- Skip additional unseen configurations after the cap rather than letting
  request-created dynamic tool configurations produce unbounded telemetry.
- Share the marker across ESM, CJS, and duplicate module instances.
- Do not add a configuration when prompt generation throws.
- Do not retry in the same runtime if delivery fails.
- Do not persist the marker or runtime ID to disk, cache, cookies, or local
  storage.

### Does this run for every user request?

No.

- In the current self-hosted template, `generateSystemPrompt()` is inside the
  `POST` handler. Only the first successful request for each distinct prompt
  configuration in a server runtime can send; later calls for that
  configuration are suppressed.
- If the prompt is generated at module scope, the event can occur during module
  initialization.
- If a framework evaluates that module during `build`, the event can be a
  build/CI signal before production traffic exists.
- Each new process, worker, Edge isolate, or cold start has fresh in-memory
  client state and may send once again for each distinct prompt configuration.

If OpenUI later needs request analytics, add a separate, explicitly sampled
request-boundary event. Do not infer request volume from this event.

## Runtime eligibility

Telemetry is allowed only when the client can positively identify a server
runtime:

- Node.js
- Bun
- Deno
- Recognized server-side Edge runtimes

Fail closed:

- browser window: skip;
- service/shared/dedicated browser worker: skip;
- React Native or another client runtime: skip;
- ambiguous or unknown runtime: skip;
- server runtime without `fetch`: skip.

The package must remain importable and functional in all current environments.
Only the telemetry branch is server-restricted.

## Client event contract

### Event envelope

The Lang Core package maps this allowlisted envelope into a PostHog capture
request sent directly to `https://us.i.posthog.com/capture/`:

| Property                            | Type / values                                             | Purpose                                                                                                               |
| ----------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `event`                             | `"lang_core_system_prompt_generation_used"`               | Stable event name.                                                                                                    |
| `event_id`                          | random UUID                                               | Event correlation and troubleshooting; generated per attempted first-use event.                                       |
| `telemetry_schema_version`          | `1`                                                       | Allows explicit schema migration.                                                                                     |
| `sent_at`                           | ISO timestamp                                             | Client attempt time.                                                                                                  |
| `runtime_instance_id`               | random UUID, memory-only                                  | Supplies the required PostHog `distinct_id` without creating a persistent installation ID or person profile.          |
| `system_prompt_config_hash_version` | `1`                                                       | Versions the canonical configuration projection and hash algorithm.                                                   |
| `system_prompt_config_hash`         | SHA-256 hex digest                                        | Stable digest for one structural library/tool/prompt-mode configuration; details below.                               |
| `project_hash_version`              | `1`, Node.js only                                         | Versions repository-source normalization and hashing.                                                                 |
| `project_hash`                      | SHA-256 hex digest, omitted when unavailable              | Best-effort grouping for runtimes from the same project without combining project identity with prompt configuration. |
| `tool_count_bucket`                 | `"0"`, `"1-3"`, `"4-15"`, `"16-63"`, or `"64+"`           | Measures coarse tool adoption using powers-of-four ranges without sending exact counts.                               |
| `sdk_name`                          | `"@openuidev/lang-core"`                                  | Fixed SDK identity.                                                                                                   |
| `sdk_version`                       | package semver                                            | Measures version adoption; injected at build time.                                                                    |
| `api_surface`                       | `"generate_system_prompt"`                                | Leaves room for separately approved future APIs.                                                                      |
| `input_shape`                       | `"library_spec"` or `"legacy_prompt_spec"`                | Distinguishes the recommended and deprecated overloads.                                                               |
| `runtime`                           | `"node"`, `"bun"`, `"deno"`, or recognized `"edge"` value | Server runtime family.                                                                                                |
| `runtime_version`                   | full runtime-reported version string or omitted           | Measures runtime-version adoption and supports version-specific compatibility analysis.                               |
| `environment`                       | `"production"`, `"development"`, `"test"`, or `"unknown"` | Coarse `NODE_ENV`-style execution context.                                                                            |
| `ci`                                | boolean                                                   | Separates likely build/CI execution from other execution.                                                             |
| `telemetry_mode`                    | `"server_runtime_prompt_config_first_use"`                | Makes per-configuration first-use frequency explicit in queries.                                                      |

Do not spread `SystemPromptSpec`, `PromptSpec`, prompt options, environment
objects, or errors into the payload. Construct the event from an explicit type
and property allowlist.

## System-prompt configuration hash

### Recommendation

Use `system_prompt_config_hash` when one runtime may use multiple component
libraries or tool configurations. It is a configuration hash only; do not use
it as a user, company, installation, or deployment identifier.

The hash answers:

> Has this runtime already reported this structural prompt configuration?

It does not answer:

> Is this the same customer or deployment?

### Canonical configuration hash v1

Build a deterministic canonical projection containing:

- root component name;
- component names sorted lexicographically;
- each component's generated signature and description;
- component groups sorted by name, with sorted membership and declared notes;
- tool configuration:
  - exact string tool descriptors;
  - for structured `ToolSpec` values: tool name, description, canonical
    input/output JSON Schemas, and bounded annotations;
  - tools sorted by their canonical representation so declaration order alone
    does not change the hash;
- resolved `toolCalls`, `bindings`, `editMode`, and `inlineMode` booleans;
- custom preamble, examples, tool examples, and additional rules, preserving
  order where order affects the generated prompt.

Explicitly exclude:

- library `id`;
- library/component JSON Schema bodies beyond the generated component
  signatures;
- built-in prompt text that is not caller configuration;
- generated prompt output;
- renderer/component implementations.

Canonicalize the projection with stable key ordering and hash:

```text
SHA-256("openui-system-prompt-config-v1\0" + canonical_json)
```

Send only the digest and `system_prompt_config_hash_version=1`. Derive
`tool_count_bucket` from the merged prompt configuration as:

| Exact count  | Bucket    |
| ------------ | --------- |
| `0`          | `"0"`     |
| `1`–`3`      | `"1-3"`   |
| `4`–`15`     | `"4-15"`  |
| `16`–`63`    | `"16-63"` |
| `64` or more | `"64+"`   |

Use `globalThis.crypto.subtle.digest` so Node, Bun, Deno, and Edge can share the
same asynchronous SHA-256 implementation without importing `node:crypto`.
Reserve the canonical configuration's in-memory key before awaiting the digest
so concurrent calls remain deduplicated. Never log, persist, or transmit the
canonical JSON. If Web Crypto is unavailable, skip telemetry rather than
adding a runtime dependency or changing prompt behavior.

Tool sets and prompt-mode options may change per request, so the same component
library can intentionally produce multiple configuration hashes. The
once-per-hash runtime marker and 16-configuration cap bound network volume.
This event measures configuration first use, not configuration frequency.

Library `id` is excluded because it may contain company, product, tenant, or
project names and is not prompt configuration. Component names, signatures,
descriptions, tool definitions, preambles, examples, and rules inside the
canonical projection may be guessable for known configurations, so the digest
must be disclosed and treated as pseudonymous.

## Project hash

On Node.js only, derive a best-effort `project_hash` from local Git
`remote.origin.url`, then `REPOSITORY_URL`, then the current working directory.
Normalize Git URL/SCP forms by removing credentials, protocol, trailing `.git`,
and trailing slashes, then hash:

```text
SHA-256("openui-project-v1\0" + normalized_project_source)
```

Send only the digest and `project_hash_version=1`. Never send the raw source.
Keep this separate from `system_prompt_config_hash`: a project may report
multiple prompt configurations. The deterministic hash lets horizontally
scaled runtimes converge when repository metadata is identical, but path
fallbacks can differ across deployments and known repositories can be guessed.
Omit the fields when the source cannot be read and do not discover repository
metadata in Bun, Deno, Edge, or browser runtimes.

PostHog dashboards may map known OpenUI-provided configuration hashes to
bounded labels such as `openui_standard` or `openui_chat`. Unknown/custom
hashes remain opaque and must not be reverse-looked-up.

## PostHog transport

Send a dependency-free PostHog capture request to the capture path exposed by:

```text
https://us.i.posthog.com/capture/
```

This is the fixed PostHog regional ingestion endpoint used by the existing
OpenUI telemetry project.

The PostHog request contains:

```json
{
  "api_key": "<public PostHog project token>",
  "event": "lang_core_system_prompt_generation_used",
  "properties": {
    "distinct_id": "<runtime_instance_id>",
    "$process_person_profile": false
  }
}
```

Map `event` to the top-level PostHog event name, `sent_at` to the top-level
timestamp, and `runtime_instance_id` to `properties.distinct_id`. Add every
other allowlisted envelope property under `properties`. The project token is a
public ingestion token, not a personal PostHog API key or secret.

Client transport requirements:

- dependency-free server-side `fetch`;
- JSON request body with a strict size cap;
- package/version-bearing transport User-Agent where the runtime permits it;
- `keepalive` where supported;
- short timeout;
- no retry;
- all errors swallowed;
- no cookies, authorization headers, personal API keys, or secrets.

Do not include `$ip`, a chat-user IP, or application request headers in the
JSON payload. Verify in staging that PostHog observes the SDK server's direct
transport IP and applies the expected project-level GeoIP processing.

## Identity model

This telemetry is **pseudonymous telemetry**, not anonymous telemetry.

| Identifier                  | Persistence                                              | Use                                                                                                           |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event_id`                  | One attempted event                                      | Event correlation and troubleshooting.                                                                        |
| `runtime_instance_id`       | In memory for one server runtime                         | PostHog `distinct_id` and diagnosis of client first-use behavior; person-profile processing remains disabled. |
| `system_prompt_config_hash` | Stable for one canonical structural prompt configuration | Distinguish library/tool/mode configurations and suppress repeated reporting within a runtime.                |
| `project_hash`              | Stable for a normalized repository source when available | Approximate grouping across Node.js processes, pods, and cold starts from the same project.                   |
| Transport source IP         | Observed by PostHog from the direct connection           | PostHog GeoIP processing according to project configuration.                                                  |

Do not create:

- a filesystem installation ID;
- a persistent browser/local-storage ID;
- a project identifier derived from package name, cloud metadata, or library ID;
- a hash of an API key, IP address, or library ID;
- a customer/license identity alias;
- an email enrichment or person profile.

If authenticated OpenUI products later need account-attributed telemetry, add a
separate explicitly documented event and identifier. Do not silently join it
onto this OSS event.

## Data that must never be sent

- Generated system-prompt content or exact prompt text
- Raw or hashed library ID; the separately defined structural
  `system_prompt_config_hash` is the only approved configuration identifier
- Root, component, component-group, prop, or schema names
- Component signatures, descriptions, or JSON Schema
- Tool names, descriptions, schemas, arguments, or results
- Preamble, examples, tool examples, or additional-rule text
- Source files, output files, raw filesystem paths, raw repository or Git
  remote values, branch, commit, or package dependency inventory. Only the
  separately defined `project_hash` may be derived from repository metadata.
- Chat-user IP, request headers, cookies, authorization, personal API keys,
  secrets, license tokens, email, account IDs, or tenant IDs
- Prompts, messages, completions, OpenUI Lang output, model/provider names, or
  token usage
- Error messages, stack traces, error objects, URLs, or arbitrary caller
  properties
- Full OS release, hostname, CPU model, or memory

## Controls

### Opt-out

Disable capture when any condition is true:

- `{ telemetry: false }` is passed as the runtime-only second argument;
- `DO_NOT_TRACK=1` or `DO_NOT_TRACK=true`;
- `OPENUI_TELEMETRY_DISABLED=1` or
  `OPENUI_TELEMETRY_DISABLED=true`;
- `NODE_ENV=test`, unless an isolated telemetry test explicitly enables its
  mock transport;
- browser/client/unknown runtime;
- the PostHog project token or capture URL is absent from the package
  build.

Proposed API:

```ts
const prompt = generateSystemPrompt(
  {
    library: librarySpec,
    promptOptions,
  },
  { telemetry: false },
);
```

Export:

```ts
interface GenerateSystemPromptRuntimeOptions {
  telemetry?: boolean;
}
```

Keep runtime options outside `SystemPromptSpec` so telemetry configuration is
not serialized into library specs or confused with LLM instructions.

## Implementation plan

### Lang Core package

Create `packages/lang-core/src/telemetry.ts`:

- server-runtime detection that fails closed;
- environment/CI classification into bounded enums;
- process-wide per-configuration first-use set and runtime UUID;
- canonical system-prompt configuration hash v1 and a 16-configuration runtime
  cap;
- Node-only best-effort repository project hash v1;
- tool-count bucketing;
- explicit payload type and builder;
- opt-out behavior;
- direct PostHog capture `fetch`, with timeout and swallowed errors.

Update `packages/lang-core/src/parser/prompt.ts`:

1. Generate the prompt using existing behavior.
2. After success, call a telemetry helper with the merged spec,
   input-shape classification, and runtime options.
3. The helper determines eligibility and first-use status.
4. Return the original prompt without awaiting transport.

Keep `generatePrompt()` and `Library.prompt()` uninstrumented. This avoids
double-counting the CLI, whose worker currently uses `library.prompt()`.

Update `packages/lang-core/src/index.ts`:

- export `GenerateSystemPromptRuntimeOptions`;
- do not export internal transport helpers.

Update `packages/lang-core/tsdown.config.ts`:

- inject package name/version at build time;
- inject the public PostHog project token and regional capture URL;
- provide deterministic values to tests;
- avoid runtime filesystem or package-JSON reads.

No new runtime dependency should be added to `@openuidev/lang-core`.

### Existing CLI

The CLI already emits `cli_generate_started` and `cli_generate_succeeded`.

- Keep CLI telemetry separate.
- `openui generate` continues to use `library.prompt()` and does not produce the
  Lang Core first-use event.
- If the CLI later calls `generateSystemPrompt()`, pass
  `{ telemetry: false }` and add a regression test.
- Continue honoring `--no-telemetry`, `DO_NOT_TRACK`, and
  `OPENUI_TELEMETRY_DISABLED`.

## Documentation plan

| File                                               | Change                                                                                                                                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/lang-core/README.md`                     | Replace deprecated `generatePrompt()` examples with `generateSystemPrompt()`. Add the complete telemetry disclosure, server-only/first-use semantics, direct PostHog destination, transport-IP behavior, and opt-outs. |
| `README.md`                                        | Add a concise repository-level disclosure covering CLI and Lang Core telemetry, linking to the package README and privacy policy.                                                                                      |
| `docs/content/docs/openui-lang/system-prompts.mdx` | Add a "Telemetry and privacy" section alongside the canonical API, including why it can occur at build/module initialization and how to opt out.                                                                       |
| `packages/openui-cli/README.md`                    | Clarify that CLI events and direct Lang Core first-use telemetry are separate and not double-counted.                                                                                                                  |
| Release notes                                      | Announce the new network side effect, direct PostHog destination, transport-IP behavior, and opt-out before publishing.                                                                                                |

The npm package README is the primary disclosure because it ships with Lang
Core. Other docs should link to the same canonical field list rather than
maintaining divergent paraphrases.

## Test plan

### Lang Core unit tests

- The first eligible successful call for each distinct prompt configuration
  emits one event.
- Repeated and concurrent calls for the same configuration hash emit nothing
  further.
- Different configuration hashes may each emit once, up to the cap of 16 per
  runtime.
- Calls after the 16-configuration cap emit nothing.
- ESM/CJS or simulated duplicate module instances share the marker.
- A failed first call does not consume first-use eligibility.
- A fresh simulated runtime may emit once.
- Browser window, browser worker, React Native-like, and unknown runtimes never
  invoke transport.
- Node, Bun, Deno, and recognized Edge tests classify correctly.
- `{ telemetry: false }`, both environment opt-outs, and test mode suppress
  transport.
- The PostHog capture body contains only the required transport fields and
  allowlisted event properties.
- `$process_person_profile` is always `false`.
- Canonical configuration hashing is independent of object insertion order.
- Library IDs, library/component JSON Schema bodies beyond generated
  signatures, and renderer implementations do not change the hash.
- Reordering otherwise identical tools does not change the hash.
- Root, component name/signature/description, group membership/notes, string
  tool descriptor, structured tool name/description/schema/annotations,
  resolved prompt-mode flag, custom preamble, example, or rule changes do
  change the hash.
- Tool counts map correctly to `"0"`, `"1-3"`, `"4-15"`, `"16-63"`, and
  `"64+"`.
- Missing Web Crypto skips telemetry without throwing.
- Canonical projection JSON never appears in transport.
- Equivalent HTTPS and SCP-style repository origins produce the same project
  hash, while the raw origin or working directory never appears in transport.
- Unique sentinel strings placed in library IDs, component/tool names,
  descriptions, schemas, examples, rules, paths, environment values, and errors
  never appear in serialized telemetry.
- Missing `fetch`, synchronous errors, rejected requests, timeouts, and non-2xx
  responses never throw or change prompt output.
- `generatePrompt()` and `library.prompt()` emit nothing.
- Prompt output is byte-for-byte identical with telemetry enabled, disabled,
  and offline.

### PostHog validation

- Verify a staging event reaches the fixed regional capture endpoint.
- Verify it receives the expected PostHog GeoIP properties for the SDK server's
  direct transport IP.
- Verify the event does not create or update a PostHog person profile.

### Package validation

Run:

```bash
pnpm --filter @openuidev/lang-core test
pnpm --filter @openuidev/lang-core typecheck
pnpm --filter @openuidev/lang-core lint:check
pnpm --filter @openuidev/lang-core format:check
pnpm --filter @openuidev/lang-core build
pnpm --filter @openuidev/lang-core check:publint
pnpm --filter @openuidev/lang-core check:attw
```

Also inspect packed ESM/CJS and a browser bundle:

- importing the package creates no request;
- browser calls create no request;
- server calls create at most one request per distinct prompt configuration per
  runtime, capped at 16;
- no Node-only module or PostHog SDK enters the browser bundle;
- tests and CI mock `fetch` and never contact the production PostHog host.

## Rollout

1. Approve the exact PostHog capture schema.
2. Configure the PostHog project, public project token, and person-profile
   behavior.
3. Validate payload delivery and transport-IP/GeoIP behavior with a
   non-production PostHog project.
4. Release as a minor version because the API gains an observable network side
   effect.
5. Publish README/docs/privacy/release-note changes before or with the package.
6. Monitor capture volume, cold-start volume, and PostHog delivery failures.
7. Review every property after 30 days and remove fields not supporting a
   defined decision.

Do not add client sampling initially: the per-runtime configuration cap bounds
client volume. If volume still requires sampling, reduce the configuration cap
or add a versioned deterministic client-sampling policy with published
`sample_rate`/`sample_weight` properties.

## Dashboard semantics

Approved metrics:

- server-runtime prompt-configuration first-use signals;
- distinct system-prompt configuration hashes;
- distinct project hashes, treated as approximate projects rather than users;
- tool-count bucket distribution;
- Lang Core version adoption;
- server runtime and execution-environment distribution;
- PostHog GeoIP distributions when available.

Do not label these as:

- users;
- monthly active users;
- installations;
- applications;
- organizations or companies;
- production user requests.

## Acceptance criteria

- No browser or unknown-runtime telemetry is possible.
- Only the first successful call for each distinct system-prompt configuration
  per server runtime attempts transport, capped at 16.
- The package sends only to `https://us.i.posthog.com/capture/`.
- PostHog receives the SDK server/build runner's direct transport IP, not a
  chat-user IP supplied by the application.
- No chat-user IP or application request header is accepted by the Lang Core
  API.
- Prompt output and synchronous behavior are unchanged.
- Telemetry and PostHog failures never affect consumers.
- The payload is strictly allowlisted and contains none of the prohibited data.
- Opt-out behavior works and is documented.
- No persistent client ID, install hook, browser storage, raw error, dependency
  inventory, or vendor SDK is introduced.
- Raw repository origins and working directories are never transmitted; only
  the documented Node.js `project_hash` digest is allowed.
- Package docs, root docs, website docs, CLI docs, privacy policy, and release
  notes are consistent.
