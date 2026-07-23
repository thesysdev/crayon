import { envOr, requiredEnv } from "@/lib/env";
import { shadcnLibraryConfig } from "@/lib/shadcn-genui/server";
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

export async function POST(req: Request) {
  const { threadId, input } = (await req.json()) as {
    threadId?: string;
    input?: ResponseInputItem[];
  };

  if (!threadId) {
    return Response.json(
      { error: { message: "threadId is required — create the conversation first" } },
      { status: 400 },
    );
  }
  if (!Array.isArray(input) || input.length === 0) {
    return Response.json(
      { error: { message: "input must be a non-empty ResponseInputItem[]" } },
      { status: 400 },
    );
  }

  const client = new OpenAI({
    baseURL: "http://localhost:3102/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"),
  });

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      {
        model: envOr("OPENUI_MODEL", "google/gemini-3.5-flash-free"),
        conversation: threadId,
        input,
        stream: true,
        store: true,
        tools: [
          artifactTool({ artifacts: ["slides", "report"] }),
          { type: "web_search" },
          { type: "image_search" },
        ],
        instructions: createResponsesInstructions({ componentLibrary: shadcnLibraryConfig }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { signal: req.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (err) {
    const e = err as { status?: number; error?: unknown; message?: string };
    return Response.json(
      { error: e.error ?? { message: e.message ?? "upstream error" } },
      { status: e.status ?? 502 },
    );
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
        );
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
