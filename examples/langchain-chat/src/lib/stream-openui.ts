import { EventType, type AGUIEvent } from "@ag-ui/core";

/**
 * Options for {@link streamOpenUI}.
 */
interface StreamOpenUIOptions {
  /**
   * Base URL of the LangGraph server (agent protocol v2), e.g.
   * `http://localhost:2024`. Trailing slashes are stripped before use.
   */
  apiUrl: string;
  /**
   * The id of the graph/assistant to run (the `graph_id` registered with the
   * LangGraph server, e.g. `"agent"`).
   */
  assistantId: string;
  /**
   * Optional API key forwarded as the `x-api-key` header (required by
   * LangSmith deployments, omitted for local `langgraphjs dev`).
   */
  apiKey?: string;
  /**
   * The run input handed to the graph — typically `{ messages: [...] }` in
   * LangChain message format. Kept as `unknown` since this helper does not
   * interpret it.
   */
  input: unknown;
  /**
   * Caller's abort signal (Next.js aborts this when the browser disconnects).
   * Aborting tears down the upstream LangGraph fetches and closes the stream.
   */
  signal?: AbortSignal;
}

/**
 * A single Server-Sent Events frame parsed out of the LangGraph response body,
 * reduced to the two fields this helper cares about.
 */
interface ProtocolSSEEvent {
  /** The SSE `event:` field, e.g. `"custom"` or `"custom:openui"`. */
  event: string;
  /** The concatenated SSE `data:` field (raw JSON string, not yet parsed). */
  data: string;
}

/**
 * The agent-protocol-v2 envelope carried in the SSE `data:` field. The payload
 * of interest lives under `params.data` (for `custom` channels this is itself a
 * {@link NamedCustomPayload}).
 */
interface ProtocolEvent {
  /** Protocol method that produced the event, e.g. `"messages"` or `"custom"`. */
  method?: string;
  params: {
    /** Channel payload; for `custom:openui` this is a {@link NamedCustomPayload}. */
    data?: unknown;
  };
}

/**
 * The shape the LangGraph mux uses to forward a named custom channel: the
 * server emits `event: custom` with `{ name: "openui", payload: <AGUIEvent> }`
 * rather than `event: custom:openui` with the bare event, so the channel name
 * must be read from `name` and the real event unwrapped from `payload`.
 */
interface NamedCustomPayload {
  /** Custom channel name; only `"openui"` payloads are relayed. */
  name?: string;
  /** The actual {@link AGUIEvent} emitted by the transformer. */
  payload?: unknown;
}

const encoder = new TextEncoder();

/**
 * Drives an agent-protocol-v2 run on a LangGraph server and relays the
 * transformer's AG-UI events to the browser as a Server-Sent Events stream.
 *
 * The flow is:
 * 1. Open a `custom:openui` event subscription on a fresh thread.
 * 2. Start the run (`run.start`) concurrently to avoid a subscribe/start
 *    deadlock.
 * 3. For every forwarded `custom:openui` frame, unwrap the {@link AGUIEvent}
 *    and re-emit it to the client as `data: <json>\n\n`.
 *
 * The stream closes as soon as a terminal event ({@link EventType.TEXT_MESSAGE_END}
 * or {@link EventType.RUN_ERROR}) is seen, on upstream completion, or when the
 * caller's {@link StreamOpenUIOptions.signal | signal} aborts. Errors are surfaced
 * to the client as a {@link EventType.RUN_ERROR} event rather than throwing.
 *
 * @param options - See {@link StreamOpenUIOptions}.
 * @returns A `ReadableStream` of UTF-8 encoded SSE frames suitable for a
 *   `text/event-stream` HTTP response.
 */
export function streamOpenUI({
  apiUrl,
  assistantId,
  apiKey,
  input,
  signal,
}: StreamOpenUIOptions): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const upstreamAbort = new AbortController();
      const onAbort = () => upstreamAbort.abort();
      signal?.addEventListener("abort", onAbort, { once: true });

      const close = () => {
        try {
          controller.close();
        } catch {
          // The browser may have already disconnected.
        }
      };

      const send = (event: AGUIEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const headers = buildHeaders(apiKey);
        const baseUrl = apiUrl.replace(/\/+$/, "");
        const threadId = crypto.randomUUID();

        // Subscribe to the `custom:openui` channel without a namespace/depth
        // filter: the transformer forwards events from the agent's model node
        // (a nested namespace like `model_request:<uuid>`), so restricting to
        // the root namespace would drop them.
        const eventsResponsePromise = fetch(`${baseUrl}/threads/${threadId}/stream/events`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            channels: ["custom:openui"],
          }),
          signal: upstreamAbort.signal,
        });

        const startRunPromise = startRun({
          baseUrl,
          threadId,
          assistantId,
          input,
          headers,
          signal: upstreamAbort.signal,
        });

        const eventsResponse = await eventsResponsePromise;

        if (!eventsResponse.ok || !eventsResponse.body) {
          throw new Error(`LangGraph event stream failed: ${eventsResponse.status}`);
        }

        await startRunPromise;

        const reader = eventsResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const parsed = parseSSEBlock(block);
            if (!isOpenUIEventName(parsed.event) || !parsed.data) continue;

            const agUIEvent = extractAGUIEvent(parsed.data);
            if (!agUIEvent) continue;

            send(agUIEvent);

            if (
              agUIEvent.type === EventType.TEXT_MESSAGE_END ||
              agUIEvent.type === EventType.RUN_ERROR
            ) {
              upstreamAbort.abort();
              close();
              return;
            }
          }
        }
      } catch (error) {
        if (!signal?.aborted) {
          send({
            type: EventType.RUN_ERROR,
            message: error instanceof Error ? error.message : "OpenUI stream failed",
          } as AGUIEvent);
        }
      } finally {
        signal?.removeEventListener("abort", onAbort);
        close();
      }
    },
    cancel() {
      // The upstream fetch is tied to the caller's request signal, which Next.js
      // aborts when the browser disconnects.
    },
  });
}

