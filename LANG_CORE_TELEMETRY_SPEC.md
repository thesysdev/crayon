# Lang Core Telemetry — Simplified Spec

This is the implementation-facing telemetry contract for
`@openuidev/lang-core` `generateSystemPrompt()`.

For rationale and rollout details, see
[`LANG_CORE_SYSTEM_PROMPT_TELEMETRY_PLAN.md`](./LANG_CORE_SYSTEM_PROMPT_TELEMETRY_PLAN.md).

## Destination

Send capture requests directly to the PostHog ingestion endpoint:

```text
https://us.i.posthog.com/capture/
```

The regional PostHog capture URL and public PostHog project token are compiled
into the package.

The package must not:

- send from a browser or browser worker;
- send to another hostname;
- include `$ip` or application request headers in the JSON body;
- include a chat user's IP address.

The direct connection exposes the SDK server/build runner's transport IP to
PostHog so it can apply its configured GeoIP processing.

## When an event is sent

Event name:

```text
lang_core_system_prompt_generation_used
```

Send after the first successful `generateSystemPrompt()` call for a distinct
`system_prompt_config_hash` in a server runtime.

- Send once per distinct configuration hash per runtime.
- Allow at most 16 distinct configuration hashes per runtime.
- Suppress repeated and concurrent calls for the same configuration.
- A new process, pod, worker, Edge isolate, or serverless cold start has fresh
  in-memory state and may send again.
- Do not retry a failed delivery.
- Never block or change prompt generation.

Disable capture for browsers, unknown runtimes, `NODE_ENV=test`,
`{ telemetry: false }`, `DO_NOT_TRACK=1|true`, or
`OPENUI_TELEMETRY_DISABLED=1|true`.

## PostHog capture fields

PostHog transport fields:

| Field                                | Value                                                  |
| ------------------------------------ | ------------------------------------------------------ |
| `api_key`                            | Public PostHog project token compiled into the package |
| `event`                              | `"lang_core_system_prompt_generation_used"`            |
| `timestamp`                          | Event creation time as an ISO timestamp                |
| `properties.distinct_id`             | Random, memory-only runtime UUID                       |
| `properties.$process_person_profile` | `false`                                                |

Allowlisted event properties:

| Property                            | Type / values                                               |
| ----------------------------------- | ----------------------------------------------------------- |
| `event_id`                          | Random UUID generated for the attempted event               |
| `telemetry_schema_version`          | `1`                                                         |
| `system_prompt_config_hash_version` | `1`                                                         |
| `system_prompt_config_hash`         | SHA-256 hex digest                                          |
| `project_hash_version`              | `1`, omitted outside Node.js                                |
| `project_hash`                      | Repository-derived SHA-256 digest, omitted when unavailable |
| `tool_count_bucket`                 | `"0"`, `"1-3"`, `"4-15"`, `"16-63"`, or `"64+"`             |
| `sdk_name`                          | `"@openuidev/lang-core"`                                    |
| `sdk_version`                       | Full package semver                                         |
| `api_surface`                       | `"generate_system_prompt"`                                  |
| `input_shape`                       | `"library_spec"` or `"legacy_prompt_spec"`                  |
| `runtime`                           | `"node"`, `"bun"`, `"deno"`, or recognized Edge value       |
| `runtime_version`                   | Full runtime-reported version, or omitted                   |
| `environment`                       | `"production"`, `"development"`, `"test"`, or `"unknown"`   |
| `ci`                                | Boolean                                                     |
| `telemetry_mode`                    | `"server_runtime_prompt_config_first_use"`                  |

Example:

```json
{
  "api_key": "<public-project-token>",
  "event": "lang_core_system_prompt_generation_used",
  "timestamp": "2026-07-28T12:00:00.000Z",
  "properties": {
    "distinct_id": "17d34d28-c641-4407-9eec-5ed94048744b",
    "$process_person_profile": false,
    "event_id": "31d6a17b-45dc-4740-930a-3f92de09e680",
    "telemetry_schema_version": 1,
    "system_prompt_config_hash_version": 1,
    "system_prompt_config_hash": "<sha256-hex>",
    "project_hash_version": 1,
    "project_hash": "<sha256-hex>",
    "tool_count_bucket": "4-15",
    "sdk_name": "@openuidev/lang-core",
    "sdk_version": "1.2.3",
    "api_surface": "generate_system_prompt",
    "input_shape": "library_spec",
    "runtime": "node",
    "runtime_version": "24.4.1",
    "environment": "production",
    "ci": false,
    "telemetry_mode": "server_runtime_prompt_config_first_use"
  }
}
```

Do not add arbitrary spec properties, prompt content, component/tool names,
schemas, descriptions, examples, rules, errors, paths, credentials, account
identifiers, or request metadata to the capture body.

## Tool count bucket

Count both string tools and structured `ToolSpec` tools:

| Exact tool count | `tool_count_bucket` |
| ---------------- | ------------------- |
| `0`              | `"0"`               |
| `1`–`3`          | `"1-3"`             |
| `4`–`15`         | `"4-15"`            |
| `16`–`63`        | `"16-63"`           |
| `64` or more     | `"64+"`             |

