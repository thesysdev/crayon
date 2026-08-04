import { EventType, type AGUIEvent } from "@ag-ui/core";

import { createId } from "./id";

/** Configuration for {@link streamOpenUI}. */
export interface StreamOpenUIOptions {
  /** LangGraph agent-protocol-v2 base URL, for example `http://localhost:2024`. */
  apiUrl: string;
  /** Graph or assistant id registered on the LangGraph server. */
  assistantId: string;
  /** Optional LangSmith/LangGraph Platform API key, sent as `x-api-key`. */
  apiKey?: string;
  /** Input passed verbatim to `run.start`, commonly `{ messages: [...] }`. */
  input: unknown;
  /** Aborts both upstream LangGraph requests when the caller disconnects. */
  signal?: AbortSignal;
  /** Include upstream response details and registered graph ids in errors. Defaults to `false`. */
  debug?: boolean;
  /** Delete the temporary LangGraph thread after the run. Defaults to `true`. */
  cleanupThread?: boolean;
  /** Register thread cleanup with a serverless execution context such as `waitUntil`. */
  waitUntil?: (task: Promise<void>) => void;
}

interface ProtocolSSEEvent {
  event: string;
  data: string;
}

interface ProtocolEventEnvelope {
  method?: string;
  params: {
    namespace?: unknown;
    data?: unknown;
  };
}

interface NamedCustomPayload {
  name?: string;
  payload?: unknown;
}

interface LifecyclePayload {
  event?: unknown;
  error?: unknown;
}

interface StartRunResult {
  runId?: string;
}

const encoder = new TextEncoder();
const THREAD_CLEANUP_TIMEOUT_MS = 5_000;

/**
 * Starts a stateless LangGraph protocol-v2 run and relays its `custom:openui`
 * channel as AG-UI Server-Sent Events, wrapped in the run lifecycle from the
 * LangGraph `lifecycle` channel.
 *
 * The returned stream is framework-independent and can be passed directly to
 * `new Response(...)`. Cancelling it or aborting `options.signal` tears down
 * both the event subscription and the run request.
 */
