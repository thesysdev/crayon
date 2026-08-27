import { appToolDeclarations, appToolExecutors } from "@/lib/app-tools";
import { cloudInstructions } from "@/lib/cloud-prompt";
import { CLOUD_EMBED_URL, DEFAULT_MODEL, requiredEnv } from "@/lib/env";
import { runFunctionToolLoop } from "@/lib/tool-loop";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";

export async function POST(req: Request) {
  const { threadId, messages } = (await req.json()) as {
    threadId?: string;
    messages?: ResponseInputItem[];
  };

  if (!threadId) return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty ResponseInputItem[]");
  }

  const client = new OpenAI({
    baseURL: CLOUD_EMBED_URL,
    apiKey: requiredEnv("THESYS_API_KEY"),
  });

  const createParams: ResponseCreateParamsNonStreaming = {
    model: DEFAULT_MODEL,
    conversation: threadId,
    input: messages.slice(-1),
    store: true,
    tools: appToolDeclarations as unknown as Tool[],
    instructions: cloudInstructions(),
  };

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      { ...createParams, stream: true },
      { signal: req.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (err) {
    const e = err as { status?: number; error?: unknown; message?: string };
    return NextResponse.json(
      { error: e.error ?? { message: e.message ?? "upstream error" } },
      { status: e.status ?? 502 },
    );
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runFunctionToolLoop({
          client,
          createParams,
          firstStream: stream,
          tools: appToolExecutors,
          enqueue,
          signal: req.signal,
        });
      } catch (err) {
        enqueue({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function badRequest(message: string): Response {
  return NextResponse.json({ error: { message } }, { status: 400 });
}