```ts
export function getToolCountBucket(count: number): "0" | "1-3" | "4-15" | "16-63" | "64+" {
  if (count === 0) return "0";
  if (count < 4) return "1-3";
  if (count < 16) return "4-15";
  if (count < 64) return "16-63";
  return "64+";
}
```

## Configuration included in the hash

Build the hash from a canonical projection of the merged `PromptSpec`.

Include:

- resolved root component name;
- component names, generated signatures, and descriptions;
- component-group names, membership, and notes;
- exact string tool descriptors;
- structured tool names, descriptions, input/output schemas, and annotations;
- resolved `toolCalls`, `bindings`, `editMode`, and `inlineMode`;
- custom preamble, examples, tool examples, and additional rules.

Exclude:

- library `id`;
- library/component JSON Schema bodies beyond generated component signatures;
- generated prompt output;
- renderer/component implementations;
- runtime, environment, filesystem, request, user, or error data.

Sort components and component groups by name. Sort group membership. Sort tools
by their canonical representation. Preserve the order of notes, examples, tool
examples, and rules.

Only the resulting SHA-256 digest is sent. Never log, persist, or transmit the
canonical projection. Treat the digest as pseudonymous because known
configurations may be guessable.

## Project hash

On Node.js, calculate a separate best-effort project hash from the first
available value:

1. the local Git `remote.origin.url`;
2. `REPOSITORY_URL`;
3. the current working directory.

Normalize URL and SCP-style Git origins by removing credentials, protocol,
trailing `.git`, and trailing slashes. Hash:

```text
SHA-256("openui-project-v1\0" + normalized_project_source)
```

Send only `project_hash` and `project_hash_version=1`. Never send the source
value. This digest is independent of `system_prompt_config_hash`: one project
can use multiple prompt configurations, and the same prompt configuration can
appear in multiple projects. It is deterministic so horizontally scaled
runtimes with the same repository metadata produce the same value. Treat it as
pseudonymous and potentially guessable, especially for known repository URLs.

Do not attempt repository discovery in Bun, Deno, Edge, or browser runtimes;
omit both project fields there.

```ts
export async function calculateProjectHash(normalizedProjectSource: string): Promise<string> {
  const bytes = new TextEncoder().encode(`openui-project-v1\0${normalizedProjectSource}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
```

## Reference hash calculator

```ts
import type { PromptSpec, SystemPromptSpec, ToolSpec } from "@openuidev/lang-core";

const HASH_DOMAIN = "openui-system-prompt-config-v1";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function canonicalize(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Non-finite number");
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object") {
    const result: Record<string, Json> = {};
    for (const key of Object.keys(value).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) result[key] = canonicalize(child);
    }
    return result;
  }

  throw new TypeError(`Unsupported value: ${typeof value}`);
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalTool(tool: string | ToolSpec): Json {
  if (typeof tool === "string") {
    return { kind: "string", value: tool };
  }

  return canonicalize({
    kind: "spec",
    name: tool.name,
    description: tool.description ?? null,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    annotations: {
      readOnlyHint: tool.annotations?.readOnlyHint ?? null,
      destructiveHint: tool.annotations?.destructiveHint ?? null,
    },
  });
}

function mergeSpec(spec: SystemPromptSpec | PromptSpec): PromptSpec {
  if ("library" in spec) {
    return { ...spec.library, ...spec.promptOptions };
  }
  return spec;
}

function buildProjection(input: SystemPromptSpec | PromptSpec): Json {
  const spec = mergeSpec(input);
  const hasTools = (spec.tools?.length ?? 0) > 0;
  const toolCalls = spec.toolCalls ?? hasTools;
  const bindings = spec.bindings ?? toolCalls;

  const components = Object.entries(spec.components)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, component]) => ({
      name,
      signature: component.signature,
      description: component.description ?? null,
    }));

  const componentGroups = (spec.componentGroups ?? [])
    .map((group) => ({
      name: group.name,
      components: [...group.components].sort(),
      notes: [...(group.notes ?? [])],
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const tools = (spec.tools ?? [])
    .map(canonicalTool)
    .sort((left, right) => stableJson(left).localeCompare(stableJson(right)));

  return canonicalize({
    root: spec.root ?? "Root",
    components,
    componentGroups,
    tools,
    modes: {
      toolCalls,
      bindings,
      editMode: spec.editMode === true,
      inlineMode: spec.inlineMode === true,
    },
    preamble: spec.preamble ?? null,
    examples: [...(spec.examples ?? [])],
    toolExamples: [...(spec.toolExamples ?? [])],
    additionalRules: [...(spec.additionalRules ?? [])],
  });
}

export async function calculateSystemPromptConfigHash(
  spec: SystemPromptSpec | PromptSpec,
): Promise<string> {
  const canonicalJson = stableJson(buildProjection(spec));
  const bytes = new TextEncoder().encode(`${HASH_DOMAIN}\0${canonicalJson}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
```

If Web Crypto is unavailable, skip telemetry without throwing or adding a
runtime dependency.
