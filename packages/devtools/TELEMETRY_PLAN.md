# OpenUI Devtools Postinstall Telemetry Plan

## Status

Planning only. This document does not implement telemetry.

## Decision

`@openuidev/devtools` will send one best-effort PostHog event from an npm
`postinstall` script. It will not track interactions with the Devtools widget.

The event measures dependency installation, not confirmed application usage.
Repeated installs, CI jobs, dependency-cache misses, and reinstalls can therefore
produce multiple events.

## Goals

- Measure how many pseudonymous projects and installations include OpenUI
  Devtools.
- Understand the coarse development environment: operating system, architecture,
  Node.js version, package manager, CI, and containers.
- Correlate repeat installations for the same local installation and project
  without sending the Git remote or project path.
- Use the existing OpenUI PostHog project and telemetry conventions.
- Clearly disclose collection and provide reliable opt-out controls.
- Never delay or fail package installation because telemetry is unavailable.

## Non-goals

- Tracking Devtools drawer opens, clicks, settings, or stack-copy actions.
- Tracking application users or browser sessions.
- Collecting observability events, errors, messages, stack traces, or event
  payloads.
- Collecting source code, prompts, generated content, DOM content, routes, or
  application URLs.
- Collecting raw repository URLs, branches, commits, filesystem paths, package
  names, usernames, email addresses, credentials, API keys, or arbitrary
  environment-variable values.
- Performing company deanonymization in the client.

## Trigger

Add a package lifecycle script:

```json
{
  "scripts": {
    "postinstall": "node ./postinstall.cjs"
  }
}
```

The root bootstrap mirrors Scarf's packaging pattern and safely loads
`dist/postinstall.cjs`. The published package must include both files. If the
compiled entry is missing in a clean source checkout or malformed package, the
bootstrap exits successfully without telemetry. Package managers that disable
lifecycle scripts will not run telemetry.

The script must:

1. Check all opt-out variables before reading project information, creating
   local telemetry state, loading PostHog, or making a network request.
2. Build an allowlisted payload.
3. Print a one-time disclosure when telemetry is enabled.
4. Send the event with a short timeout.
5. Swallow every telemetry error and exit successfully.

## PostHog event

### Event name

```text
openui_devtools_installed
```

### Explicit event properties

| Property                   | Type                     | Description                                                                     |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `telemetry_schema_version` | number                   | Starts at `1`; incremented for breaking schema changes.                         |
| `project_id`               | string                   | SHA-256 of a local secret salt and the normalized project identity.             |
| `project_id_source`        | enum                     | `git_origin`, `repository_url`, or `install_root`.                              |
| `devtools_version`         | string                   | Installed `@openuidev/devtools` version.                                        |
| `node_version`             | string                   | `process.version` for the postinstall process.                                  |
| `system_platform`          | string                   | Node.js platform, such as `darwin`, `linux`, or `win32`.                        |
| `system_release`           | string                   | Operating-system release reported by Node.js.                                   |
| `system_architecture`      | string                   | Node.js process architecture, such as `arm64` or `x64`.                         |
| `package_manager`          | bounded string           | Parsed package manager: `npm`, `pnpm`, `yarn`, `bun`, or `unknown`.             |
| `package_manager_version`  | string or absent         | Parsed package-manager version, never the raw package-manager user-agent value. |
| `ci`                       | boolean                  | Whether a supported CI environment was detected.                                |
| `ci_name`                  | bounded string or absent | Known provider name such as `github_actions`, `gitlab_ci`, or `buildkite`.      |
| `is_docker`                | boolean                  | Best-effort indication that installation is running in a container.             |

### PostHog and HTTP metadata

The PostHog Node client and ingestion service can additionally record:

- the persistent pseudonymous `distinct_id`;
- event and ingestion timestamps;
- PostHog library name and library version;
- the network source IP visible to PostHog;
- coarse geographic properties derived from that IP according to the PostHog
  project configuration.

The script will not add a raw IP property to the JSON payload. The visible source
IP may be a CI runner, proxy, VPN, corporate gateway, or NAT address rather than
the developer's device.

Because persistent identifiers and source-IP processing are involved, this must
be described as **pseudonymous telemetry**, not anonymous telemetry.

## Identifier design

### Persistent installation identifier

Use a cryptographically random identifier stored in the OpenUI telemetry state:

```text
$XDG_CONFIG_HOME/openui/telemetry.json
```

When `XDG_CONFIG_HOME` is not configured, use:

```text
~/.config/openui/telemetry.json
```

Reuse the existing `distinctId` field used by the OpenUI CLI so OpenUI-owned
telemetry has one documented installation identifier. Add a random
`projectSalt` field without removing or rewriting unrelated existing fields.

If the state file cannot be read or written, use ephemeral identifiers for that
execution and continue without surfacing an error.

### Project identity

Resolve the consuming project root from `INIT_CWD`, falling back to the current
working directory only when necessary.

Select the raw project identity in this order:

1. `git config --get remote.origin.url` executed against the consuming project.
2. `REPOSITORY_URL`.
3. The resolved install-root path.

Before hashing a Git remote:

- remove embedded credentials;
- normalize supported HTTPS, SSH, and SCP-like Git URL forms;
- lowercase the hostname;
- remove a trailing slash and `.git` suffix.

Calculate:

```text
project_id = SHA-256(projectSalt + normalizedProjectIdentity)
```

The raw identity must exist only in memory. It must never be logged, persisted,
placed in errors, or sent to PostHog. The local salt must never be sent.

This design makes a project stable on the same OpenUI installation while
preventing straightforward server-side dictionary lookups of repository URLs.
The same repository on another machine will normally have a different
`project_id`.

## Environment controls

### Disable telemetry

Either variable disables the complete postinstall telemetry path:

```bash
OPENUI_TELEMETRY_DISABLED=1
DO_NOT_TRACK=1
```

The values `1` and `true`, case-insensitive, will be accepted. The opt-out check
must happen before project inspection, telemetry-state creation, disclosure
state changes, PostHog initialization, or network access.

Package-manager lifecycle controls, such as installing with scripts disabled,
also prevent the postinstall script from running.

### Debug without sending

```bash
OPENUI_TELEMETRY_DEBUG=1
```

Debug mode prints the exact allowlisted event payload after project hashing and
does not initialize PostHog or make a network request. It cannot display the
source IP or server-derived properties because those are not part of the local
payload.

### Test overrides

Keep the existing OpenUI test conventions:

```bash
OPENUI_POSTHOG_KEY=...
OPENUI_POSTHOG_HOST=...
```

These variables configure the destination and are never included in telemetry.

## Transport behavior

- Use `posthog-node`, consistent with the OpenUI CLI.
- Use the existing OpenUI public PostHog ingestion key and host.
- Flush the single event immediately.
- Limit shutdown/network waiting to at most two seconds.
- Treat initialization, capture, flush, state, Git, and OS-inspection failures as
  non-fatal.
- Produce diagnostic warnings only in debug mode.
- Never replace or broadly intercept application/package-manager console
  methods.
- Ensure the lifecycle process exits with status `0` after telemetry failures.

## Disclosure

### Installation notice

Show a concise notice once per local installation when telemetry is enabled:

> OpenUI Devtools sends pseudonymous installation telemetry to PostHog. It
> includes a locally salted project identifier, OpenUI/Node/OS/package-manager
> metadata, and the network IP observed by PostHog. It does not send repository
> URLs, paths, source code, prompts, errors, or application data. Disable it with
> `OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1`.

Store only that the notice was shown; do not store project data for the notice.

### Documentation

Add the same factual disclosure, the complete event-property table, trigger
semantics, destination, and controls to:

- `packages/devtools/README.md`;
- `docs/content/docs/api-reference/devtools.mdx`.

The documentation must prominently state:

- telemetry runs during `postinstall`;
- an install event is not proof that the widget was rendered or used;
- CI and repeated installs can emit additional events;
- the source IP can be observed and enriched by PostHog;
- raw project identity and application data are excluded;
- both supported opt-out variables;
- disabling package lifecycle scripts also prevents collection.

