# @openuidev/devtools

Development-only UI widget for OpenUI apps. Renders a floating button that opens a left side drawer listing the events captured by [`@openuidev/observability`](../observability) — level, a one-line summary, and a drill-in stack trace per entry.

## Usage

```tsx
import { OpenUIDevtools } from "@openuidev/devtools";

function App() {
  return (
    <>
      {/* your app */}
      <OpenUIDevtools />
    </>
  );
}
```

The widget renders nothing in production builds (`NODE_ENV === "production"`) unless `enabled` is passed explicitly.

## Props

| Prop              | Default          | Description                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `enabled`         | dev-only         | Force the widget on/off.                                         |
| `position`        | `"bottom-right"` | Corner for the toggle button: `top-left`/`top-right`/`bottom-*`. |
| `maxEvents`       | `50`             | How many events to keep; oldest are dropped first.               |
| `errorsOnly`      | `true`           | Capture only error/warning events, or all.                       |
| `autoOpenOnError` | `true`           | Initial state of the drawer's "auto-open on error" checkbox.     |
| `bus`             | shared singleton | An `Observability` instance to listen to.                        |

## Telemetry

This package sends one pseudonymous `openui_devtools_installed` event to PostHog
when its npm `postinstall` script runs. This measures dependency installation,
not whether the Devtools widget was rendered or used. CI jobs, reinstalls, and
dependency-cache misses can produce additional events.

The event contains:

| Property                                                   | Description                                                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `project_id`                                               | SHA-256 of a locally stored secret salt and the normalized Git origin. Falls back to `REPOSITORY_URL`, then the install-root path. The underlying value and salt are not sent. |
| `project_id_source`                                        | Whether the project identity came from `git_origin`, `repository_url`, or `install_root`.                                                                                      |
| `devtools_version`                                         | Installed `@openuidev/devtools` version.                                                                                                                                       |
| `node_version`                                             | Node.js version running the lifecycle script.                                                                                                                                  |
| `system_platform`, `system_release`, `system_architecture` | Coarse operating-system and architecture metadata.                                                                                                                             |
| `package_manager`, `package_manager_version`               | Parsed npm, pnpm, Yarn, or Bun name and version.                                                                                                                               |
| `ci`, `ci_name`                                            | Whether a known CI environment was detected and its bounded provider name.                                                                                                     |
| `is_docker`                                                | Best-effort container detection.                                                                                                                                               |
| `telemetry_schema_version`                                 | Event-schema version.                                                                                                                                                          |

PostHog also receives a persistent random OpenUI installation identifier, event
timestamps, PostHog library metadata, and the network source IP visible to its
ingestion service. PostHog may derive coarse geographic properties from that IP.
The IP may belong to a CI runner, proxy, VPN, corporate gateway, or NAT address
rather than the developer's device.

OpenUI Devtools does **not** send the raw Git origin, branch, commit, repository
or package name, filesystem path, username, email, credentials, API keys,
environment-variable values, source code, prompts, generated content,
observability events, errors, messages, stack traces, application URLs, routes,
DOM content, or Devtools interactions.

Disable all Devtools installation telemetry with either variable:

```bash
OPENUI_TELEMETRY_DISABLED=1
DO_NOT_TRACK=1
```

The values `1` and `true` are accepted. The opt-out is checked before inspecting
the project, reading or writing telemetry state, loading PostHog, showing the
notice, or making a network request. Disabling package lifecycle scripts also
prevents the postinstall script from running.

To inspect the exact local payload without sending it:

```bash
OPENUI_TELEMETRY_DEBUG=1
```

Telemetry is best-effort, has a short timeout, and never fails package
installation.
