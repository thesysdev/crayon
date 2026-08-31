"""Minimal FastAPI backend — streams OpenUI Cloud Responses as SSE."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from starlette.responses import StreamingResponse

load_dotenv()

# Embed client: Responses → POST /v1/embed/responses
# (Chat Completions would be POST /v1/embed/chat/completions via chat.completions.create)
client = AsyncOpenAI(
    api_key=os.environ.get("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)
MODEL = "google/gemini-3.6-flash-free"

# Same payload as generateSystemPrompt() from @openuidev/thesys-server.
CLOUD_SYSTEM_PROMPT = ']]>openui:config\n{"libraryVersion": "0.1.0"}'

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/chat")
async def chat(body: dict):
    messages = body.get("messages") or []
    stream = await client.responses.create(
        model=MODEL,
        instructions=CLOUD_SYSTEM_PROMPT,
        input=messages,
        stream=True,
    )

    async def sse():
        async for event in stream:
            yield f"data: {event.model_dump_json(exclude_none=True)}\n\n"

    return StreamingResponse(
        sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )
