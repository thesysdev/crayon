# @openuidev/vue-lang

Vue 3 bindings for OpenUI Lang. Define model-renderable Vue components, generate prompts from those definitions, and render streamed OpenUI Lang in a Vue app.

[![npm version](https://img.shields.io/npm/v/@openuidev/vue-lang)](https://www.npmjs.com/package/@openuidev/vue-lang)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/vue-lang)](https://www.npmjs.com/package/@openuidev/vue-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [OpenUI Lang docs](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/vue-lang
# or
pnpm add @openuidev/vue-lang
```

**Peer dependencies:** `vue >=3.5.0`

## Overview

`@openuidev/vue-lang` brings the OpenUI Lang runtime to Vue:

1. **Define Vue components** that a model is allowed to call, with Zod schemas for props.
2. **Generate prompts** from the component library.
3. **Render streamed output** with `<Renderer>` as OpenUI Lang arrives.

## Quick Start

### 1. Define a component

```vue
<script setup lang="ts">
import { defineComponent, type ComponentRenderProps } from "@openuidev/vue-lang";
import { z } from "zod";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: {
    setup(compProps: ComponentRenderProps<{ name: string; mood?: string }>) {
      return () => (
        <div class={compProps.props.mood === "excited" ? "text-xl font-bold" : ""}>
          Hello, {compProps.props.name}!
        </div>
      );
    },
  },
});
</script>
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/vue-lang";

const library = createLibrary({
  components: [Greeting, Card, Table /* ... */],
  root: "Card", // optional default root component
});
```

### 3. Generate a system prompt

```ts
const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant.",
  additionalRules: ["Always greet the user by name."],
  examples: ["<Greeting name='Alice' mood='happy' />"],
});
```

### 4. Render streamed output

```vue
<template>
  <Renderer
    :response="response"
    :library="library"
    :is-streaming="isStreaming"
    :on-action="handleAction"
  />
</template>

<script setup lang="ts">
import { Renderer } from "@openuidev/vue-lang";
</script>
```

## API Reference

### Component Definition

| Export                      | Description                                                                            |
| :-------------------------- | :------------------------------------------------------------------------------------- |
| `defineComponent(config)`   | Define a single component with a name, Zod props schema, description, and Vue renderer |
| `createLibrary(definition)` | Create a library from an array of defined components                                   |

### Rendering

| Export     | Description                                              |
| :--------- | :------------------------------------------------------- |
| `Renderer` | Vue component that parses and renders OpenUI Lang output |

**`RendererProps`:**

| Prop            | Type                                    | Description                                                       |
| :-------------- | :-------------------------------------- | :---------------------------------------------------------------- |
| `response`      | `string \| null`                        | Raw OpenUI Lang text from the model                               |
| `library`       | `Library`                               | Component library from `createLibrary()`                          |
| `isStreaming`   | `boolean`                               | Whether the model is still streaming (disables form interactions) |
| `onAction`      | `(event: ActionEvent) => void`          | Callback when a component triggers an action                      |
| `onStateUpdate` | `(state: Record<string, any>) => void`  | Callback when form field values change                            |
| `initialState`  | `Record<string, any>`                   | Initial form state for hydration                                  |
| `onParseResult` | `(result: ParseResult \| null) => void` | Callback when the parse result changes                            |
| `toolProvider`  | `Record<string, Function> \| McpClientLike \| null` | Tool provider for executing `Query()` and `Mutation()` tool calls |
| `queryLoader`   | `Component \| VNode \| null`            | Custom loading spinner / loader component shown during query loading |
| `onError`       | `(errors: OpenUIError[]) => void`       | Callback triggered with structured, LLM-friendly errors |

#### Errors

`ParseResult.meta.errors` contains structured `OpenUIError` objects. Each error has a `type` discriminant (currently always `"validation"`) and a `code` for consumer-side filtering:

| Code                | Meaning                                             |
| :------------------ | :-------------------------------------------------- |
| `missing-required`  | Required prop absent with no default                |
| `null-required`     | Required prop explicitly null with no default       |
| `unknown-component` | Component name not found in the library schema      |
| `excess-args`       | More positional args passed than the schema defines |

Errors do not affect rendering. The parser stays permissive and renders what it can. Use `code` to decide how to surface or log errors:

```ts
const result = parser.parse(output);
const critical = result.meta.errors.filter((e) => e.code === "unknown-component");
```

To check for unresolved references after streaming, inspect `meta.unresolved`:

```ts
if (result.meta.unresolved.length > 0) {
  console.warn("Unresolved refs:", result.meta.unresolved);
}
```

### Composables

Use these inside component renderers to interact with the rendering context:

| Composable             | Description                                  |
| :--------------------- | :------------------------------------------- |
| `useIsStreaming()`     | Whether the model is still streaming         |
| `useIsQueryLoading()`  | Whether any Query is currently fetching data |
| `useRenderNode()`      | Render child element nodes                   |
| `useTriggerAction()`   | Trigger an action event                      |
| `useGetFieldValue()`   | Get a form field's current value             |
| `useSetFieldValue()`   | Set a form field's value                     |
| `useSetDefaultValue()` | Set a field's default value                  |
| `useFormName()`        | Get the current form's name                  |

### Form Validation

| Export                   | Description                                           |
| :----------------------- | :---------------------------------------------------- |
| `useFormValidation()`    | Access form validation state                          |
| `createFormValidation()` | Create a form validation context                      |
| `validate(value, rules)` | Run validation rules against a value                  |
| `builtInValidators`      | Built-in validators (required, email, min, max, etc.) |

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
  RenderNodeResult,
  SubComponentOf,
  ActionEvent,
  ElementNode,
  ParseResult,
  LibraryJSONSchema,
} from "@openuidev/vue-lang";
```

## Tool Provider Support (Queries & Mutations)

OpenUI Lang connects to your backend through tools. You can register a `toolProvider` to handle data fetching (`Query()`) and updates (`Mutation()`) natively in Vue:

```vue
<template>
  <Renderer
    :response="response"
    :library="library"
    :tool-provider="toolProvider"
    :query-loader="SpinnerComponent"
    :on-error="handleErrors"
  />
</template>

<script setup lang="ts">
import { Renderer } from "@openuidev/vue-lang";
import SpinnerComponent from "./Spinner.vue";

const toolProvider = {
  async get_server_health(args: Record<string, unknown>) {
    const res = await fetch(`/api/health`);
    return res.json();
  },
  async create_ticket(args: Record<string, unknown>) {
    const res = await fetch(`/api/tickets`, {
      method: "POST",
      body: JSON.stringify(args)
    });
    return res.json();
  }
};

function handleErrors(errors: any[]) {
  console.error("OpenUI Errors:", errors);
}
</script>
```

## JSON Schema Output

Libraries can also produce a JSON Schema representation of their components:

```ts
const schema = library.toJSONSchema();
// schema.$defs["Card"]     → { properties: {...}, required: [...] }
// schema.$defs["Greeting"] → { properties: {...}, required: [...] }
```

## Documentation

- [OpenUI Lang guide](https://openui.com/docs/openui-lang)
- [Language specification](https://openui.com/docs/openui-lang/specification-v05)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/vue-lang)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
