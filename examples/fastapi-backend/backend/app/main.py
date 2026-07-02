"""Minimal FastAPI backend — streams OpenAI completions as NDJSON."""
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from starlette.responses import StreamingResponse

load_dotenv()

client = AsyncOpenAI()
MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.5")

PROMPT_FILE = Path(__file__).parent / "system_prompt.txt"
if not PROMPT_FILE.is_file():
    raise RuntimeError(
        f"Missing {PROMPT_FILE} — generate it by running `npm run generate:prompt` "
        "in the frontend/ directory."
    )
DEFAULT_SYSTEM_PROMPT = PROMPT_FILE.read_text(encoding="utf-8")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/chat")
async def chat(body: dict):
    system_prompt = body.get("systemPrompt") or DEFAULT_SYSTEM_PROMPT
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system_prompt}, *body["messages"]],
        stream=True,
    )

    async def ndjson_stream():
        async for chunk in response:
            yield chunk.model_dump_json(exclude_none=True, exclude_unset=True) + "\n"

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
