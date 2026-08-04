# CLI Error Telemetry Implementation Plan

## Outcome

Make CLI telemetry answer these questions without collecting raw errors or user data:

1. Which command was attempted?
2. At which stage did it fail?
3. What bounded class and code describe the failure?
4. How long did the stage run before failing?
5. Was the outcome a failure, an intentional skip, or a user cancellation?

Implement this against the current `main` CLI. Use `origin/codex/improve-cli-stage-telemetry` and commit `2cb0c0f` as design references only; do not merge or cherry-pick the divergent branch wholesale.

## Current baseline

- `cli_create_failed` records only the terminal funnel step and discards `CreateError.stage`.
- `cli_generate_failed` records a stage, but also sends a truncated raw error message that can contain a local path or other user-controlled text.
- Scaffold, Cloud auth, dependency install, and dev-server failures have separate events, but their properties are inconsistent.
- Dependency installation streams output without retaining a safe local diagnostic tail, so it cannot classify common package-manager failures.
- Skill installation failures are caught and printed but are not represented as failures in telemetry.
- Events from separate attempts cannot be reliably correlated because there is no per-run identifier.

## Scope

### In scope

- The `create` and `generate` commands in `packages/openui-cli`.
- Stage lifecycle telemetry, bounded error classification, cancellation/skip semantics, and attempt correlation.
- Package-manager, skill-install, Cloud-auth, filesystem, worker, and dev-server failures.
- Automated tests, local smoke tests, and a PostHog rollout/query checklist.
- Backward compatibility for existing event names during dashboard migration.

### Out of scope

- Errors produced by applications after they have been scaffolded.
- Uploading stack traces, raw stderr, response bodies, project names, file paths, prompts, source code, API keys, or arbitrary environment variables.
- Changing telemetry opt-out behavior.
- Reo forwarding or unrelated CLI UX/template work.
- Treating a missing terminal event as a confirmed failure.

## Event contract

Keep `create` and `generate` as independent funnels beginning at `cli_invoked` with the appropriate `command` filter.

Generate one ephemeral `cli_run_id` in the Commander `preAction` hook and register both `cli_run_id` and `command` as properties on every event from that invocation. A CLI process executes one command, so a second attempt identifier is unnecessary.

Emit canonical lifecycle events per command:

- `cli_create_stage`
- `cli_generate_stage`

Every stage event includes:

| Property                 | Shape                                                       | Notes                                                            |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `cli_run_id`             | UUID                                                        | Ephemeral correlation identifier; never persisted.               |
| `command`                | `create` or `generate`                                      | Registered on all invocation events.                             |
| `stage_schema_version`   | `1`                                                         | Allows later schema changes.                                     |
| `stage`                  | Bounded enum                                                | Defined below.                                                   |
| `stage_rank`             | Integer                                                     | Stable ordering within the command.                              |
| `stage_status`           | `started`, `succeeded`, `failed`, `skipped`, or `cancelled` | Do not combine skips/cancellations with failures.                |
| `duration_ms`            | Non-negative integer                                        | Terminal stage events only; `0` for skipped stages.              |
| `failure_stage`          | Bounded stage enum                                          | Included on failed terminal events and top-level failure events. |
| `failure_category`       | Bounded enum                                                | Broad, dashboard-friendly class.                                 |
| `failure_code`           | Bounded enum                                                | More precise allowlisted fingerprint.                            |
| `exit_code`              | Integer                                                     | Only when available.                                             |
| `failure_signal`         | Allowlisted signal                                          | Only when available.                                             |
| `http_status`            | Integer                                                     | Only when locally extracted from a known HTTP failure.           |
| `skip_reason`            | Bounded enum                                                | Only for skipped stages.                                         |
| `cancellation_exit_code` | `0`, `130`, or `143`                                        | Only for cancellations.                                          |

Example failed stage:

```json
{
  "event": "cli_create_stage",
  "command": "create",
  "stage_schema_version": 1,
  "stage": "dependency_install",
  "stage_rank": 600,
  "stage_status": "failed",
  "duration_ms": 1842,
  "failure_stage": "dependency_install",
  "failure_category": "registry_auth",
  "failure_code": "REGISTRY_401",
  "exit_code": 1
}
```

Retain existing events such as `cli_create_failed`, `cli_generate_failed`, `cli_dependency_install_failed`, and `cli_dev_command_failed` for compatibility. Add the normalized failure properties to them, but do not add raw `error`, `message`, or `stderr` properties. Use terminal command events for overall failure counts and stage events for stage conversion/latency; do not add the two event families together.

## Stage taxonomy

### Create

