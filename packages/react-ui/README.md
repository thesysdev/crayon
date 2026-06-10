# @openuidev/react-ui

React components and chat layouts for OpenUI. Use the ready-made chat surfaces, the built-in model-renderable component library, or the individual UI primitives in your own layout.

[![npm](https://img.shields.io/npm/v/@openuidev/react-ui)](https://www.npmjs.com/package/@openuidev/react-ui)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/react-ui)](https://www.npmjs.com/package/@openuidev/react-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [Package docs](https://openui.com/docs/api-reference/react-ui) | [Chat docs](https://openui.com/docs/chat) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless
# or
pnpm add @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `zustand ^4.5.5`, `@openuidev/react-lang`, `@openuidev/react-headless`

Don't forget to import the component styles:

```ts
import "@openuidev/react-ui/components.css";
```

## Overview

This package provides three layers:

1. **Chat layouts** for full-screen chat, copilots, and bottom-tray experiences.
2. **Model-renderable components** for charts, tables, forms, cards, and other OpenUI Lang output.
3. **Standalone UI primitives** such as `Button`, `Card`, `Table`, `Charts`, and the chat shell pieces.

## Quick Start

The fastest way to get a working chat app:

```tsx
import { FullScreen } from "@openuidev/react-ui";
import "@openuidev/react-ui/components.css";

function App() {
  return (
    <FullScreen
      apiUrl="/api/chat"
      threadApiUrl="/api/threads"
    />
  );
}
```

### Chat Layouts

| Component | Description |
| :--- | :--- |
| `FullScreen` | Full-page chat with a thread sidebar |
| `Copilot` | Side-panel copilot overlay |
| `BottomTray` | Collapsible bottom tray chat |

All chat layouts accept `apiUrl`, `threadApiUrl`, and theming props. See the [chat docs](https://openui.com/docs/chat) for full configuration.

### Copilot example

```tsx
import { Copilot } from "@openuidev/react-ui";

function App() {
  return (
    <div>
      <main>Your app content</main>
      <Copilot apiUrl="/api/chat" threadApiUrl="/api/threads" />
    </div>
  );
}
```

## Built-in Component Libraries

The package ships with two preconfigured OpenUI Lang libraries:

| Export | Description |
| :--- | :--- |
| `openuiLibrary` | Full component library for charts, tables, forms, cards, images, and more |
| `openuiChatLibrary` | Chat-optimized subset with follow-ups, steps, and callouts |

Use them directly when building custom chat experiences:

```tsx
import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui";

function AssistantMessage({ content, isStreaming }) {
  return (
    <Renderer
      response={content}
      library={openuiLibrary}
      isStreaming={isStreaming}
    />
  );
}
```

Generate a system prompt from the library:

```ts
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);
```

## Theming

Wrap your app in `ThemeProvider` to customize colors, typography, spacing, and effects:

```tsx
import { ThemeProvider, createTheme } from "@openuidev/react-ui";

const customTheme = createTheme({
  primary: "#6366f1",
  background: "#fafafa",
  foreground: "#1a1a1a",
});

function App() {
  return (
    <ThemeProvider mode="light" lightTheme={customTheme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

| Export | Description |
| :--- | :--- |
| `ThemeProvider` | Context provider for theming |
| `createTheme(overrides)` | Create a theme with validation and defaults |
| `defaultLightTheme` | Built-in light theme |
| `defaultDarkTheme` | Built-in dark theme |
| `swatchTokens` | Token palette for use in theme builders |

## Styling integration

OpenUI's component styles live inside a CSS cascade layer named `openui`. Any unlayered consumer CSS overrides OpenUI without `!important` or specificity matching:

```css
@import "@openuidev/react-ui/components.css";

/* Wins, no specificity tricks needed */
.openui-button-base-primary { background: hotpink; }
```

### With Tailwind v4

Declare layer order at the top of your entry stylesheet so `openui` sits above Tailwind's reset but below `components` and `utilities`:

```css
@layer theme, base, openui, components, utilities;
@import "@openuidev/react-ui/components.css";
@import "tailwindcss";
```

This places Tailwind's Preflight (in `base`) below OpenUI components so its element resets don't override them, while keeping utilities (`bg-red-500`, etc.) winning over OpenUI styles.

### With Tailwind v3, CSS Modules, or CSS-in-JS

No configuration needed — these all emit unlayered CSS, which automatically beats anything in `@layer openui`.

### Browser support

CSS cascade layers require Chrome 99+, Firefox 97+, Safari 15.4+, or Edge 99+ (all baseline from March 2022). On older browsers, the `@layer { ... }` block is dropped entirely and components render unstyled. The package declares this floor via the `browserslist` field in its `package.json`.

## Components

All components are available as individual imports:

| Category | Components |
| :--- | :--- |
| **Layout** | `Card`, `CardHeader`, `SectionBlock`, `Tabs`, `Accordion`, `Carousel`, `Separator`, `Steps` |
| **Data Display** | `Table`, `Charts` (bar, line, area, pie, radar, scatter), `ListBlock`, `ListItem`, `Tag`, `TagBlock`, `CodeBlock`, `Image`, `ImageBlock`, `ImageGallery` |
| **Forms** | `Input`, `TextArea`, `Select`, `CheckBoxGroup`, `CheckBoxItem`, `RadioGroup`, `RadioItem`, `SwitchGroup`, `SwitchItem`, `Slider`, `DatePicker`, `FormControl`, `Label` |
| **Actions** | `Button`, `Buttons`, `IconButton`, `FollowUpBlock`, `FollowUpItem` |
| **Feedback** | `Callout`, `TextCallout`, `MessageLoading` |
| **Content** | `TextContent`, `MarkDownRenderer` |
| **Chat** | `FullScreen`, `Copilot`, `BottomTray`, `Shell.*`, `CopilotShell.*`, `ToolCall`, `ToolResult` |

### Per-component imports

For smaller bundles, import components individually:

```ts
import { Button } from "@openuidev/react-ui/Button";
import { Card } from "@openuidev/react-ui/Card";
import { Charts } from "@openuidev/react-ui/Charts";
```

## Subpath Exports

| Import path | Description |
| :--- | :--- |
| `@openuidev/react-ui` | All components and libraries |
| `@openuidev/react-ui/components.css` | Compiled component styles |
| `@openuidev/react-ui/genui-lib` | OpenUI Lang libraries and prompt options |
| `@openuidev/react-ui/tailwind` | Tailwind CSS plugin |
| `@openuidev/react-ui/styles/*` | SCSS utilities |
| `@openuidev/react-ui/scssUtils` | SCSS utility functions |
| `@openuidev/react-ui/<Component>` | Per-component entry points |

## Documentation

- [React UI API reference](https://openui.com/docs/api-reference/react-ui)
- [Chat guides](https://openui.com/docs/chat)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/react-ui)


## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
