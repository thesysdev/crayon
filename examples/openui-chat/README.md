This is an [OpenUI](https://openui.com) Agent Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Getting Started

First, create a `.env` file:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5.5
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/route.ts` and improving your agent
by adding system prompts or tools.

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

## Docker Usage

You can build the image either from the example directory or from the repository root.

### Option 1: From examples/openui-chat

```bash
cd examples/openui-chat
docker build -f Dockerfile -t openui-chat ../..
docker run --rm -p 3000:3000 -e OPENAI_API_KEY=your_api_key openui-chat
```

### Option 2: From repository root

```bash
docker build -f examples/openui-chat/Dockerfile -t openui-chat .
docker run --rm -p 3000:3000 -e OPENAI_API_KEY=your_api_key openui-chat
```

⚠️ The build context must be the repository root (either `.` or `../..`) because this example depends on pnpm workspace packages.

Notes:

- The Docker build uses pnpm workspace dependencies from the monorepo.
- Runtime uses Next.js standalone output (`node examples/openui-chat/server.js`).
- A placeholder API key will start the app, but chat requests will return `401`.
