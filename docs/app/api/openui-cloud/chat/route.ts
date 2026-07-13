import { isConversationOwnedByUser } from "@/lib/openui-cloud/cloud-api";
import { readOpenuiCloudConfig } from "@/lib/openui-cloud/config";
import { unavailableResponse, unavailableStreamEvent } from "@/lib/openui-cloud/errors";
import { resolveRequestedModel } from "@/lib/openui-cloud/models";
import { hasAllowedOrigin, hasJsonContentType, readLimitedJson } from "@/lib/openui-cloud/request";
import { getExistingCloudSession } from "@/lib/openui-cloud/session";
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

export const runtime = "nodejs";

const MAX_INPUT_ITEMS = 16;
const MAX_THREAD_ID_LENGTH = 256;

interface CloudChatRequest {
  threadId: string;
  input: ResponseInputItem[];
  model: string;
}

export async function POST(request: Request): Promise<Response> {
  const config = readOpenuiCloudConfig();
  if (!config) return unavailableResponse();
  if (!hasAllowedOrigin(request)) return unavailableResponse(403);
  if (!hasJsonContentType(request)) return unavailableResponse(415);

  const session = getExistingCloudSession(request, config);
  if (!session) return unavailableResponse(401);

  let body: CloudChatRequest;
  try {
    const payload = await readLimitedJson(request);
    const parsed = parseCloudChatRequest(payload);
    if (!parsed) return unavailableResponse(400);
    body = parsed;
  } catch {
    return unavailableResponse(400);
  }

  try {
    const isOwned = await isConversationOwnedByUser(
      config,
      session.userId,
      body.threadId,
      request.signal,
    );
    if (!isOwned) return unavailableResponse(403);
  } catch {
    return unavailableResponse();
  }

  const client = new OpenAI({
    baseURL: `${config.apiOrigin}/v1/embed`,
    apiKey: config.apiKey,
  });

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      {
        model: body.model,
        conversation: body.threadId,
        input: body.input,
        stream: true,
        store: true,
        tools: [
          artifactTool({ artifacts: ["slides", "report"] }),
          { type: "web_search" },
          { type: "image_search" },
        ],
        instructions: createResponsesInstructions(),
        // The Cloud Responses endpoint extends the stock OpenAI tool union.
      } as any,
      { signal: request.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch {
    return unavailableResponse();
  }

  return createSseResponse(stream, request.signal, session.setCookie);
}

function parseCloudChatRequest(value: unknown): CloudChatRequest | null {
  if (!isRecord(value)) return null;

  const threadId = value.threadId;
  if (
    typeof threadId !== "string" ||
    threadId.length === 0 ||
    threadId.length > MAX_THREAD_ID_LENGTH ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(threadId)
  ) {
    return null;
  }

  const input = value.input;
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > MAX_INPUT_ITEMS ||
    !input.every(isRecord)
  ) {
    return null;
  }

  const model = resolveRequestedModel(value.model);
  if (!model) return null;

  return { threadId, input: input as unknown as ResponseInputItem[], model };
}

function createSseResponse(
  stream: AsyncIterable<Record<string, unknown>>,
  requestSignal: AbortSignal,
  setCookie?: string,
): Response {
  const encoder = new TextEncoder();
  let cancelled = false;
  let iterator: AsyncIterator<Record<string, unknown>> | undefined;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      iterator = stream[Symbol.asyncIterator]();
      try {
        while (!cancelled) {
          const next = await iterator.next();
          if (next.done || cancelled) break;
          if (isUpstreamFailureEvent(next.value)) {
            controller.enqueue(encoder.encode(unavailableStreamEvent()));
            await iterator.return?.();
            break;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
        }
      } catch {
        if (!cancelled && !requestSignal.aborted) {
          controller.enqueue(encoder.encode(unavailableStreamEvent()));
        }
      } finally {
        if (!cancelled) controller.close();
      }
    },
    async cancel() {
      cancelled = true;
      await iterator?.return?.();
    },
  });

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    Vary: "Cookie",
  });
  if (setCookie) headers.set("Set-Cookie", setCookie);

  return new Response(body, { headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUpstreamFailureEvent(event: Record<string, unknown>): boolean {
  return (
    event.type === "error" ||
    event.type === "response.failed" ||
    event.type === "response.incomplete"
  );
}
