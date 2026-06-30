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
import { generatePrompt, type PromptSpec } from "@openuidev/lang-core";
import componentSpec from "./generated/component-spec.json";

const prompt = generatePrompt({
  ...componentSpec,
  tools: myToolSpecs,
  toolCalls: true,
  bindings: true,
  editMode: true,
  preamble: "You build dashboards.",
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

| Export | Description |
| :--- | :--- |
| `generatePrompt(spec)` | Generate a system prompt from a `PromptSpec` |

**`PromptSpec`** includes component signatures, tool definitions (`ToolSpec[]`), feature flags (`toolCalls`, `bindings`, `editMode`, `inlineMode`), examples, and custom rules.

**`ToolSpec`** describes a tool for prompt generation (name, description, inputSchema, outputSchema). Shape inspired by MCP's tool schema.

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
