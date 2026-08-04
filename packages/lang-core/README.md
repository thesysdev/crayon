# @openuidev/lang-core

Framework-agnostic core for OpenUI Lang. This is the parser, prompt-generation, runtime-evaluation, and type layer used by the framework packages.

[![npm version](https://img.shields.io/npm/v/@openuidev/lang-core)](https://www.npmjs.com/package/@openuidev/lang-core)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/lang-core)](https://www.npmjs.com/package/@openuidev/lang-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [OpenUI Lang docs](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/lang-core
# or
pnpm add @openuidev/lang-core
```

## What this package does

`@openuidev/lang-core` has no React, Vue, or Svelte dependency. Use it when you need to:

- **Parse** OpenUI Lang text into a typed element tree (one-shot or streaming)
- **Generate system prompts** from a component spec + tool definitions
- **Evaluate** reactive expressions, `$variables`, and query results at runtime
- **Merge** incremental edits into existing programs

If you're building a framework-specific app, use `@openuidev/react-lang`, `@openuidev/vue-lang` or `@openuidev/svelte-lang` instead. It re-exports everything from this package plus framework-specific components and hooks.

## Quick Start

### Parse OpenUI Lang

```ts
import { createParser } from "@openuidev/lang-core";

const parser = createParser(libraryJsonSchema);
const result = parser.parse(`
root = Stack([header, content])
header = CardHeader("Hello")
content = TextContent("World")
`);

console.log(result.root);       // ElementNode tree
console.log(result.meta);       // { incomplete, unresolved, statementCount, validationErrors }
```

### Streaming parser

```ts
import { createStreamingParser } from "@openuidev/lang-core";

const sp = createStreamingParser(libraryJsonSchema);

// Feed chunks as they arrive from the LLM
const result1 = sp.set("root = Stack([header])\n");
const result2 = sp.set("root = Stack([header])\nheader = CardHeader(\"Hello\")\n");
// result2.root now resolves the forward reference
```

### Generate a system prompt

```ts
import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import librarySpec from "./generated/system-prompt.spec.json";

const prompt = generateSystemPrompt({
  library: librarySpec as LibrarySpec,
  promptOptions: {
    tools: myToolSpecs,
    toolCalls: true,
    bindings: true,
    editMode: true,
    preamble: "You build dashboards.",
  },
});
```

### Merge incremental edits

```ts
import { mergeStatements } from "@openuidev/lang-core";

const original = `root = Stack([header, tbl])\nheader = CardHeader("Tickets")\ntbl = Table([...])`;
const patch = `root = Stack([header, chart, tbl])\nchart = PieChart(...)`;
const merged = mergeStatements(original, patch);
// header and tbl kept from original, root replaced, chart added
```

## API

### Parser

| Export | Description |
| :--- | :--- |
| `createParser(schema)` | One-shot parser for complete text |
| `createStreamingParser(schema)` | Incremental parser for streaming input |
| `parse(input, schema)` | Convenience one-shot parse |

### Prompt Generation

| Export                                                              | Description                                                                   |
| :------------------------------------------------------------------ | :---------------------------------------------------------------------------- |
| `generateSystemPrompt({ library, promptOptions })` | Generate a system prompt from a serialized library and prompt options |
| `generatePrompt(spec)`                            | Deprecated low-level prompt generator                                |

**`SystemPromptSpec`** combines a serialized `LibrarySpec` with prompt options. Prompt options include tool definitions (`ToolSpec[]`), feature flags (`toolCalls`, `bindings`, `editMode`, `inlineMode`), examples, and custom rules.

**`ToolSpec`** describes a tool for prompt generation (name, description, inputSchema, outputSchema). Shape inspired by MCP's tool schema.

## Telemetry

On a successful server-side `generateSystemPrompt()` call, Lang Core sends a
best-effort event directly to PostHog at
[`https://us.i.posthog.com`](https://us.i.posthog.com). It sends once per
distinct prompt configuration per runtime, with a maximum of 16 configurations.
It does not send on every user request, and it never sends from a browser or
browser worker. New processes, pods, workers, and serverless cold starts have
fresh in-memory deduplication state and may send again.

The event contains the full Lang Core and server runtime versions, coarse
environment and CI flags, API/input shape, a powers-of-four tool-count bucket,
a SHA-256 prompt-configuration hash, random memory-only event/runtime IDs, and,
on Node.js when available, a separate repository-derived project hash. It does
not contain prompt output, component or tool content, library IDs, request
headers, chat-user IPs, credentials, errors, or raw repository/path values.
PostHog observes the server or build runner's direct transport IP and may apply
its configured GeoIP processing. Person-profile processing is disabled for the
event.

Disable it for the process with `OPENUI_TELEMETRY_DISABLED=1` or
`DO_NOT_TRACK=1`. Telemetry is also disabled automatically when
`NODE_ENV=test`. Delivery is asynchronous, has no retry, and cannot change the
generated prompt or throw into application code.

### Runtime

| Export | Description |
| :--- | :--- |
| `createQueryManager(toolProvider)` | Manages Query/Mutation execution and caching |
| `createStore()` | Reactive store for `$variables` and form state |
| `evaluate(ast, context)` | Evaluate an AST node to a concrete value |
| `evaluateElementProps(root, context)` | Recursively evaluate all props in an element tree |
| `extractToolResult(result)` | Extract data from an MCP `callTool` response |
| `mergeStatements(original, patch)` | Merge incremental edits by statement name |

### Types

```ts
import type {
  PromptSpec,
  ToolSpec,
  ParseResult,
  ElementNode,
  ToolProvider,
  McpClientLike,
  QueryManager,
  Store,
  OpenUIError,
} from "@openuidev/lang-core";
```

## Documentation

- [OpenUI Lang guide](https://openui.com/docs/openui-lang)
- [Language specification](https://openui.com/docs/openui-lang/specification-v05)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/lang-core)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
