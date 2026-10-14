# @openuidev/react-lang

React bindings for OpenUI Lang. Use this package when your model needs to emit structured UI and your React app needs to render it while the response is still streaming.

[![npm version](https://img.shields.io/npm/v/@openuidev/react-lang)](https://www.npmjs.com/package/@openuidev/react-lang)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/react-lang)](https://www.npmjs.com/package/@openuidev/react-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [Package docs](https://openui.com/docs/api-reference/react-lang) | [OpenUI Lang guide](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/react-lang
# or
pnpm add @openuidev/react-lang
```

**Peer dependencies:** `react >=19.0.0`, `zod ^3.25.0 || ^4.0.0` (schemas use Zod 4: `import { z } from "zod/v4"`)

## Query failures

Without slot children, `Renderer` keeps query defaults or cached results visible while loading and after failures. A spinner is shown while queries load, and `onError` receives structured errors. Provide `queryLoader` to customize the indicator, or slot children for custom layouts. No error/retry view is shown by default.

Use slots to customize loading and failure views:

```tsx
<Renderer.Root response={response} library={library} toolProvider={toolProvider}>
  <div style={{ position: "relative" }}>
    <Renderer.Content />
    <Renderer.QueryLoading>Loading data…</Renderer.QueryLoading>
    <Renderer.QueryError>
      <div role="alert">
        <p>We couldn't load your data. Please try again.</p>
        <Renderer.Retry>Try again</Renderer.Retry>
      </div>
    </Renderer.QueryError>
  </div>
</Renderer.Root>
```

`Renderer.Root` owns one runtime and renders only its children. Slots can sit inside wrappers or portals under that root. `Renderer.Content` keeps generated components mounted while queries load or fail; failed results remain hidden until recovery. Omitting a slot omits its presentation. Plain `Renderer` supplies content and a loading indicator without hiding results on failure.

`Renderer.QueryLoading` shows its children while queries await generation or fetch data, unless failures are being displayed. Omit children to use `queryLoader`, falling back to the default spinner. Position custom overlays within your own relative container. `Renderer.QueryError` shows its children on failure and renders nothing without children. Add `Renderer.Retry` explicitly if you want a retry button. `Renderer.Retry` disables itself during loading and when no queries have failed. It accepts standard button props; its click handler can prevent the retry with `event.preventDefault()`.

Use `useRendererQuery()` inside the root to read `{ isLoading, errors, retry, isRetrying }` in your own components. Generation progress remains available through `useIsStreaming()`. Do not create another root for each slot.

`Renderer` accepts slot children to replace its default content composition.

While queries load, `Renderer.Content` renders their defaults or previously successful data. During streaming edits, previously loaded results remain visible with loading feedback until the updated response is ready.

## Overview

`@openuidev/react-lang` is the React runtime layer for OpenUI Lang. It covers the loop most apps need:

1. **Define components** that a model is allowed to use, with Zod schemas for props.
2. **Generate prompts** from that component library so the model knows the exact output language.
3. **Render streamed output** with `<Renderer>` as OpenUI Lang arrives from your backend.

## Quick Start

### 1. Define a component

Renderers receive the parsed props as `props`:

```tsx
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: ({ props }) => (
    <div className={props.mood === "excited" ? "text-xl font-bold" : ""}>
      Hello, {props.name}!
    </div>
  ),
});
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/react-lang";

const library = createLibrary({
  components: [Greeting /* , Card, Table, ... */],
  root: "Greeting", // the component the program's root statement calls
});
```

### 3. Generate a system prompt

Examples are written in OpenUI Lang:

```ts
const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant.",
  additionalRules: ["Always greet the user by name."],
  examples: [`root = Greeting("Alice", "happy")`],
});
```

### 4. Render streamed output

```tsx
import { Renderer } from "@openuidev/react-lang";

