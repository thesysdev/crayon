This example uses [OpenUI](https://openui.com) to generate a self-contained HTML/CSS/JavaScript experience. The `HtmlArtifact` component keeps a compact status preview inline and opens a detailed right panel with Raw and Rendered tabs. Raw displays the incoming source; Rendered shows a loading state, then a sandboxed iframe when the stream completes.

This is intentionally a minimal example. Before using generated HTML in production, normalize and validate it, enforce a Content Security Policy, restrict network access, and validate iframe messages.

## Getting Started

First, create a `.env` file:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5.5
```

Then run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The generated component is defined in `src/html-artifact.tsx`, its OpenUI library and prompt rules are in `src/library.ts`, and the model route is in `src/app/api/chat/route.ts`.

## OpenAI-compatible APIs

The example chat app supports OpenAI-compatible APIs through the optional `OPENAI_BASE_URL` environment variable.

Example using OpenRouter:

```env
OPENAI_API_KEY=sk-or-v1-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-5.5
```

This also works with other OpenAI-compatible providers.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
