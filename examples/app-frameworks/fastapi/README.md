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
│  • openAIResponses-    │   SSE   │  • OpenUI Cloud         │
│    Adapter()           │ ◄────── │    Responses API        │
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
│       └── main.py          # Streaming chat endpoint
└── frontend/
    ├── package.json
    ├── vite.config.js       # Vite + proxy to localhost:8000
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx          # Identical to genui-chat-app
        └── index.css
```

## Getting Started

### Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (or pip)
- Node.js 18+
- An OpenUI Cloud API key (https://console.thesys.dev/keys)

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Add your key to `backend/.env`:

```
THESYS_API_KEY=sk-th-...
```

### 2. Start the backend

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

### 3. Start the frontend

```bash
cd frontend
pnpm install --ignore-workspace
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## What's in This Example

### `backend/app/main.py`

A FastAPI endpoint that:

1. Receives `{ messages }` as JSON (OpenAI Responses `input` items)
2. Calls OpenUI Cloud's Responses API (`POST /v1/embed/responses`)
3. Yields each event as SSE — the same stream `openAIResponsesAdapter()` parses

Chat Completions (`POST /v1/embed/chat/completions` via `chat.completions.create`) is the drop-in alternative if you already speak that protocol.

### `frontend/src/App.jsx`

Uses `fetchLLM` with `openAIResponsesAdapter()` and `openAIConversationMessageFormat()` to match the Responses stream from FastAPI.

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — core building blocks: Library, Prompt Generator, Parser, Renderer
- [`@openuidev/react-lang` package](../../../packages/react-lang)
- [`@openuidev/react-headless` package](../../../packages/react-headless) — streaming adapters and message format converters

## Verify

From `frontend/`, the verification script builds the client and syntax-checks the Python backend:

```bash
pnpm verify
```