| Rank | Stage                    | Boundary                                                                                         |
| ---: | ------------------------ | ------------------------------------------------------------------------------------------------ |
|  100 | `args_resolution`        | Normalize flags and resolve required interactive/non-interactive arguments.                      |
|  150 | `preflight`              | Detect package manager and validate target/template availability.                                |
|  200 | `environment_resolution` | Resolve self-hosted or Cloud environment configuration.                                          |
|  210 | `cloud_auth`             | Select auth method, complete OIDC/key mint, explicitly skip, or record recoverable auth failure. |
|  250 | `skill_prompt`           | Resolve whether the optional skill should be installed before creating files.                    |
|  260 | `immediate_prompt`       | Resolve whether dependencies and the dev server should start before creating files.              |
|  300 | `scaffold`               | Copy template and rewrite scaffold metadata.                                                     |
|  400 | `environment_write`      | Write the generated `.env` file.                                                                 |
|  510 | `skill_install`          | Run the optional skill installer. A failure is recorded but does not fail project creation.      |
|  600 | `dependency_install`     | Execute the selected package manager.                                                            |

The dev server starts after `cli_create_succeeded`, so keep it outside the create-success funnel. Continue using `cli_dev_command_started`, `cli_dev_command_stopped`, and `cli_dev_command_failed`, but add `stage=dev_server`, `duration_ms`, `cli_run_id`, and normalized failure properties.

### Generate

| Rank | Stage              | Boundary                                                        |
| ---: | ------------------ | --------------------------------------------------------------- |
|  100 | `args_resolution`  | Resolve the entry argument and options.                         |
|  200 | `entry_validation` | Resolve and validate the entry file without emitting its path.  |
|  300 | `worker_execution` | Run the generator worker and classify load/generation failures. |
|  400 | `output_write`     | Parse output and write prompt/spec artifacts or stdout.         |

## Failure taxonomy

Use `failure_category` as the broad class and `failure_code` as the specific allowlisted fingerprint.

Initial categories:

- `invalid_input`
- `user_cancelled`
- `filesystem`
- `authentication`
- `command_missing`
- `peer_dependency`
- `registry_auth`
- `dns`
- `network_timeout`
- `network`
- `engine_mismatch`
- `dependency_resolution`
- `package_not_found`
- `install_script`
- `permission`
- `disk_space`
- `workspace_config`
- `http_error`
- `generation`
- `unknown`

Define failure codes in source rather than forwarding arbitrary detected text. Initial codes should cover current deterministic failures and common process failures, including:

- `MISSING_REQUIRED_ARG`, `INVALID_TEMPLATE`, `INVALID_AUTH`
- `TARGET_EXISTS`, `TEMPLATE_MISSING`, `ENTRY_NOT_FOUND`, `WRITE_FAILED`
- `AUTH_REQUIRED`, `OIDC_FAILED`, `ORG_NOT_FOUND`, `API_KEY_MINT_FAILED`, `API_KEY_MISSING`
- `COMMAND_NOT_FOUND`, `PERMISSION_DENIED`, `DISK_FULL`
- `ERR_PNPM_PEER_DEP_ISSUES`, `ERESOLVE`, `REGISTRY_401`, `REGISTRY_403`, `REGISTRY_404`
- `ENOTFOUND`, `EAI_AGAIN`, `ETIMEDOUT`, `ECONNRESET`, `ECONNREFUSED`, `NETWORK_UNREACHABLE`
- `ENGINE_MISMATCH`, `NO_MATCHING_VERSION`, `LOCKFILE_INCOMPATIBLE`, `INSTALL_SCRIPT_FAILED`
- `WORKER_FAILED`, `HTTP_<status>`, `INTERRUPTED`, `TERMINATED`, `UNKNOWN`

The classifier may inspect an error message, cause chain, and a capped local stderr tail, but its return value must contain only allowlisted fields and values. Unknown values collapse to `failure_category=unknown` and `failure_code=UNKNOWN`.

## Implementation steps

### 1. Add invocation correlation

- Update `src/index.ts` to create a UUID after telemetry initialization in `preAction`.
- Register `cli_run_id` and `command` before emitting `cli_invoked`.
- Preserve the existing command-specific `cli_invoked` funnels.

### 2. Add structured CLI errors and cancellation

- Extend the existing `CreateError` in `src/lib/telemetry.ts` with optional safe telemetry properties while retaining its current name to avoid an unrelated rename.
- Add a dedicated `CliCancelledError` carrying a bounded stage and conventional exit code.
- Replace direct `process.exit(0)` calls in prompt helpers with cancellation errors so telemetry can flush in the command-level `finally` block.

### 3. Add a privacy-safe classifier

- Add `src/lib/error-telemetry.ts` with the failure category/code types and pure classification functions.
- Classify known program errors explicitly at their throw sites.
- Classify process errors locally from an allowlisted pattern table.
- Limit cause traversal depth, accepted signals, HTTP status extraction, and diagnostic text size.
- Never return raw diagnostic text from this module.

### 4. Add a streaming process runner

- Add `src/lib/process-runner.ts` using asynchronous `cross-spawn`.
- Preserve inherited stdin, stream child output to the terminal, and retain only a bounded 16 KiB head-and-tail diagnostic window locally for classification.
- Return or throw structured exit code, signal, spawn code, duration, and detected safe fingerprints.
- Preserve Ctrl-C/SIGTERM behavior and prevent duplicate settlement from `error` plus `close` events.
- Replace the synchronous package-manager/dev-server runner and the skill installer's `execSync` usage.

