# Material UI Chat

A generative UI chat example using Material UI components with OpenUI.

## Getting Started

1. Set your OpenAI API key:

```bash
export OPENAI_API_KEY=sk-...
```

2. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to try it out.

## How it works

- **MUI Components**: All UI components are built with Material UI v7
- **Generative UI**: The LLM generates UI on the fly using openui-lang syntax
- **Streaming**: Real-time streaming of generated UI via SSE
- **Tools**: Built-in tools for weather, stocks, and web search

## Component Library

The example includes a full MUI component library with 7 categories:

- Content: TextContent, Separator, CodeBlock, MarkDownRenderer
- Data Display: Card, Badge, Avatar, Alert, Progress, ImageBlock
- Charts: BarChart, LineChart, AreaChart, PieChart (via Recharts)
- Forms: Form, Input, TextArea, Select, CheckBoxGroup, RadioGroup, SwitchGroup, Slider, DatePicker
- Buttons: Button, Buttons
- Layout: Stack, Tabs, Accordion
- Tables: Table with column definitions

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts    # OpenAI streaming API route
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with MUI ThemeProvider
│   └── page.tsx              # Chat UI page
├── hooks/
│   └── use-system-theme.tsx  # Theme detection (light/dark)
├── lib/
│   └── mui-genui/
│       ├── index.ts              # Library definition & component groups
│       └── components/           # Individual component definitions
└── library.ts                # CLI prompt generation entry point
```
