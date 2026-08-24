import type {
  ChatStorage,
  Message,
  Thread,
  ToolCall,
  UserMessage,
} from "@openuidev/react-headless";

export type AgnoEntityType = "agent" | "team";

export interface AgnoStorageOptions {
  /** AgentOS origin, optionally including a path prefix. */
  baseUrl: string;
  /** Whether sessions belong to an Agno agent or team. */
  entityType: AgnoEntityType;
  /** Agent or team id used to filter and create sessions. */
  entityId: string;
  /** Anonymous AgentOS user id. Authenticated AgentOS instances derive it from the token. */
  userId?: string;
  /** Optional AgentOS database id. */
  dbId?: string;
  /** Optional AgentOS session table name. */
  table?: string;
  /** Session page size. Defaults to 20. */
  pageSize?: number;
  /** Bearer token for AgentOS. Explicit Authorization headers win. */
  token?: string;
  /** Extra headers merged into every AgentOS session request. */
  headers?: Record<string, string>;
  /** Override fetch for tests, proxies, or custom authentication. */
  fetch?: typeof fetch;
}

interface AgnoSessionSummary {
  session_id: string;
  session_name?: string;
  created_at?: string | number;
  updated_at?: string | number;
}

interface AgnoSessionDetail extends AgnoSessionSummary {
  chat_history?: unknown[];
}

interface AgnoSessionPage {
  data?: AgnoSessionSummary[];
  meta?: {
    page?: number;
    total_pages?: number;
  };
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function withQuery(url: string, values: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `${url}?${encoded}` : url;
}

function sessionToThread(session: AgnoSessionSummary): Thread {
  return {
    id: session.session_id,
    title: session.session_name?.trim() || "New conversation",
    createdAt: session.created_at ?? session.updated_at ?? Date.now(),
  };
}

function contentToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function messageTitle(message: UserMessage): string {
  const content = message.content;
  const text =
    typeof content === "string"
      ? content
      : (content.find((part) => part.type === "text")?.text ?? "New conversation");
  const title = text.replace(/\s+/g, " ").trim();
  return title ? title.slice(0, 80) : "New conversation";
}

function normalizeToolCalls(value: unknown): ToolCall[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const calls = value.flatMap((item, index): ToolCall[] => {
    if (!isRecord(item)) return [];
    const fn = isRecord(item["function"]) ? item["function"] : undefined;
    const name =
      typeof fn?.["name"] === "string"
        ? fn["name"]
        : typeof item["name"] === "string"
          ? item["name"]
          : "tool";
    const rawArguments = fn?.["arguments"] ?? item["arguments"] ?? item["args"] ?? {};
    const args = typeof rawArguments === "string" ? rawArguments : contentToString(rawArguments);
    return [
      {
        id: typeof item["id"] === "string" ? item["id"] : `tool-call-${index}`,
        type: "function",
        function: { name, arguments: args },
      },
    ];
  });
  return calls.length > 0 ? calls : undefined;
}

/** Convert AgentOS chat_history records into OpenUI's canonical AG-UI messages. */
export function agnoHistoryToMessages(history: unknown, sessionId = "session"): Message[] {
  if (!Array.isArray(history)) return [];

  return history.flatMap((entry, index): Message[] => {
    if (!isRecord(entry) || typeof entry["role"] !== "string") return [];
    const id =
      typeof entry["id"] === "string"
        ? entry["id"]
        : typeof entry["message_id"] === "string"
          ? entry["message_id"]
          : `${sessionId}-message-${index}`;
    const content = contentToString(entry["content"]);

    switch (entry["role"]) {
      case "human":
      case "user":
        return [{ id, role: "user", content }];
      case "ai":
      case "assistant": {
        const toolCalls = normalizeToolCalls(entry["tool_calls"]);
        return [
          {
            id,
            role: "assistant",
            content,
            ...(toolCalls ? { toolCalls } : {}),
          },
        ];
      }
      case "tool":
        return [
          {
            id,
            role: "tool",
            toolCallId:
              typeof entry["tool_call_id"] === "string"
                ? entry["tool_call_id"]
                : `tool-call-${index}`,
            content,
          },
        ];
      case "system":
        return [{ id, role: "system", content }];
      case "developer":
        return [{ id, role: "developer", content }];
      default:
        return [];
    }
  });
}

/**
 * Store OpenUI conversations in AgentOS rather than in a second chat database.
 *
 * The adapter maps OpenUI threads to AgentOS sessions and reloads canonical
 * messages from each session's chat_history. AgentOS remains authoritative for
 * ownership, persistence, session history, and authorization.
 */
export function agnoStorage({
  baseUrl,
  entityType,
  entityId,
  userId,
  dbId,
  table,
  pageSize = 20,
  token,
  headers,
  fetch: customFetch,
}: AgnoStorageOptions): ChatStorage {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);
  const entityKey = entityType === "agent" ? "agent_id" : "team_id";

