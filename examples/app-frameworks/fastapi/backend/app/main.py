"""Minimal FastAPI backend — streams OpenUI Cloud completions as NDJSON."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from starlette.responses import StreamingResponse

load_dotenv()

# Embed client: Chat Completions → POST /v1/embed/chat/completions
client = AsyncOpenAI(
    api_key=os.environ.get("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)
MODEL = os.environ.get("OPENUI_MODEL", "google/gemini-3.6-flash-free")

# Same payload as generateSystemPrompt({ cloud: true }) from @openuidev/lang-core.
CLOUD_SYSTEM_PROMPT = ']]>openui:config\n{"libraryVersion": "0.1.0"}'

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/chat")
async def chat(body: dict):
    messages = body.get("messages") or []
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": CLOUD_SYSTEM_PROMPT}, *messages],
        stream=True,
    )

    async def ndjson_stream():
        async for chunk in stream:
            yield chunk.model_dump_json(exclude_none=True, exclude_unset=True) + "\n"

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
