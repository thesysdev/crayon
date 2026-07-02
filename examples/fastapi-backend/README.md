# OpenUI × FastAPI Example

A full-stack example that demonstrates using `@openuidev/react-ui` with a [FastAPI](https://fastapi.tiangolo.com/) (Python) backend. The LLM streams responses in [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) and the React frontend renders them as live components in real time.

This is the first example in the repo using a non-Node.js backend — the same frontend that works with Next.js works here unchanged.

## Architecture

```
┌────────────────────────┐         ┌─────────────────────────┐
│  Vite + React          │  POST   │  FastAPI (Python)       │
│  (port 5173)           │ ──────► │  (port 8000)            │
│                        │         │                         │
│  • AgentInterface UI   │         │  • POST /api/chat       │
│  • openAIReadable-     │  NDJSON │  • OpenAI streaming     │
│    StreamAdapter()     │ ◄────── │  • AsyncOpenAI client   │
└────────────────────────┘         └─────────────────────────┘
```

The Vite dev server proxies `/api/*` to FastAPI, so CORS is handled transparently.

## Project Structure

```
fastapi-backend/
├── backend/
│   ├── .env.example         # Environment template
│   ├── pyproject.toml       # Python dependencies
│   └── app/
│       ├── main.py          # Streaming chat endpoint
│       └── system_prompt.txt # Generated OpenUI system prompt (see below)
└── frontend/
    ├── package.json
    ├── vite.config.js       # Vite + proxy to localhost:8000
    ├── index.html
    ├── scripts/
    │   └── generate-prompt.mjs # Writes backend/app/system_prompt.txt
    └── src/
        ├── main.jsx
        ├── App.jsx          # fetchLLM + AgentInterface
        └── index.css
```

## Getting Started

### Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (or pip)
- Node.js 18+
- An OpenAI API key

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Add your key to `backend/.env`:

```
OPENAI_API_KEY=sk-...
```

### 2. Generate the system prompt (first run only)

The backend reads the OpenUI system prompt from `backend/app/system_prompt.txt` at startup. A generated copy is checked in, so this step is only needed if the file is missing or after upgrading `@openuidev/react-ui`:

```bash
cd frontend
npm install
npm run generate:prompt
```

### 3. Start the backend

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Or with pip:

```bash
pip install fastapi openai python-dotenv uvicorn
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## What's in This Example

### `backend/app/main.py`

A FastAPI endpoint that:

1. Loads the OpenUI system prompt from `app/system_prompt.txt` at startup (fails fast with a pointer to `npm run generate:prompt` if the file is missing)
2. Receives `{ threadId, runId, messages, tools, context }` as JSON — the body `fetchLLM` sends; `systemPrompt` may optionally be included to override the server-side default
3. Forwards the conversation to the OpenAI streaming API
4. Yields each chunk as a NDJSON line — the same format the JavaScript SDK's `toReadableStream()` produces

### `frontend/src/App.jsx`

Wires `AgentInterface` to the backend with `fetchLLM({ url: "/api/chat", streamAdapter: openAIReadableStreamAdapter(), messageFormat: openAIMessageFormat })`. The system prompt is owned by the backend, so the client sends only the conversation — no frontend changes were needed to switch from Next.js to FastAPI.

### `frontend/scripts/generate-prompt.mjs`

A small Node script that imports `openuiLibrary` and `openuiPromptOptions` from `@openuidev/react-ui/genui-lib` and writes the generated prompt to `backend/app/system_prompt.txt`. Run it via `npm run generate:prompt` after upgrading `@openuidev/react-ui`.

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — core building blocks: Library, Prompt Generator, Parser, Renderer
- [`@openuidev/react-lang` package](../../packages/react-lang)
- [`@openuidev/react-headless` package](../../packages/react-headless) — streaming adapters and message format converters
