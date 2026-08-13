import { MessageSchema, type InputContent, type Message } from "@ag-ui/core";

import { streamOpenUI } from "./stream-relay";

/** A LangChain/LangGraph input message accepted by a graph's `messages` field. */
export interface LangChainInputMessage {
  type: string;
  content?: unknown;
  tool_calls?: unknown;
  tool_call_id?: string;
  [key: string]: unknown;
}

/** Values available when customizing the input sent to a LangGraph run. */
export interface PrepareLangChainRunInputContext {
  /** The validated, tool-history-safe messages converted from the AG-UI request. */
  messages: LangChainInputMessage[];
  /** The complete incoming JSON body, including fields such as `threadId`. */
  requestBody: Record<string, unknown>;
}

/** Configuration for {@link createLangChainStreamResponse}. */
export interface CreateLangChainStreamResponseOptions {
  /** LangGraph agent-protocol-v2 base URL, for example `http://localhost:2024`. */
  apiUrl: string;
  /** Graph or assistant id registered on the LangGraph server. */
  assistantId: string;
  /** Optional LangSmith/LangGraph Platform API key, sent as `x-api-key`. */
  apiKey?: string;
  /** Include upstream response details and registered graph ids in errors. Defaults to `false`. */
  debug?: boolean;
  /** Delete the temporary LangGraph thread after the run. Defaults to `true`. */
  cleanupThread?: boolean;
  /** Register thread cleanup with a serverless execution context such as `waitUntil`. */
  waitUntil?: (task: Promise<void>) => void;
  /**
   * Customize the graph input. Use this to forward application fields such as
   * a provider conversation id or selected model alongside `messages`.
   */
  prepareInput?: (context: PrepareLangChainRunInputContext) => unknown | Promise<unknown>;
}

type AssistantMessage = Extract<Message, { role: "assistant" }>;
type ToolCall = NonNullable<AssistantMessage["toolCalls"]>[number];

/**
 * Converts an incoming AG-UI chat request into a streaming response backed by
 * a stateless LangGraph protocol-v2 run.
 *
 * The request body must contain `{ messages: Message[] }`. Visible conversation
 * history is converted to LangChain input messages; complete tool transcripts
 * are retained while incomplete pairs are removed before the run starts. The
 * returned response emits `text/event-stream` AG-UI events and is suitable for
 * a Next.js, Remix, Hono, or other Web-standard route handler.
 */
export async function createLangChainStreamResponse(
  request: Request,
  options: CreateLangChainStreamResponseOptions,
): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return badRequest("Expected a JSON request body containing a non-empty messages array");
  }

  const requestBody = asRecord(body);
  const messages = parseChatRequestBody(requestBody);
  if (!messages) {
    return badRequest("Expected a JSON request body containing a non-empty messages array");
  }

  const langChainMessages = toLangChainMessages(messages);
  const visibleMessages = sanitizeToolHistory(langChainMessages);
  let input: unknown;
  try {
    input = options.prepareInput
      ? await options.prepareInput({ messages: visibleMessages, requestBody })
      : { messages: visibleMessages };
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to prepare LangGraph input");
  }

  const readable = streamOpenUI({
    apiUrl: options.apiUrl,
    assistantId: options.assistantId,
    apiKey: options.apiKey,
    input,
    signal: request.signal,
    debug: options.debug,
    cleanupThread: options.cleanupThread,
    waitUntil: options.waitUntil,
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function sanitizeToolHistory(messages: LangChainInputMessage[]): LangChainInputMessage[] {
  const sanitized: LangChainInputMessage[] = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (!message) continue;

    // Orphaned tool results are invalid without a preceding assistant call.
    if (message.type === "tool") continue;

    const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    if (message.type !== "ai" || toolCalls.length === 0) {
      sanitized.push(message);
      continue;
    }

    const followingToolMessages: LangChainInputMessage[] = [];
    let nextIndex = index + 1;
    while (messages[nextIndex]?.type === "tool") {
      followingToolMessages.push(messages[nextIndex] as LangChainInputMessage);
      nextIndex += 1;
    }

    const resultIds = new Set(
      followingToolMessages
        .map((toolMessage) => toolMessage.tool_call_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );
    const completeToolCalls = toolCalls.filter((toolCall) => {
      const id = getInputToolCallId(toolCall);
      return id !== undefined && resultIds.has(id);
    });
    const completeIds = new Set(
      completeToolCalls.map(getInputToolCallId).filter((id): id is string => id !== undefined),
    );

    const assistantMessage = { ...message };
    if (completeToolCalls.length > 0) {
      assistantMessage.tool_calls = completeToolCalls;
    } else {
      delete assistantMessage.tool_calls;
    }
    sanitized.push(assistantMessage);
    sanitized.push(
      ...followingToolMessages.filter(
        (toolMessage) =>
          typeof toolMessage.tool_call_id === "string" && completeIds.has(toolMessage.tool_call_id),
      ),
    );
    index = nextIndex - 1;
  }

  return sanitized;
}

function toLangChainMessages(messages: Message[]): LangChainInputMessage[] {
  return messages.flatMap((message) => {
    switch (message.role) {
      case "user":
        return [{ type: "human", content: toLangChainContent(message.content) }];
      case "assistant": {
        const result: LangChainInputMessage = { type: "ai", content: message.content ?? "" };
        if (message.toolCalls?.length) {
          result.tool_calls = message.toolCalls.map(toLangChainToolCall);
        }
        return [result];
      }
      case "tool":
        return [
          {
            type: "tool",
            content: message.content,
            tool_call_id: message.toolCallId,
          },
        ];
      case "system":
      case "developer":
        return [{ type: "system", content: message.content }];
      case "activity":
      case "reasoning":
        return [];
      default:
        return [];
    }
  });
}

function toLangChainToolCall(toolCall: ToolCall) {
  return {
    id: toolCall.id,
    name: toolCall.function.name,
    args: safeParseArgs(toolCall.function.arguments),
  };
}

function toLangChainContent(
  content: Extract<Message, { role: "user" }>["content"],
): string | Array<Record<string, unknown>> {
  if (typeof content === "string") return content;
  return content.map(toLangChainContentBlock);
}

function toLangChainContentBlock(block: InputContent): Record<string, unknown> {
  if (block.type === "text") return { type: "text", text: block.text };

  if (block.type === "binary") {
    return {
      type: "file",
      mimeType: block.mimeType,
      ...(block.url ? { url: block.url } : {}),
      ...(block.data ? { data: block.data } : {}),
      ...(block.id ? { fileId: block.id } : {}),
      ...(block.filename ? { metadata: { filename: block.filename } } : {}),
    };
  }

  const type = block.type === "document" ? "file" : block.type;
  const source = block.source;
  const metadata = "metadata" in block && block.metadata !== undefined ? block.metadata : undefined;

  if (source.type === "url") {
    return {
      type,
      url: source.value,
      ...(source.mimeType ? { mimeType: source.mimeType } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    };
  }

  return {
    type,
    data: source.value,
    mimeType: source.mimeType,
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

function safeParseArgs(args: string): Record<string, unknown> | string {
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch {
    return args;
  }
}

function getInputToolCallId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("id" in value)) return undefined;
  return typeof value.id === "string" && value.id.length > 0 ? value.id : undefined;
}

function parseChatRequestBody(value: unknown): Message[] | undefined {
  if (typeof value !== "object" || value === null || !("messages" in value)) return undefined;
  const parsed = MessageSchema.array().safeParse(value.messages);
  return parsed.success && parsed.data.length > 0 ? parsed.data : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
