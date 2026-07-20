"""Minimal FastAPI backend — streams OpenAI completions as NDJSON."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from starlette.responses import StreamingResponse

load_dotenv()

client = AsyncOpenAI()
MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.5")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/chat")
async def chat(body: dict):
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": body["systemPrompt"]}, *body["messages"]],
        stream=True,
    )

    async def ndjson_stream():
        async for chunk in response:
            yield chunk.model_dump_json(exclude_none=True, exclude_unset=True) + "\n"

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
