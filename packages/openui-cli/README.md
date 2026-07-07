# @openuidev/cli

Command-line tools for starting OpenUI projects and generating model instructions from component libraries.

[![npm](https://img.shields.io/npm/v/@openuidev/cli)](https://www.npmjs.com/package/@openuidev/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [CLI docs](https://openui.com/docs/api-reference/cli) | [GitHub repo](https://github.com/thesysdev/openui)

It currently supports two workflows:

- scaffolding a new OpenUI app from one of two templates:
  - **OpenUI Chat** — a Next.js app where you bring your own model key (OpenAI)
  - **OpenUI Cloud** — a Next.js app backed by OpenUI Cloud for managed conversations, artifacts, and streaming
- generating a system prompt or JSON Schema from a `createLibrary()` export

## Install

Run the CLI with your package manager of choice:

```bash
npx @openuidev/cli@latest --help
pnpm dlx @openuidev/cli@latest --help
bunx @openuidev/cli@latest --help
```

## Quick Start

Create a new app (you'll be prompted to pick a template):

```bash
npx @openuidev/cli@latest create
```

Skip the prompt and pick a template directly:

```bash
npx @openuidev/cli@latest create --template openui-self-hosted
npx @openuidev/cli@latest create --template openui-cloud
```

Generate a prompt from a library file:

```bash
npx @openuidev/cli@latest generate ./src/library.ts
```

Generate JSON Schema instead:

```bash
npx @openuidev/cli@latest generate ./src/library.ts --json-schema
```

## Commands

### `openui create`

Scaffolds a new Next.js app from the **OpenUI Chat** or **OpenUI Cloud** template.

```bash
openui create [options]
```

Options:

- `-n, --name <string>`: Project name
- `-t, --template <template>`: Template to scaffold — `openui-self-hosted` or `openui-cloud`
- `--skill`: Install the OpenUI agent skill for AI coding assistants
- `--no-skill`: Skip installing the OpenUI agent skill
- `--no-install`: Scaffold without running the package install
- `--no-interactive`: Fail instead of prompting for missing required input
- `--api-key <key>`: (cloud template) OpenUI Cloud API key; skips sign-in
- `--auth <method>`: (cloud template) How to obtain the key — `oauth`, `manual`, or `skip`

What it does:

- prompts for the project name if you do not pass `--name`
- prompts for the template if you do not pass `--template`
- copies the bundled template into a new directory
- rewrites monorepo-local dependencies (`workspace:`, `file:`, `catalog:`) in the generated `package.json` to `latest`
- installs dependencies automatically using the detected package manager (unless `--no-install`)
- optionally installs the OpenUI agent skill for AI coding assistants
- writes a `.env` file tailored to the template (see below)

#### Template-specific `.env`

- **OpenUI Chat** — prompts for your OpenAI API key and writes `OPENAI_API_KEY` to `.env` (interactive mode only). Leave blank to skip.
- **OpenUI Cloud** — obtains an OpenUI Cloud API key and writes `THESYS_API_KEY` plus `DEMO_USER_ID=demo-user` to `.env`. The key is resolved by, in order:
  - `--api-key <key>` if provided
  - the `--auth` method, otherwise an interactive prompt offering:
    - `oauth` — sign in with Thesys in the browser and mint a key for your org
    - `manual` — paste an existing key
    - `skip` — leave `THESYS_API_KEY` empty and add it later (get one at <https://console.thesys.dev/keys>)
  - in non-interactive mode without `--api-key`, the cloud template fails because a key is required

Examples:

```bash
openui create
openui create --name my-app --template openui-self-hosted
openui create --name my-app --template openui-cloud --auth oauth
openui create --name my-app --template openui-cloud --api-key tk_your_key
openui create --name my-app --no-skill --no-install
openui create --no-interactive --name my-app --template openui-cloud --api-key tk_your_key
```

### `openui generate`

Generates a system prompt or JSON Schema from a file that exports a `createLibrary()` result.

```bash
openui generate [options] [entry]
```

Arguments:

- `entry`: Path to a `.ts`, `.tsx`, `.js`, or `.jsx` file that exports a library

Options:

- `-o, --out <file>`: Write output to a file instead of stdout
- `--json-schema`: Output JSON Schema instead of the system prompt
- `--export <name>`: Use a specific export name instead of auto-detecting the library export
- `--prompt-options <name>`: Use a specific `PromptOptions` export name (auto-detected by default)
- `--no-interactive`: Fail instead of prompting for a missing `entry`

What it does:

- prompts for the entry file path if you do not pass one
- bundles the entry with `esbuild` before evaluating it in Node
- supports both TypeScript and JavaScript entry files
- stubs common asset imports such as CSS, SVG, images, and fonts during bundling
- auto-detects the exported library by checking `library`, `default`, and then all exports
- auto-detects a `PromptOptions` export (with `examples`, `additionalRules`, or `preamble`) and passes it to `library.prompt()`

Examples:

```bash
openui generate ./src/library.ts
openui generate ./src/library.ts --json-schema
openui generate ./src/library.ts --export library
openui generate ./src/library.ts --out ./artifacts/system-prompt.txt
openui generate ./src/library.ts --prompt-options myPromptOptions
openui generate --no-interactive ./src/library.ts
```

## How `generate` resolves exports

`openui generate` expects the target module to export a library object with both `prompt()` and `toJSONSchema()` methods.

If `--export` is not provided, it looks for exports in this order:

1. `library`
2. `default`
3. any other export that matches the expected library shape

### PromptOptions auto-detection

If `--prompt-options` is not provided, the CLI looks for a `PromptOptions` export in this order:

1. `promptOptions`
2. `options`
3. any export whose name ends with `PromptOptions` (case-insensitive)

A valid `PromptOptions` object has at least one of: `examples` (string array), `additionalRules` (string array), or `preamble` (string).

## Local Development

Build the CLI locally:

```bash
pnpm run build
```

Run the built CLI:

```bash
node dist/index.js --help
node dist/index.js create --help
node dist/index.js generate --help
```

## Telemetry

The CLI sends usage analytics; OAuth sign-ins may link usage to your OIDC account ID. It does not send code, prompts, API keys, email, or name. Disable telemetry with `--no-telemetry` or `DO_NOT_TRACK=1`.

```bash
openui create --no-telemetry
```

## Notes

- interactive prompts can be cancelled without creating output
- `create` requires the selected template's files to be present in the built package
- `generate` exits with a non-zero code if the file is missing or no valid library export is found

## Documentation

- [CLI API reference](https://openui.com/docs/api-reference/cli)
- [Chat quick start](https://openui.com/docs/chat/quick-start)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/openui-cli)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