  const queryValues = (extra: Record<string, string | number | undefined> = {}) => ({
    type: entityType,
    user_id: userId,
    db_id: dbId,
    table,
    ...extra,
  });

  const request = async (url: string, init?: RequestInit): Promise<Response> => {
    const response = await fetchImpl(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const detail = await response
        .clone()
        .json()
        .then((body: unknown) => (isRecord(body) ? body["detail"] : undefined))
        .catch(() => undefined);
      throw new Error(
        `agnoStorage: ${init?.method ?? "GET"} ${url} failed: ${response.status}${
          typeof detail === "string" ? ` ${detail}` : ""
        }`,
      );
    }
    return response;
  };

  return {
    thread: {
      async listThreads(cursor) {
        const page = cursor && Number.isFinite(Number(cursor)) ? Math.max(1, Number(cursor)) : 1;
        const url = withQuery(
          joinUrl(baseUrl, "/sessions"),
          queryValues({
            component_id: entityId,
            limit: pageSize,
            page,
            sort_by: "updated_at",
            sort_order: "desc",
          }),
        );
        const response = await request(url);
        const payload = (await response.json()) as AgnoSessionPage;
        const currentPage = payload.meta?.page ?? page;
        const totalPages = payload.meta?.total_pages ?? currentPage;
        return {
          threads: (payload.data ?? []).map(sessionToThread),
          ...(currentPage < totalPages ? { nextCursor: String(currentPage + 1) } : {}),
        };
      },

      async createThread(firstMessage) {
        const url = withQuery(joinUrl(baseUrl, "/sessions"), queryValues());
        const response = await request(url, {
          method: "POST",
          body: JSON.stringify({
            session_name: messageTitle(firstMessage),
            ...(userId ? { user_id: userId } : {}),
            [entityKey]: entityId,
          }),
        });
        return sessionToThread((await response.json()) as AgnoSessionDetail);
      },

      async getMessages(threadId) {
        const url = withQuery(
          joinUrl(baseUrl, `/sessions/${encodeURIComponent(threadId)}`),
          queryValues(),
        );
        const response = await request(url);
        const session = (await response.json()) as AgnoSessionDetail;
        return agnoHistoryToMessages(session.chat_history, threadId);
      },

      async updateThread(thread) {
        const url = withQuery(
          joinUrl(baseUrl, `/sessions/${encodeURIComponent(thread.id)}/rename`),
          queryValues(),
        );
        const response = await request(url, {
          method: "POST",
          body: JSON.stringify({ session_name: thread.title }),
        });
        return sessionToThread((await response.json()) as AgnoSessionDetail);
      },

      async deleteThread(threadId) {
        const url = withQuery(
          joinUrl(baseUrl, `/sessions/${encodeURIComponent(threadId)}`),
          queryValues(),
        );
        await request(url, { method: "DELETE" });
      },
    },
  };
}

export const createAgnoStorage = agnoStorage;