export function streamOpenUI({
  apiUrl,
  assistantId,
  apiKey,
  input,
  signal,
  debug = false,
  cleanupThread = true,
  waitUntil,
}: StreamOpenUIOptions): ReadableStream<Uint8Array> {
  const upstreamAbort = new AbortController();
  const relay = new TransformStream<Uint8Array, Uint8Array>();
  const writer = relay.writable.getWriter();
  const reader = relay.readable.getReader();
  let closed = false;

  const abortUpstream = () => {
    closed = true;
    upstreamAbort.abort(signal?.reason);
    void writer.abort(signal?.reason).catch(() => undefined);
  };
  if (signal?.aborted) {
    abortUpstream();
  } else {
    signal?.addEventListener("abort", abortUpstream, { once: true });
  }

  const send = async (event: AGUIEvent): Promise<boolean> => {
    if (closed) return false;
    try {
      // TransformStream.write waits for downstream demand, so a fast agent
      // cannot grow an unbounded queue when the HTTP client reads slowly.
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      return true;
    } catch {
      closed = true;
      upstreamAbort.abort();
      return false;
    }
  };

  const headers = buildHeaders(apiKey);
  const baseUrl = apiUrl.replace(/\/+$/, "");
  const threadId = createId();
  let threadCreated = false;
  let threadCleanupPromise: Promise<void> | undefined;

  const cleanupTemporaryThread = (): Promise<void> => {
    if (!cleanupThread || !threadCreated) return Promise.resolve();
    if (!threadCleanupPromise) {
      threadCleanupPromise = deleteThread(baseUrl, threadId, headers);
      try {
        waitUntil?.(threadCleanupPromise);
      } catch {
        // Cleanup is still awaited below when a runtime hook rejects registration.
      }
    }
    return threadCleanupPromise;
  };

  const pump = async () => {
    try {
      // The event stream must be open before run.start. Reversing this order
      // can miss early events or deadlock against servers waiting for a
      // subscriber. No namespace filter is intentional: DeepAgents emits
      // from nested `model_request:*` and `tools:*` namespaces.
      const eventsResponsePromise = fetch(`${baseUrl}/threads/${threadId}/stream/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({ channels: ["custom:openui", "lifecycle"] }),
        signal: upstreamAbort.signal,
      });

      // Settle immediately so a fast run.start failure can never become an
      // unhandled rejection while the event subscription is connecting.
      const startRunResultPromise = startRun({
        baseUrl,
        threadId,
        assistantId,
        input,
        headers,
        signal: upstreamAbort.signal,
        debug,
      }).then(
        (result) => ({ ok: true as const, result }),
        (error: unknown) => ({ ok: false as const, error }),
      );

      const eventsResponse = await eventsResponsePromise;
      if (!eventsResponse.ok || !eventsResponse.body) {
        upstreamAbort.abort();
        const startResult = await startRunResultPromise;
        threadCreated = startResult.ok;
        throw new Error(`LangGraph event stream failed: ${eventsResponse.status}`);
      }

      const startResult = await startRunResultPromise;
      if (!startResult.ok) throw startResult.error;
      threadCreated = true;
      const { runId } = startResult.result;
      if (!runId) throw new Error("LangGraph run.start returned no run id");

      await send({
        type: EventType.RUN_STARTED,
        threadId,
        runId,
      });

      const eventReader = eventsResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processBlock = async (block: string): Promise<boolean> => {
        const parsed = parseSSEBlock(block);
        if (!parsed.data) return false;

        if (isOpenUIEventName(parsed.event)) {
          const event = extractAGUIEvent(parsed.data);
          if (!event) return false;

          const publicEvent = sanitizeAGUIEvent(event, debug);
          if (!(await send(publicEvent))) return true;
          return isTerminalEvent(publicEvent);
        }

        if (parsed.event !== "lifecycle") return false;
        const lifecycle = extractRootLifecycle(parsed.data);
        if (!lifecycle) return false;

        if (lifecycle.event === "completed" || lifecycle.event === "interrupted") {
          return send({ type: EventType.RUN_FINISHED, threadId, runId });
        }

        if (lifecycle.event === "failed") {
          const message =
            debug && typeof lifecycle.error === "string" ? lifecycle.error : "LangGraph run failed";
          return send({ type: EventType.RUN_ERROR, message });
        }

        return false;
      };

      while (!closed) {
        const { done, value } = await eventReader.read();
        buffer += decoder.decode(value, { stream: !done });

        const { blocks, remainder } = splitSSEBlocks(buffer);
        buffer = remainder;

        for (const block of blocks) {
          if (await processBlock(block)) {
            upstreamAbort.abort();
            return;
          }
        }

        if (done) {
          if (buffer.trim() && (await processBlock(buffer))) {
            upstreamAbort.abort();
            return;
          }
          if (!closed) await send({ type: EventType.RUN_FINISHED, threadId, runId });
          break;
        }
      }
    } catch (error) {
      if (!signal?.aborted && !closed) {
        await send({
          type: EventType.RUN_ERROR,
          message:
            debug && error instanceof Error ? error.message : "Unable to complete LangGraph run",
        });
      }
    } finally {
      upstreamAbort.abort();
      signal?.removeEventListener("abort", abortUpstream);
      await cleanupTemporaryThread();
      if (!closed) {
        try {
          await writer.close();
        } catch {
          // The consumer may already have cancelled the stream.
        }
      }
      closed = true;
    }
  };

  void pump();

  return new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        } catch (error) {
          if (closed) {
            controller.close();
          } else {
            controller.error(error);
          }
        }
      },
      async cancel(reason) {
        closed = true;
        upstreamAbort.abort(reason);
        await Promise.allSettled([reader.cancel(reason), cleanupTemporaryThread()]);
      },
    },
    { highWaterMark: 0 },
  );
}

async function startRun({
  baseUrl,
  threadId,
  assistantId,
  input,
  headers,
  signal,
  debug,
}: {
  baseUrl: string;
  threadId: string;
  assistantId: string;
  input: unknown;
  headers: HeadersInit;
  signal: AbortSignal;
  debug: boolean;
}): Promise<StartRunResult> {
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

  const responseText = await response.text();
  if (!response.ok) {
    const hint =
      debug && response.status === 404
        ? await getAssistantHint(baseUrl, headers, assistantId, signal)
        : undefined;
    throw new Error(
      [
        `LangGraph run.start failed: ${response.status}`,
        debug ? responseText.trim() || undefined : undefined,
        hint,
      ]
        .filter(Boolean)
        .join(". "),
    );
  }

  if (!responseText) return {};

  const payload = safeParseJSON(responseText);
  if (isErrorPayload(payload)) {
    throw new Error(
      debug ? (payload.message ?? "LangGraph run.start failed") : "LangGraph run.start failed",
    );
  }

  return { runId: getRunId(payload) };
}

async function deleteThread(
  baseUrl: string,
  threadId: string,
  headers: HeadersInit,
): Promise<void> {
  const cleanupAbort = new AbortController();
  const timeout = setTimeout(() => cleanupAbort.abort(), THREAD_CLEANUP_TIMEOUT_MS);
  try {
    await fetch(`${baseUrl}/threads/${threadId}`, {
      method: "DELETE",
      headers,
      signal: cleanupAbort.signal,
    });
  } catch {
    // Cleanup is best-effort and must not replace the run's terminal event.
  } finally {
    clearTimeout(timeout);
  }
}

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
      .filter((value): value is string => Boolean(value));

    if (!registered.length) return undefined;
    return `Configured assistant "${assistantId}" is not registered on this LangGraph server; available graph ids: ${registered.join(", ")}`;
  } catch {
    return undefined;
  }
}

function buildHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
}

function splitSSEBlocks(buffer: string): { blocks: string[]; remainder: string } {
  const blocks = buffer.split(/\r\n\r\n|\n\n|\r\r/);
  return { blocks: blocks.slice(0, -1), remainder: blocks.at(-1) ?? "" };
}

function parseSSEBlock(block: string): ProtocolSSEEvent {
  let event = "";
  const dataLines: string[] = [];

  for (const line of block.split(/\r\n|\r|\n/)) {
    if (line.startsWith("event:")) {
      event = stripSSEFieldPrefix(line.slice(6));
    } else if (line.startsWith("data:")) {
      dataLines.push(stripSSEFieldPrefix(line.slice(5)));
    }
  }

  return { event, data: dataLines.join("\n") };
}

function stripSSEFieldPrefix(value: string): string {
  return value.startsWith(" ") ? value.slice(1) : value;
}

function extractAGUIEvent(data: string): AGUIEvent | undefined {
  const parsed = safeParseJSON(data);
  if (isProtocolEventEnvelope(parsed)) {
    return extractCustomPayload(parsed.params.data);
  }
  return isAGUIEvent(parsed) ? parsed : undefined;
}

function extractRootLifecycle(data: string): LifecyclePayload | undefined {
  const parsed = safeParseJSON(data);
  if (!isProtocolEventEnvelope(parsed)) return undefined;
  if (!Array.isArray(parsed.params.namespace) || parsed.params.namespace.length !== 0) {
    return undefined;
  }
  return isLifecyclePayload(parsed.params.data) ? parsed.params.data : undefined;
}

function sanitizeAGUIEvent(event: AGUIEvent, debug: boolean): AGUIEvent {
  if (debug || event.type !== EventType.RUN_ERROR) return event;
  return { type: EventType.RUN_ERROR, message: "LangGraph run failed" };
}

function isOpenUIEventName(event: string): boolean {
  return event === "custom" || event === "custom:openui";
}

function extractCustomPayload(data: unknown): AGUIEvent | undefined {
  if (isNamedCustomPayload(data)) {
    if (data.name !== "openui") return undefined;
    return isAGUIEvent(data.payload) ? data.payload : undefined;
  }

  return isAGUIEvent(data) ? data : undefined;
}

function safeParseJSON(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function isProtocolEventEnvelope(value: unknown): value is ProtocolEventEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "params" in value &&
    typeof value.params === "object" &&
    value.params !== null &&
    "data" in value.params
  );
}

function isNamedCustomPayload(value: unknown): value is NamedCustomPayload {
  return typeof value === "object" && value !== null && "name" in value && "payload" in value;
}

function isLifecyclePayload(value: unknown): value is LifecyclePayload {
  return typeof value === "object" && value !== null && "event" in value;
}

function isAGUIEvent(value: unknown): value is AGUIEvent {
  return (
    typeof value === "object" && value !== null && "type" in value && typeof value.type === "string"
  );
}

function isErrorPayload(value: unknown): value is { type: "error"; message?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "error" &&
    (!("message" in value) || typeof value.message === "string")
  );
}

function getRunId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("result" in value)) return undefined;
  const result = value.result;
  if (typeof result !== "object" || result === null || !("run_id" in result)) return undefined;
  return typeof result.run_id === "string" && result.run_id.length > 0 ? result.run_id : undefined;
}

function isTerminalEvent(event: AGUIEvent): boolean {
  return event.type === EventType.RUN_ERROR || event.type === EventType.RUN_FINISHED;
}
