# The OpenUI Prompt and LibrarySpec

**1.0-beta, community review draft**

This document specifies everything that is sent to the model: the LibrarySpec a library serializes to, the system prompt generated from it, and the shape of the conversation the model sees. MUST, MUST NOT, SHOULD, and MAY are used as in RFC 2119, and *(proposed)* marks designed but unshipped behavior.

## 1. Overview

The model's entire knowledge of your UI system comes from two places:

1. **The system prompt**: a deterministic function of the LibrarySpec, a set of feature flags, and a prompt template version (section 4). It teaches the language rules, the component vocabulary, and only the features the client supports.
2. **The conversation**: user messages, the model's own earlier OpenUI Lang responses, and context the host injects (error reports, form state, the current program in edit mode).

Nothing else is sent. There is no hidden capability negotiation: if the prompt did not teach it, the model was not told about it, and the prompt MUST NOT teach features the target client does not support.

## 2. The LibrarySpec

A library serializes into two documents today. `library.toSpec()` emits the component signatures, for prompt generation:

```json
{
  "root": "Card",
  "components": {
    "Button": {
      "signature": "Button(label: string, action?: ActionExpression, variant?: \"primary\" | \"secondary\")",
      "description": "A clickable button"
    }
  },
  "componentGroups": []
}
```

`library.toJSONSchema()` emits the validation schema, the machine-readable half a client validates against. It carries one `$defs` entry per component:

```json
{
  "$defs": {
    "Button": {
      "type": "object",
      "properties": {
        "label": { "type": "string" },
        "action": {},
        "variant": { "type": "string", "enum": ["primary", "secondary"] }
      },
      "required": ["label"]
    }
  }
}
```

Reading it: the key order of `properties` is the positional argument order, so `Button("Save", a, "primary")` maps label, action, variant in that order; `required` lists the props whose absence invalidates the component; a property's `default` value fills a missing required argument before the component is dropped. Because the positional contract rides on JSON object key order, producers MUST emit `properties` in schema key order and consumers MUST parse with an order-preserving JSON parser.

The CLI (`npx @openuidev/cli generate`) emits both artifacts by default: the system prompt, and a spec document combining `toSpec()` with a `schema` key holding `toJSONSchema()`. With `--out prompt.txt` the spec lands beside the prompt as `prompt.spec.json`; `--json-schema` prints the validation schema alone, and `--spec` prints the combined document.

A unified LibrarySpec document *(proposed)* bundles both, adds a library name, and carries `functions`, `validators`, and `actions` registries as declarations only (name, params schema, return type, description); implementations never serialize. The document self-describes its format with `specVersion`, the version of this specification it conforms to, distinct from the library's own `version` (which tracks the library's content). It stores no signature strings: the schema is the single source of truth (its property key order is the positional contract), and the TypeScript-style signature is derived from it by the prompt template, so the two can never drift. A backend that wants the prompt calls `generateSystemPrompt` rather than reading a stored string; the CLI's current combined output still carries legacy signature strings during the transition. It also adds the `bindable` marker for two-way-binding props and the form-component markers; until those land, a prompt generated from the spec alone cannot enable the `bindings` flag faithfully, because bindability lives only in the library definition today. The LibrarySpec is the interchange format between platforms: a Kotlin library and a TypeScript library that emit the same spec are interchangeable.

The LibrarySpec drives prompt generation and validation. It does not drive rendering: components are implemented natively on each platform, and each platform's library definition owns its components' behavior, including which props are bindable and how inputs attach to forms. A native client is not a generic schema-driven widget engine; it is the same components, written for that platform, agreeing on one contract.

## 3. Conformance rules for libraries

- Component names MUST start with an uppercase letter and match the identifier rule; other declared names MUST start lowercase.
- Required props MUST precede optional props in schema key order.
- Key order is part of the public contract; a reorder is a breaking change to every stored program and prompt.
- Libraries MUST NOT define components named `Query`, `Mutation`, or `Action`, and MUST NOT register functions shadowing built-ins.
- Every component in `root` and in `componentGroups` MUST exist in `components`.
- Argument constraints *(proposed)* are limited to the JSON-Schema-mappable keywords, so any platform can enforce them from the schema document alone: `minLength`, `maxLength`, `pattern`, `format` (`uri`, `email`) on strings; `minimum`, `maximum`, integer type on numbers; `minItems`, `maxItems` on arrays; `default` on any prop. A violation renders the value as-is and reports a warning diagnostic; it MUST NOT drop the component. Custom-function refinements do not serialize and are unsupported; implementations SHOULD ignore them with a definition-time warning.
- Definition-time enforcement of these rules is proposed; the reference `createLibrary` currently checks only that `root` names a member component.

## 4. Prompt generation

The system prompt is a deterministic function of the LibrarySpec, a set of flags, and a prompt template. The canonical entry point is `generateSystemPrompt({ library, promptOptions })`; the older flat `generatePrompt(spec)` form is deprecated. The canonical template is the reference implementation's generator at a tagged release; this document does not reprint it, so byte-level determinism is defined against that tagged template, and publishing the template as a normative appendix is planned alongside the fixture suite. Given the same spec, flags, and template version, prompt generators MUST produce the same prompt bytes, whichever platform runs them. This determinism lets a gateway generate the prompt server-side from a client's LibrarySpec and get identical model behavior to a client that generated it locally.

