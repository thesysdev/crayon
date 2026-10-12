"""Minimal FastAPI backend — streams OpenUI Cloud completions as NDJSON."""
import json
import os
from pathlib import Path
from urllib.parse import quote

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from starlette.responses import JSONResponse, StreamingResponse

load_dotenv()

THESYS_API_URL = "https://api.thesys.dev"
MODEL = "google/gemini-3.6-flash-free"

# Embed client: Chat Completions → POST /v1/embed/chat/completions
client = AsyncOpenAI(
    api_key=os.environ.get("THESYS_API_KEY"),
    base_url=f"{THESYS_API_URL}/v1/embed",
)

SPEC_PATH = Path(__file__).resolve().parents[2] / "frontend" / "src" / "generated" / "spec.json"


def cloud_system_prompt() -> str:
    """Same payload as generateSystemPrompt({ cloud: true, library }) from @openuidev/lang-core."""
    if not SPEC_PATH.is_file():
        raise RuntimeError(f"Missing {SPEC_PATH}. From frontend/, run: pnpm generate")
    spec = json.loads(SPEC_PATH.read_text())
    chat_library = {
        key: spec[key]
        for key in ("schema", "root", "componentGroups", "id")
        if key in spec and spec[key] is not None
    }
    return "]]>openui:config\n" + json.dumps({"chatLibrary": chat_library})


def message_text(message: dict) -> str:
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(part.get("text", "") for part in content if part.get("type") == "text")
    return ""


async def store_turn(thread_id: str | None, question: dict, answer: str) -> None:
    """Chat Completions doesn't save conversations, so store each turn in the thread's
    Cloud conversation. useOpenuiCloudStorage() loads it when the thread is reopened.
    Python twin of storeChatCompletionHistory() from @openuidev/server/openai."""
    if not thread_id:
        return
    items = [
        {"type": "message", "role": "user", "content": [{"type": "input_text", "text": text}]}
        for text in [message_text(question)]
        if text
    ]
    if answer:
        items.append(
            {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": answer}]}
        )
    if not items:
        return
    try:
        async with httpx.AsyncClient() as http:
            res = await http.post(
                f"{THESYS_API_URL}/v1/conversations/{quote(thread_id, safe='')}/items",
                headers={"Authorization": f"Bearer {os.environ.get('THESYS_API_KEY')}"},
                json={"items": items},
            )
            res.raise_for_status()
    except httpx.HTTPError as error:
        print(f"Could not store the turn in the Cloud conversation: {error}")


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/frontend-token")
async def frontend_token():
    """Mints the short-lived token useOpenuiCloudStorage() sends with its Conversations API
    calls, so the browser reaches only this user's threads and never sees THESYS_API_KEY."""
    async with httpx.AsyncClient() as http:
        res = await http.post(
            f"{THESYS_API_URL}/v1/frontend-tokens",
            headers={"Authorization": f"Bearer {os.environ.get('THESYS_API_KEY')}"},
            # No sign-in, so every browser shares one local user.
            json={"user_id": "demo-user", "app_id": "fastapi-example"},
        )
    if res.is_error:
        return JSONResponse(
            {"error": f"OpenUI Cloud could not create a frontend token: {res.text}"},
            status_code=res.status_code,
        )
    data = res.json()
    return JSONResponse(
        {"token": data["token"], "expires_at": data["expires_at"]},
        headers={"Cache-Control": "private, no-store"},
    )


@app.post("/api/chat")
async def chat(body: dict):
    messages = body.get("messages") or []
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": cloud_system_prompt()}, *messages],
        stream=True,
    )

    async def ndjson_stream():
        answer = ""
        try:
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    answer += chunk.choices[0].delta.content
                yield chunk.model_dump_json(exclude_none=True, exclude_unset=True) + "\n"
        finally:
            if messages:
                await store_turn(body.get("threadId"), messages[-1], answer)

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
