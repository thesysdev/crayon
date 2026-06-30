import type { Message } from "@ag-ui/core";

import { streamOpenUI } from "@/lib/stream-openui";

/**
 * A LangGraph/LangChain input message, i.e. the `{ type, content, ... }` shape
 * the graph expects on its `messages` input (as opposed to the AG-UI
 * `{ role, content, ... }` shape the browser sends).
 */
interface LangGraphInputMessage {
  /** LangChain message type: `"human" | "ai" | "tool" | "system"`. */
  type: string;
  content?: unknown;
  tool_calls?: unknown;
  tool_call_id?: string;
  [key: string]: unknown;
}

/** A single AG-UI assistant tool call, as sent by the browser. */
type ToolCall = NonNullable<Extract<Message, { role: "assistant" }>["toolCalls"]>[number];

/**
 * Configuration for {@link createLangChainStreamResponse}.
 */
export interface CreateLangChainStreamResponseOptions {
  /**
   * Base URL of the LangGraph server (agent protocol v2), e.g.
   * `http://localhost:2024`.
   */
  apiUrl: string;
  /** The id of the graph/assistant to run (its registered `graph_id`). */
  assistantId: string;
  /** Optional API key forwarded as `x-api-key` (required for LangSmith). */
  apiKey?: string;
}

/**
 * Turns an incoming chat request into a streaming OpenUI Server-Sent Events
 * `Response`, suitable for returning directly from a route handler.
 *
 * It reads `{ messages }` (AG-UI format) from the request body, converts them
 * to LangChain input messages, strips internal tool history that must not be
 * replayed, starts the graph over the protocol-v2 endpoints via
 * {@link streamOpenUI}, and relays only the custom OpenUI channel back to the
 * browser. The request's `signal` is wired through so an aborted/disconnected
 * client tears down the upstream run.
 *
 * @param request - The incoming request (its JSON body and abort signal are used).
 * @param options - LangGraph connection settings, see
 *   {@link CreateLangChainStreamResponseOptions}.
 * @returns A `Response` streaming `text/event-stream` AG-UI events.
 */
export async function createLangChainStreamResponse(
  request: Request,
  options: CreateLangChainStreamResponseOptions,
): Promise<Response> {
  const { messages = [] } = (await request.json()) as { messages?: Message[] };
  const langChainMessages = toLangChainMessages(messages);
  const visibleMessages = stripInternalToolHistory(langChainMessages);

  const readable = streamOpenUI({
    apiUrl: options.apiUrl,
    assistantId: options.assistantId,
    apiKey: options.apiKey,
    input: { messages: visibleMessages },
    signal: request.signal,
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/**
 * The browser stores the specialist's streamed tool call and final answer as
 * one assistant message, but it does not store the ToolNode result. Replaying
 * that partial tool transcript makes OpenAI reject the next request. Tool
 * execution belongs to the current graph run, so retain only visible chat
 * history between stateless runs.
 */
function stripInternalToolHistory(messages: LangGraphInputMessage[]): LangGraphInputMessage[] {
  return messages.flatMap((message) => {
    if (message.type === "tool") return [];
    if (message.type !== "ai" || !message.tool_calls) return [message];

    const visibleMessage = { ...message };
    delete visibleMessage.tool_calls;
    return [visibleMessage];
  });
}

/**
 * Converts AG-UI messages (`{ role, content, ... }`) into LangChain input
 * messages (`{ type, content, ... }`) understood by the graph.
 */
function toLangChainMessages(messages: Message[]): LangGraphInputMessage[] {
  return messages.map((message) => {
    switch (message.role) {
      case "user":
        return { type: "human", content: extractContent(message.content) };
      case "assistant": {
        const result: LangGraphInputMessage = { type: "ai", content: message.content ?? "" };
        if (message.toolCalls?.length) {
          result.tool_calls = message.toolCalls.map(toLangChainToolCall);
        }
        return result;
      }
      case "tool":
        return {
          type: "tool",
          content: message.content,
          tool_call_id: message.toolCallId,
        };
      case "system":
        return { type: "system", content: message.content };
      case "developer":
        return { type: "system", content: message.content };
      default:
        return { type: "system", content: "" };
    }
  });
}

/** Maps an AG-UI tool call to the LangChain `{ id, name, args }` shape. */
function toLangChainToolCall(toolCall: ToolCall) {
  return {
    id: toolCall.id,
    name: toolCall.function.name,
    args: safeParseArgs(toolCall.function.arguments),
  };
}

/**
 * Flattens AG-UI message content (string or content blocks) into the plain
 * text the graph expects, keeping only `text` blocks.
 */
function extractContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * Parses serialized tool-call arguments as JSON, falling back to the raw
 * string when the arguments are not valid JSON.
 */
function safeParseArgs(args: string): Record<string, unknown> | string {
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch {
    return args;
  }
}
