import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { join } from "path";

const openUiSystemPrompt = readFileSync(
  join(process.cwd(), "generated/chat-system-prompt.txt"),
  "utf-8",
);

const markdownSystemPrompt = `You are a helpful assistant. Respond using clear, well-structured GitHub-Flavored Markdown.

Use headings, lists, tables, links, block quotes, and fenced code blocks when they make the response easier to understand.

Return only Markdown content. Do not emit OpenUI Lang, component syntax, JSON UI descriptions, or instructions for a renderer.`;

type ResponseMode = "markdown" | "openui";

interface ChatRequestBody {
  messages: unknown[];
  responseMode?: ResponseMode;
}

function invalidRequest(message: string) {
  return Response.json({ error: { message } }, { status: 400 });
}

function parseRequestBody(body: unknown): ChatRequestBody | Response {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidRequest("Request body must be a JSON object");
  }

  const { messages, responseMode } = body as Record<string, unknown>;

  if (!Array.isArray(messages)) {
    return invalidRequest("messages must be an array");
  }

  if (responseMode !== undefined && responseMode !== "markdown" && responseMode !== "openui") {
    return invalidRequest('responseMode must be either "markdown" or "openui"');
  }

  return {
    messages,
    responseMode: responseMode as ResponseMode | undefined,
  };
}

// ── Route handler ──

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return invalidRequest("Request body must be valid JSON");
  }

  const parsedBody = parseRequestBody(body);
  if (parsedBody instanceof Response) {
    return parsedBody;
  }

  const { messages, responseMode = "openui" } = parsedBody;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: "OPENROUTER_API_KEY not configured" } },
      { status: 500 },
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const MODEL = "openai/gpt-5.4";

  const cleanMessages = (messages as any[])
    .filter(
      (m) =>
        m.role !== "tool" &&
        (responseMode === "openui" || (m.role !== "system" && m.role !== "developer")),
    )
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        const { tool_calls: _tc, ...rest } = m;
        return rest;
      }
      return m;
    });

  const chatMessages: ChatCompletionMessageParam[] = [
    {
      role: "system" as const,
      content: responseMode === "markdown" ? markdownSystemPrompt : openUiSystemPrompt,
    },
    ...cleanMessages,
  ];

  const encoder = new TextEncoder();
  let controllerClosed = false;
  let activeRunner: { abort: () => void } | undefined;

  const readable = new ReadableStream({
    start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try {
          controller.enqueue(data);
        } catch {
          /* already closed */
        }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const runner = client.chat.completions.stream(
        {
          model: MODEL,
          messages: chatMessages,
        },
        { signal: req.signal },
      );
      activeRunner = runner;

      const handleAbort = () => {
        runner.abort();
        close();
      };
      req.signal.addEventListener("abort", handleAbort, { once: true });

      const finish = () => {
        req.signal.removeEventListener("abort", handleAbort);
        activeRunner = undefined;
        close();
      };

      runner.on("chunk", (chunk: any) => {
        // Keep credit handling to non-2xx responses. Provider-specific mid-stream
        // chunks are intentionally ignored because they are harder to maintain
        // across OpenRouter/OpenAI streaming shape changes.
        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        if (!delta) return;
        if (delta.content) {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (choice?.finish_reason === "stop") {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      });

      runner.on("end", () => {
        if (controllerClosed) return;

        enqueue(encoder.encode("data: [DONE]\n\n"));
        finish();
      });

      runner.on("error", (err: any) => {
        if (controllerClosed) return;

        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        finish();
      });

      runner.on("abort", finish);
    },
    cancel() {
      activeRunner?.abort();
      activeRunner = undefined;
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