function AssistantMessage({ response, isStreaming }: { response: string; isStreaming: boolean }) {
  return (
    <Renderer
      response={response}
      library={library}
      isStreaming={isStreaming}
      onAction={(event) => console.log("Action:", event.type, event.params)}
      onError={(errors) => console.warn(errors)}
    />
  );
}
```

`response` is the raw model output, or a stored message written with `buildMessage`.

## API Reference

### Component Definition

| Export | Description |
| :--- | :--- |
| `defineComponent(config)` | Define a single component with a name, Zod props schema, description, and React renderer |
| `defineFunction(config)` | A library function the model calls as `@Name(...)` ([docs](https://openui.com/docs/openui-lang/functions)) |
| `defineAction(config)` | A custom action step a button can run, delivered to `onAction` ([docs](https://openui.com/docs/openui-lang/actions)) |
| `createLibrary(definition)` | A library from components, functions and actions; `library.extend()` derives a new one |
| `action()` | Schema for an action prop (one step, or `Action([...])`) |
| `reactive(schema)` | Marks a prop as bindable to a `$variable`; read it with `useStateField()` |

### Rendering

**`RendererProps`:**

| Prop | Type | Description |
| :--- | :--- | :--- |
| `response` | `string \| null` | Raw OpenUI Lang text, or a stored message (see `buildMessage`) |
| `library` | `Library` | Component library from `createLibrary()` |
| `isStreaming` | `boolean` | Whether the model is still streaming (disables form interactions) |
| `onAction` | `(event: ActionEvent) => void` | Callback when a component triggers an action |
| `onStateUpdate` | `(state: Record<string, any>) => void` | Callback when form fields or `$variables` change |
| `initialState` | `Record<string, any>` | State to restore, e.g. from a stored message |
| `toolProvider` | function map or MCP client | Runs `Query()` and `Mutation()` tools |
| `onError` | `(errors: OpenUIError[]) => void` | Structured errors, `[]` when resolved |
| `queryLoader` | `React.ReactNode` | Custom loading indicator; defaults to a spinner |
| `onParseResult` | `(result: ParseResult \| null) => void` | Callback when the parse result changes |

### Parser and prompt (server-side)

Parsers take the library's JSON Schema, not the library itself:

```ts
import { createParser, createStreamingParser } from "@openuidev/react-lang";

const parser = createParser(library.toJSONSchema(), library.root);
const result = parser.parse(output);

const streaming = createStreamingParser(library.toJSONSchema(), library.root);
streaming.push(chunk); // returns the latest ParseResult
```

`result.meta.errors` holds structured errors with a `code` (`missing-required`, `null-required`, `type-mismatch`, `unknown-component`, `unknown-function`, `excess-args`, `inline-reserved`, `no-root`). The parser stays permissive and renders what it can. `meta.unresolved` lists names referenced but never defined; during streaming these are expected forward references.

`generateSystemPrompt`, `buildMessage`, `parseMessage` and `mergeStatements` are re-exported from `@openuidev/lang-core`. Stored messages are described in the [message protocol](https://openui.com/docs/openui-lang/message-protocol).

### Context Hooks

Use these inside component renderers to interact with the rendering context:

| Hook | Description |
| :--- | :--- |
| `useIsStreaming()` | Whether the model is still streaming |
| `useRenderNode()` | Render child element nodes |
| `useTriggerAction()` | Trigger an action event |
| `useGetFieldValue()` | Get a form field's current value |
| `useSetFieldValue()` | Set a form field's value |
| `useStateField(name, value)` | Read and write a field or bound `$variable` |
| `useSetDefaultValue()` | Set a field's default value |
| `useFormName()` | Get the current form's name |

### Form Validation

| Export | Description |
| :--- | :--- |
| `useFormValidation()` | Access form validation state |
| `useCreateFormValidation()` | Create a form validation context |
| `validate(value, rules)` | Run validation rules against a value |
| `builtInValidators` | Built-in validators (required, email, min, max, etc.) |

### Types

```ts
import type {
  Library,
  LibraryDefinition,
  DefinedComponent,
  ComponentRenderer,
  ComponentRenderProps,
  ComponentGroup,
  PromptOptions,
  RendererProps,
  ActionEvent,
  ElementNode,
  ParseResult,
  OpenUIError,
} from "@openuidev/react-lang";
```

## JSON Schema Output

Libraries can also produce a JSON Schema representation of their components:

```ts
const schema = library.toJSONSchema();
// schema.$defs["Card"]     → { properties: {...}, required: [...] }
// schema.$defs["Greeting"] → { properties: {...}, required: [...] }
```

## Documentation

- [React API reference](https://openui.com/docs/api-reference/react-lang)
- [OpenUI Lang guide](https://openui.com/docs/openui-lang)
- [Language specification 1.0](https://openui.com/docs/openui-lang/specification)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/react-lang)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
