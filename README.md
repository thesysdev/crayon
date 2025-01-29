<a href="https://www.crayonai.org">
  <img src="https://crayonai.org/img/social-card.png" alt="crayonai"/>
</a>

<p align="center">
  <a href="https://crayonai.org">Homepage</a> ·
  <a href="https://crayonai.org/docs/getting-started">Documentation</a> ·
  <a href="https://thesys.dev">Thesys</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  <a href="https://x.com/thesysdev"><img src="https://img.shields.io/twitter/url/https/twitter/follow/thesysdev?style=social&label=Follow%20%40thesys" alt="Thesys: Visit" /></a>
  <a href="https://discord.gg/Pbv5PsqUSv"><img src="https://img.shields.io/badge/Discord-Join-blue.svg" alt="Discord: Join" /></a>
  <img src="https://github.com/thesysdev/crayon/actions/workflows/deploy.yml/badge.svg" alt="Deploy Status" />
  <img src="https://github.com/thesysdev/crayon/actions/workflows/build.yml/badge.svg" alt="Build Status" />
</p>

# Crayon
**Generative UI** SDK for your AI agents. <br />

Crayon is a UI framework for building agentic UI interfaces beyond just text. It is a set of extensible React components, lightweight state management and hooks to help you build your own UI that seamlessly integrates with any backend.

## Quick Start

Install the Crayon package:
```bash
npm install @crayonai/react-core
```

Create a new Crayon component:
```tsx
import { type ResponseTemplate, CrayonChat } from "@crayonai/react-core";

const templates: ResponseTemplate[] = [
  {
    name: "breakdown_expenses",
    component: BreakdownExpenses,
  },
]

export default function App() {
  return <CrayonChat templates={templates}/>;
}
```

## Packages

- [react-core](./frontend-sdk/packages/react-core): Core framework and hooks for managing state and agents
- [react-ui](./frontend-sdk/packages/react-ui): Modular UI components for use with Crayon
