import type OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

/**
 * Function-tool execution loop for the OpenUI Cloud Responses API.
 *
 * OpenUI Cloud executes its own tools (artifacts, web_search, image_search,
 * MCP) server-side, but `type: "function"` tools you declare are executed by
 * YOUR server: the model emits a `function_call`, you run it, post the
 * `function_call_output` back, and the model continues — possibly calling more
 * tools — until it produces the final answer.
 *
 * Two rules make this safe alongside Cloud's server-side tools, and both are
 * enforced here rather than left to the caller:
 *
 * 1. Execute ONLY calls whose `name` you declared (the keys of `tools`).
 *    Cloud streams some of its own tools as real-named `function_call` items
 *    (e.g. `thesys_generate_report` carrying the artifact program) — those are
 *    already executed server-side and must never be run or answered again.
 * 2. Skip any call whose `call_id` already received a `function_call_output`
 *    on the same stream. The API never streams an output for a call it wants
 *    the client to execute, so an output's presence means "already settled".
 */

export type FunctionToolExecutor = (
  argsJson: string,
  ctx: { callId: string; signal?: AbortSignal },
) => Promise<string>;

export interface RunFunctionToolLoopOptions {
  client: OpenAI;
  /** The params of the original request; reused verbatim for continuations. */
  createParams: Record<string, unknown>;
  /** The already-open stream of the first response. */
  firstStream: AsyncIterable<Record<string, unknown>>;
  /** name → executor. The keys are the ONLY tool names this loop will run. */
  tools: Record<string, FunctionToolExecutor>;
  /** Receives every stream event (forward these to the browser as SSE). */
  enqueue: (event: Record<string, unknown>) => void;
  /** Propagates browser aborts into executors and continuation requests. */
  signal?: AbortSignal;
  /** Cap on model round-trips after tool results (default 5). */
  maxRounds?: number;
}

interface PendingCall {
  callId: string;
  name: string;
  argsJson: string;
}

/**
 * Drive the stream to completion, executing declared function tools between
 * model turns. Resolves when the model finishes without requesting any of the
 * caller's tools (or `maxRounds` is reached).
 */
export async function runFunctionToolLoop(options: RunFunctionToolLoopOptions): Promise<void> {
  const { client, createParams, tools, enqueue, signal, maxRounds = 5 } = options;

  let pending = await consumeStream(options.firstStream, tools, enqueue);

  for (let round = 0; round < maxRounds && pending.length > 0; round++) {
    const outputs: ResponseInputItem[] = [];
    for (const call of pending) {
      let output: string;
      try {
        output = await tools[call.name]!(call.argsJson, { callId: call.callId, signal });
      } catch (err) {
        output = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
      }
      const item = { type: "function_call_output" as const, call_id: call.callId, output };
      outputs.push(item);
      // Surface the result to the browser so the tool tray can render it.
      enqueue({
        type: "response.output_item.added",
        item: { ...item, id: `fc_out_${call.callId}` },
      });
    }

    const stream = (await client.responses.create(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...createParams, input: outputs, stream: true } as any,
      { signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;

    pending = await consumeStream(stream, tools, enqueue);
  }
}

/**
 * Forward every event and collect the declared-tool calls that the stream
 * leaves unanswered. Arguments may arrive on the added item, as deltas, or on
 * the done item — all three are handled, last write wins.
 */
async function consumeStream(
  stream: AsyncIterable<Record<string, unknown>>,
  tools: Record<string, FunctionToolExecutor>,
  enqueue: (event: Record<string, unknown>) => void,
): Promise<PendingCall[]> {
  const callsByItemId = new Map<string, PendingCall>();
  const calls: PendingCall[] = [];
  const answeredCallIds = new Set<string>();

  for await (const event of stream) {
    enqueue(event);

    const type = event.type;
    if (type === "response.output_item.added" || type === "response.output_item.done") {
      const item = event.item as
        | { type?: string; id?: string; call_id?: string; name?: string; arguments?: string }
        | undefined;
      if (item?.type === "function_call_output" && item.call_id) {
        answeredCallIds.add(item.call_id);
      } else if (item?.type === "function_call" && item.call_id && item.name) {
        const known =
          (item.id ? callsByItemId.get(item.id) : undefined) ?? callsByItemId.get(item.call_id);
        if (known) {
          if (item.arguments != null) known.argsJson = item.arguments;
        } else if (item.name in tools) {
          // Rule 1: track only declared tools — everything else (including
          // Cloud-internal thesys_* calls) is passed through untouched.
          const call: PendingCall = {
            callId: item.call_id,
            name: item.name,
            argsJson: item.arguments ?? "",
          };
          calls.push(call);
          if (item.id) callsByItemId.set(item.id, call);
          callsByItemId.set(item.call_id, call);
        }
      }
    } else if (type === "response.function_call_arguments.delta") {
      const call = callsByItemId.get(event.item_id as string);
      if (call && typeof event.delta === "string") call.argsJson += event.delta;
    } else if (type === "response.function_call_arguments.done") {
      const call = callsByItemId.get(event.item_id as string);
      if (call && typeof event.arguments === "string") call.argsJson = event.arguments;
    }
  }

  // Rule 2: a call that already has an output on this stream is settled.
  return calls.filter((call) => !answeredCallIds.has(call.callId));
}