The flags gate feature sections: `toolCalls` (queries, mutations, tools), `bindings` (state and `$binding<type>` props), `editMode` (patching), `inlineMode` (prose plus fenced code). Built-in function documentation appears only when `toolCalls` or `bindings` is set.

The generated prompt contains, in order: the syntax rules (statement shape, positional arguments, the root convention: a single component statement named `root`), the component catalog (section 5), the flag-gated sections for built-ins and tools, the hoisting and streaming guidance, and the flag-gated sections for editing and inline mode. Components render in the spec's key order. `componentGroups` are named groups (`{ name, components, notes? }`) that organize the catalog into titled sections; every listed component must exist in `components`.

Tool descriptors are supplied to prompt generation as options, not in the LibrarySpec today: each is a name string or a ToolSpec (`{ name, description?, inputSchema, outputSchema, annotations? }`). Tools are described to the model with their names, typed signatures, and default values derived from their output schemas. The unified LibrarySpec *(proposed)* will carry tool declarations so spec-driven generation can build this section.

## 5. Component signatures and descriptions

Each component appears in the prompt as a single-line signature joined to its description; the separator in the current template is the em dash character:

```
Button(label: string, action?: ActionExpression, variant?: "primary" | "secondary") — A clickable button
```

The signature line MUST stay single-line so it can be quoted whole in prompts and logs. Error `hint` fields do not reuse it: they carry a compact signature built from the JSON Schema, prop names only with required props starred ([language.md](./language.md), section 8.3).

The signature string format is part of the template: primitive types print as `string`, `number`, `boolean`, `any`; enums as quoted alternatives joined by `|`; arrays as `T[]`; inline objects as `{field: type}`; unions joined by `|`; optional props with `?` before the colon; bindable props as `$binding<type>`. Names like `ActionExpression` come from schema id tags the library registers for non-component schemas. The exact grammar of the signature string is pinned by the reference template and will appear in the normative template appendix.

Per-prop descriptions and usage examples *(proposed)* render as a JSDoc block above the signature. `@param` lines come from prop descriptions in the schema (`.describe()` in the Zod definition, a `description` field in the LibrarySpec); `@example` lines come from the component's `example` field (a string or an array of strings, one `@example` entry each):

```
/**
 * A clickable button
 * @param label - Text shown on the button
 * @param variant - Visual weight, defaults to primary
 * @example
 * btn = Button("Save changes", saveAction, "primary")
 */
Button(label: string, action?: ActionExpression, variant?: "primary" | "secondary")
```

Argument constraints (section 3) also render here *(proposed)*: a deterministic suffix on the `@param` line, derived from the schema, so the model learns the constraint without the author restating it: `@param value - Stars filled (integer, 0 to 5)`, `@param items - (min 2 items)`. A constraint with no hand-written description still produces its `@param` line.

JSDoc is chosen because models require no teaching to read it, and because it costs nothing when unused: the block appears only when a component has prop descriptions, an argument constraint, or an example; otherwise the component keeps the compact single-line form, and a library with none of these produces no boilerplate at all. Descriptions SHOULD add semantics the type does not carry (units, ranges, when to use which enum member), not restate the type. *(Today the reference prompt generator drops per-prop descriptions; this section is the fix for that gap.)*

## 6. The conversation

### 6.1 Assistant history

The model's earlier responses appear in history as the OpenUI Lang text it generated (with surrounding prose when inline mode is on). History is the strongest style signal the model gets: whatever form its earlier messages use is the form it will continue to use, so the stored form of history matters (a wire and storage split for stored history is under exploration and not part of this specification).

### 6.2 Error feedback

When a response produced errors, the host SHOULD include the structured error list (wire shape in [language.md](./language.md), section 8.3) in the next request context. The `hint` field is designed so the model can produce a one-line patch without re-reading the library documentation.

### 6.3 Action events

A `continue_conversation` event becomes the next user-side turn: the human-friendly message, the event context, and the current form state travel together, so the model sees what the user entered without asking.

### 6.4 Edit mode

With `editMode` on, the host sends the current program with the request, and the prompt teaches the model to respond with only the changed statements. Without it, every response is a complete program.

## Appendix A. Changelog

- **2026-08-05**: Draft renamed from 0.9 to 1.0-beta; earlier entries keep the old name.
- **2026-08-04**: Argument constraints limited to the JSON-Schema-mappable keywords with warn-and-render recovery, rendered as deterministic `@param` suffixes; `example` documented as string or array; CLI section updated to PR #811 behavior (default generate emits prompt plus `.spec.json`, `--json-schema` prints the validation schema, `generateSystemPrompt` canonical); unified LibrarySpec standardized as schema-only with signatures derived by the prompt template.
- **2026-08-03**: Split out of the 0.9 draft as its own document; added the conversation contract and the proposed JSDoc form for per-prop descriptions and examples. Review fixes: determinism scoped to a tagged prompt template, the validation-schema half of the LibrarySpec documented with the order-preserving requirement, CLI output described as shipped, tool descriptor input defined, signature format and the em dash separator documented as emitted.