## Planned code changes

| File                                              | Change                                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/devtools/package.json`                  | Add the `postinstall` script, `posthog-node` dependency, and packaging metadata for the bootstrap.         |
| `packages/devtools/postinstall.cjs`               | Dependency-free lifecycle bootstrap that safely loads the compiled implementation.                         |
| `packages/devtools/tsdown.config.ts`              | Build a Node-compatible CommonJS postinstall entry in addition to the browser package entry.               |
| `packages/devtools/src/postinstall.ts`            | Minimal lifecycle entrypoint that always resolves successfully.                                            |
| `packages/devtools/src/install-telemetry.ts`      | Opt-out checks, state handling, project hashing, environment detection, disclosure, and PostHog transport. |
| `packages/devtools/src/install-telemetry.test.ts` | Unit tests for the complete telemetry boundary.                                                            |
| `packages/devtools/README.md`                     | Exact collection and opt-out disclosure.                                                                   |
| `docs/content/docs/api-reference/devtools.mdx`    | Public API documentation disclosure.                                                                       |
| `pnpm-lock.yaml`                                  | Record the package dependency change.                                                                      |

The implementation may adjust internal filenames, but the postinstall entry
must remain isolated from the browser-facing `@openuidev/devtools` export.

## Test plan

### Identity and privacy

- The same raw project identity and salt produce the same `project_id`.
- Different salts produce different project IDs.
- Raw Git origins, credentials, repository paths, install paths, and local
  usernames never appear in the payload, logs, state file, or thrown errors.
- HTTPS, SSH, and SCP-like Git origins normalize consistently.
- Identity selection follows Git origin → `REPOSITORY_URL` → install-root.
- Existing CLI telemetry state fields survive updates.

### Controls

- `OPENUI_TELEMETRY_DISABLED=1` prevents project reads, state writes, PostHog
  loading, notices, and network calls.
- `DO_NOT_TRACK=1` provides the same guarantee.
- `true` and mixed-case truthy values are accepted.
- Debug mode prints the allowlisted payload and makes no network call.
- Installing with lifecycle scripts disabled does not invoke the script.

### Event contract

- Only `openui_devtools_installed` is emitted.
- Only the documented custom properties are passed to PostHog.
- Package-manager and CI values are reduced to bounded enums.
- The package version comes from the Devtools package, not the consuming
  project's package metadata.
- No observability or browser module is imported by the postinstall bundle.

### Failure isolation

- Missing Git, missing environment variables, corrupt state, read-only home
  directories, PostHog initialization failures, offline networks, timeouts, and
  rejected flushes all exit successfully.
- Network failure adds no more than the configured maximum delay to installation.
- Failures remain silent unless debug mode is enabled.

### Packaging and verification

Run:

```bash
pnpm --filter @openuidev/devtools test
pnpm --filter @openuidev/devtools typecheck
pnpm --filter @openuidev/devtools lint:check
pnpm --filter @openuidev/devtools format:check
pnpm --filter @openuidev/devtools build
pnpm --filter @openuidev/devtools check:publint
pnpm --filter @openuidev/devtools check:attw
```

Also inspect a packed tarball to confirm:

- `dist/postinstall.cjs` is included;
- installation succeeds offline;
- the opt-out path creates no telemetry state and performs no request;
- the debug payload matches this document;
- the browser package does not import or bundle Node/PostHog telemetry code.

## Acceptance criteria

- A normal lifecycle execution produces one schema-versioned PostHog install
  event.
- Unique projects can be counted by locally salted `project_id`.
- Repeat installs can be correlated through the documented pseudonymous
  identifiers.
- OS, architecture, Node.js, package-manager, CI, container, and source-IP
  context are available as documented.
- No raw repository identity or application/runtime content leaves the machine.
- Both opt-out variables prevent all telemetry-side reads, writes, imports, and
  network requests.
- Telemetry can never fail package installation.
- Public documentation exactly matches the shipped payload and PostHog behavior.