/**
 * Issues the `run.start` command that kicks off graph execution on the given
 * thread. Throws with an enriched message on failure — including a list of
 * registered graph ids when the assistant is not found (404).
 */
async function startRun({
  baseUrl,
  threadId,
  assistantId,
  input,
  headers,
  signal,
}: {
  /** Normalized LangGraph base URL (no trailing slash). */
  baseUrl: string;
  /** The thread the run is bound to (shared with the event subscription). */
  threadId: string;
  /** Graph/assistant id to run. */
  assistantId: string;
  /** Run input forwarded verbatim to the graph. */
  input: unknown;
  /** Request headers (content type plus optional `x-api-key`). */
  headers: HeadersInit;
  /** Abort signal tying this fetch to the overall stream lifecycle. */
  signal: AbortSignal;
}) {
  const response = await fetch(`${baseUrl}/threads/${threadId}/commands`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: 1,
      method: "run.start",
      params: {
        assistant_id: assistantId,
        input,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const details = await response.text();
    const hint =
      response.status === 404
        ? await getAssistantHint(baseUrl, headers, assistantId, signal)
        : undefined;
    throw new Error(
      [
        `LangGraph run.start failed: ${response.status}`,
        details.trim() || undefined,
        hint,
      ]
        .filter(Boolean)
        .join(". "),
    );
  }

  const payload = (await response.json()) as { type?: string; message?: string };
  if (payload.type === "error") {
    throw new Error(payload.message ?? "LangGraph run.start failed");
  }
}

/**
 * Best-effort diagnostic for a 404 from `run.start`: queries the server's
 * registered assistants and returns a human-readable hint listing the
 * available graph ids, or `undefined` if it cannot be determined.
 */
async function getAssistantHint(
  baseUrl: string,
  headers: HeadersInit,
  assistantId: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  try {
    const response = await fetch(`${baseUrl}/assistants/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      signal,
    });
    if (!response.ok) return undefined;

    const assistants = (await response.json()) as Array<{
      assistant_id?: string;
      graph_id?: string;
      name?: string | null;
    }>;
    const registered = assistants
      .map((assistant) => assistant.graph_id ?? assistant.name ?? assistant.assistant_id)
      .filter(Boolean);

    if (!registered.length) return undefined;
    return `Configured assistant "${assistantId}" is not registered on this LangGraph server; available graph ids: ${registered.join(", ")}`;
  } catch {
    return undefined;
  }
}

/**
 * Builds the JSON request headers, adding the `x-api-key` header only when an
 * {@link StreamOpenUIOptions.apiKey | apiKey} is provided.
 */
function buildHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return headers;
}

/**
 * Parses one SSE frame (the text between blank-line delimiters) into its
 * `event` and concatenated `data` fields. Lines that are neither are ignored.
 */
function parseSSEBlock(block: string): ProtocolSSEEvent {
  let event = "";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  return { event, data: dataLines.join("\n") };
}

/**
 * Unwraps the {@link AGUIEvent} from a raw SSE `data:` JSON string. Handles both
 * the protocol-envelope form ({@link ProtocolEvent} → {@link NamedCustomPayload})
 * and a bare event that was already unwrapped upstream.
 *
 * @returns The event, or `undefined` if the payload is not an `openui` event.
 */
function extractAGUIEvent(data: string): AGUIEvent | undefined {
  const parsed = JSON.parse(data) as ProtocolEvent | AGUIEvent;
  if (isProtocolEvent(parsed)) {
    return extractCustomPayload(parsed.params.data);
  }
  return parsed as AGUIEvent;
}

/**
 * Whether an SSE `event:` name corresponds to the OpenUI custom channel. The
 * server may emit either the generic `custom` (with a named payload) or the
 * fully-qualified `custom:openui`.
 */
function isOpenUIEventName(event: string): boolean {
  return event === "custom" || event === "custom:openui";
}

/**
 * Extracts the {@link AGUIEvent} from a `custom` channel payload, returning
 * `undefined` for named payloads whose channel is not `"openui"`.
 */
function extractCustomPayload(data: unknown): AGUIEvent | undefined {
  if (isNamedCustomPayload(data)) {
    if (data.name !== "openui") return undefined;
    return data.payload as AGUIEvent;
  }

  return data as AGUIEvent;
}

/**
 * Type guard for the {@link NamedCustomPayload} `{ name, payload }` shape used
 * when the server forwards a named custom channel.
 */
function isNamedCustomPayload(value: unknown): value is NamedCustomPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "payload" in value
  );
}

/**
 * Type guard distinguishing a {@link ProtocolEvent} envelope (has
 * `params.data`) from a bare {@link AGUIEvent}.
 */
function isProtocolEvent(value: ProtocolEvent | AGUIEvent): value is ProtocolEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "params" in value &&
    typeof value.params === "object" &&
    value.params !== null &&
    "data" in value.params
  );
}