### 5. Add reusable stage instrumentation

- Add a small generic helper in `src/lib/stage-telemetry.ts` that emits started and terminal events, measures duration, normalizes thrown failures, and rethrows while preserving the original cause.
- Extend `src/lib/create-telemetry.ts` with the create stage enum/ranks and a configured `instrumentCreateStage` wrapper.
- Add `src/lib/generate-telemetry.ts` with the generate stage enum/ranks and configured wrapper.
- Provide an explicit helper for skipped stages so `--no-install`, self-hosted auth, unrequested skill installation, and auth skip do not appear as failures.

### 6. Instrument create boundaries

- Update `src/commands/create-app.ts` to wrap each stage in the taxonomy above.
- Preserve the current named funnel events and their ordering.
- Make Cloud auth outcomes explicit:
  - OAuth/API-key/manual success: `succeeded`.
  - User-selected auth skip: `skipped`.
  - Auth error that leaves an empty key but permits scaffolding: stage `failed`, while the overall create command may still succeed.
- Make optional skill-install failure a failed stage that continues creation.
- Add normalized failure fields to dependency-install and dev-server failure events.
- Do not classify `--no-install`, no-skill, normal SIGINT/SIGTERM dev-server shutdown, or auth skip as command failures.

### 7. Instrument generate boundaries

- Update `src/index.ts` and `src/commands/generate.ts` to wrap argument resolution, entry validation, worker execution, and output writing.
- Add safe deterministic codes for missing entries and worker failures.
- Remove the current raw truncated `error` property from `cli_generate_failed`.
- Preserve `cli_generate_started` and `cli_generate_succeeded` for existing dashboards.

### 8. Normalize top-level failure handling

- Update `src/lib/utils.ts` so `cli_create_failed` retains `failure_stage` and both create/generate terminal failures use the shared classifier.
- Emit separate `*_cancelled` events for user cancellation and retain exit code `0`, `130`, or `143` as appropriate.
- Keep user-facing console messages unchanged unless a change is necessary to avoid exposing a secret already present in current output.

### 9. Add tests without a new test framework dependency

- Add a package `test` script that builds the CLI and runs `node --test test/*.test.cjs`.
- Add focused tests for:
  - Started/succeeded/failed/skipped/cancelled lifecycle pairs.
  - Stable stage ranks, durations, and `cli_run_id` correlation.
  - Preservation of `failure_stage` at the top-level handler.
  - Every initial classifier category and priority when multiple signatures match.
  - HTTP status, exit code, spawn error, and signal extraction.
  - Package-manager stderr-tail classification while output remains visible.
  - Skill/auth recoverable failures that do not become `cli_create_failed`.
  - Generate failures that never emit entry paths or raw messages.
  - Privacy sentinel values resembling paths, API keys, registry credentials, response bodies, and user-entered names; assert none appear in captured event JSON.
- Add smoke tests using temporary directories for one successful `--no-install --no-skill` create path and representative failed create/generate paths.

### 10. Validate and roll out

Run locally:

```sh
pnpm --filter @openuidev/cli test
pnpm --filter @openuidev/cli lint:check
pnpm --filter @openuidev/cli format:check
pnpm --filter @openuidev/cli build
git diff --check
```

After publishing a CLI version, create separate PostHog views:

1. Create attempts: start with `cli_invoked[command=create]`.
2. Generate attempts: start with `cli_invoked[command=generate]`.
3. Stage failure rate: denominator is `cli_*_stage[stage_status=started]` for that exact stage; numerator is the same stage with `stage_status=failed`.
4. Overall command failure rate: denominator is command-filtered `cli_invoked`; numerator is the corresponding terminal `cli_*_failed` event.
5. Break failures down in order by `failure_stage`, `failure_category`, then `failure_code`; optionally segment by `cli_version`, package manager, OS, CI, and interactive mode.
6. Track cancellations and skips separately. Do not infer failure from missing terminal events.

Keep legacy named events for at least one released CLI version and migrate dashboards before considering removal.

## Acceptance criteria

- Every explicit create/generate failure emits a bounded `failure_stage`, `failure_category`, and `failure_code`.
- Every instrumented stage has started plus exactly one terminal status for a normal in-process completion path.
- Recoverable auth/skill failures are visible without incorrectly making the entire create attempt a failure.
- Retries from the same user are separable by `cli_run_id`.
- No emitted event includes raw errors, stderr, stack traces, paths, project names, API keys, prompts, source, response bodies, or registry credentials.
- Existing command success and funnel event names continue to be emitted.
- Tests, lint, format, CLI build, focused smoke tests, and `git diff --check` pass.
- Dashboard definitions use explicit command and stage denominators rather than treating absent terminal events as failures.

## Recommended delivery sequence

Use one focused PR with three reviewable commits:

1. Error taxonomy, process runner, stage helper, and unit tests.
2. Create/generate instrumentation and compatibility events.
3. Smoke tests plus event-schema/rollout documentation.
