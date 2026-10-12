import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall as ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { moodboardAgentPrompt } from "../../../../lib/moodboard-agent-prompt";
import { executeSearchStays, searchStaysTool, today } from "../../../../lib/tools/search-stays";
import { currencies } from "../../../../lib/trivago";
import { priceTrends } from "../../../../lib/trivago-trends";
import { suggestFollowUps, suggestStarters } from "../../../../moodboard/agent/follow-ups";
import { staysPiece, trendPiece, type Stay } from "../../../../moodboard/agent/pieces";
import {
  type AgentEvent,
  askTools,
  isAskTool,
  toQuestion,
} from "../../../../moodboard/agent/questions";

export const runtime = "nodejs";

type Piece = { id: string; kind: string; title: string; code: string };

// The moodboard planner as an agent. It streams the same header-and-program text as
// /api/moodboard, and between completions it can search trivago or ask the traveller a question.
// The response is one JSON event per line:
//
//   text    the planner's pieces, by completion ("segment"), as they stream
//   status  what the agent is doing, such as searching trivago
//   ask     a question for the traveller; the run pauses here
//   state   the conversation so far, which the page sends back with the answer to resume
//
// The route keeps no state: the page holds the conversation between requests.

const priceTrendsTool = {
  type: "function" as const,
  function: {
    name: "price_trends",
    description:
      "Forecast average nightly hotel prices by month for a destination from trivago, to find the cheapest time to go.",
    parameters: {
      type: "object",
      properties: {
        destination: { type: "string" },
        currency: { type: "string", enum: currencies },
        start_month: { type: "string", description: "YYYY-MM" },
        end_month: { type: "string", description: "YYYY-MM, up to 12 months after start_month." },
        stars: { type: "integer", enum: [3, 4, 5] },
      },
      required: ["destination", "currency", "start_month", "end_month", "stars"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const tools = [searchStaysTool(), priceTrendsTool, ...askTools];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
    board?: Piece[];
    selected?: string[];
    messages?: ChatCompletionMessageParam[];
    answer?: { id: string; value: unknown };
    followUps?: { asking: boolean };
  };
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");
  // After a turn, the page asks for a few chips: next steps, or likely answers to the open
  // question. A separate request, so the board finishes without waiting on them.
  if (body.followUps) {
    const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
    const chips = await suggestFollowUps(gateway, body.messages ?? [], body.followUps, request.signal);
    return Response.json({ chips });
  }
  if (!body.answer && !body.prompt?.trim())
    return Response.json({ error: "Describe the mood." }, { status: 400 });

  const canvas = body.board?.length
    ? `Canvas (current board):\n\n${body.board
        .map((piece) => `=== ${piece.id} | ${piece.kind} | ${piece.title}\n${piece.code}`)
        .join("\n\n")}\n\nSelected: ${body.selected?.length ? body.selected.join(", ") : "none"}`
    : "Canvas: empty.";

  // The page's copy of the conversation, then either the traveller's answer to the pending
  // question or their new request with the canvas as it is now.
  const messages: ChatCompletionMessageParam[] = [...(body.messages ?? [])];
  if (body.answer)
    messages.push({
      role: "tool",
      tool_call_id: body.answer.id,
      content: JSON.stringify({ answer: body.answer.value, canvas_now: canvas.slice(0, 6000) }),
    });
  else {
    // A question left unanswered (the card was cleared) still needs a result before a new turn.
    const answered = new Set(
      messages.flatMap((message) => (message.role === "tool" ? [message.tool_call_id] : [])),
    );
    for (const message of messages)
      if (message.role === "assistant")
        for (const call of message.tool_calls ?? [])
          if (!answered.has(call.id))
            messages.push({ role: "tool", tool_call_id: call.id, content: '{"skipped":true}' });
    messages.push({ role: "user", content: `${canvas}\n\nRequest: ${body.prompt!.trim()}` });
  }

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const encoder = new TextEncoder();
  const signal = request.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let segment = 0;
      // trivago pieces wait until the planner has written its own, so they join the board it
      // starts ("=== new board") rather than the one on the canvas before it.
      const held: string[] = [];
      try {
        for (let step = 0; step < 6; step++) {
          const completion = await gateway.chat.completions.create(
            {
              model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
              messages: [{ role: "system", content: moodboardAgentPrompt(today()) }, ...messages],
              tools,
              max_completion_tokens: 8000,
              stream: true,
            },
            { signal },
          );
          let content = "";
          const calls: ChatCompletionMessageToolCall[] = [];
          const mine = segment++;
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              content += delta.content;
              send({ type: "text", segment: mine, delta: delta.content });
            }
            for (const part of delta?.tool_calls ?? []) {
              const call = (calls[part.index] ??= {
                id: "",
                type: "function",
                function: { name: "", arguments: "" },
              });
              if (part.id) call.id = part.id;
              if (part.function?.name) call.function.name += part.function.name;
              if (part.function?.arguments) call.function.arguments += part.function.arguments;
            }
          }
          messages.push({
            role: "assistant",
            content: content || null,
            ...(calls.length ? { tool_calls: calls } : {}),
          });
          if (!calls.length) break;

          // Look things up first, then ask the first question. Only one question is shown at a
          // time; any others are put back to the model to ask later.
          let ask: ChatCompletionMessageToolCall | undefined;
          for (const call of calls) {
            const name = call.function.name;
            if (isAskTool(name)) {
              if (!ask) ask = call;
              else
                messages.push({
                  role: "tool",
                  tool_call_id: call.id,
                  content: JSON.stringify({ error: "One question at a time. Ask again if needed." }),
                });
              continue;
            }
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: await runTool(name, call.function.arguments),
            });
          }
          if (ask) {
            const args = JSON.parse(ask.function.arguments || "{}") as Record<string, unknown>;
            send({
              type: "ask",
              ask: { id: ask.id, question: toQuestion(ask.function.name, args) },
            });
            break;
          }
        }
      } catch (error) {
        if (!signal.aborted)
          send({ type: "error", message: (error as Error).message ?? "The planner failed." });
      } finally {
        if (!signal.aborted) {
          for (const piece of held)
            send({ type: "text", segment: segment++, delta: `\n${piece}\n` });
          send({ type: "state", messages });
        }
        controller.close();
      }

      // Runs a trivago tool, places its piece on the board, and returns what the model sees.
      async function runTool(name: string, argsJson: string) {
        try {
          if (name === "search_stays") {
            const destination = safeJson(argsJson).destination ?? "your destination";
            send({ type: "status", label: `Searching trivago for stays in ${destination}…` });
            const result = JSON.parse(await executeSearchStays(argsJson, { signal })) as {
              destination: string;
              check_in: string;
              check_out: string;
              nights: number;
              stays: (Stay & { id: string })[];
            };
            if (result.stays.length)
              held.push(staysPiece(result, result.stays));
            // The model hears what was found, not the photos or links.
            return JSON.stringify({
              placed_on_board: result.stays.length > 0,
              ...result,
              stays: result.stays.map(({ name, stars, guest_rating, price_per_night, location }) => ({
                name,
                stars,
                guest_rating,
                price_per_night,
                location,
              })),
            });
          }
          if (name === "price_trends") {
            const args = safeJson(argsJson);
            send({ type: "status", label: `Checking trivago price trends for ${args.destination}…` });
            const trend = await priceTrends(args, signal);
            if (trend.months.length)
              held.push(trendPiece(trend));
            return JSON.stringify({ placed_on_board: trend.months.length > 0, ...trend });
          }
          return JSON.stringify({ error: `Unknown tool ${name}.` });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform" },
  });
}

// Starter chips for an empty trip: GET /api/moodboard/agent?avoid=Kyoto,Goa
export async function GET(request: Request) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) return Response.json({ chips: [] });
  const avoid = (new URL(request.url).searchParams.get("avoid") ?? "")
    .split(",")
    .map((place) => place.trim())
    .filter(Boolean)
    .slice(0, 12);
  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  return Response.json({ chips: await suggestStarters(gateway, avoid, request.signal) });
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
