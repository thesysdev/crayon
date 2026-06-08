# OpenUI × FastAPI Example

A full-stack example that demonstrates using `@openuidev/react-ui` with a [FastAPI](https://fastapi.tiangolo.com/) (Python) backend. The LLM streams responses in [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) and the React frontend renders them as live components in real time.

This is the first example in the repo using a non-Node.js backend — the same frontend that works with Next.js works here unchanged.

## Architecture

```
┌────────────────────────┐         ┌─────────────────────────┐
│  Vite + React          │  POST   │  FastAPI (Python)       │
│  (port 5173)           │ ──────► │  (port 8000)            │
│                        │         │                         │
│  • FullScreen UI       │         │  • POST /api/chat       │
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
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## What's in This Example

### `backend/app/main.py`

A FastAPI endpoint that:

1. Receives `{ systemPrompt, messages }` as JSON
2. Forwards the conversation to the OpenAI streaming API
3. Yields each chunk as a NDJSON line — the same format the JavaScript SDK's `toReadableStream()` produces

### `frontend/src/App.jsx`

Identical to the one scaffolded by `npx @openuidev/cli create`. Uses `openAIReadableStreamAdapter()` to parse the NDJSON stream from the backend — no frontend changes were needed to switch from Next.js to FastAPI.

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — core building blocks: Library, Prompt Generator, Parser, Renderer
- [`@openuidev/react-lang` package](../../packages/react-lang)
- [`@openuidev/react-headless` package](../../packages/react-headless) — streaming adapters and message format converters
