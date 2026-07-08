import { envOr, requiredEnv } from "@/lib/env";
import { shadcnLibraryConfig } from "@/lib/shadcn-genui/server";
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

// ── Function tool implementations (kept from the pre-cloud shadcn route) ──

function getWeather({ location }: { location: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const knownTemps: Record<string, number> = {
        tokyo: 22,
        "san francisco": 18,
        london: 14,
        "new york": 25,
        paris: 19,
        sydney: 27,
        mumbai: 33,
        berlin: 16,
      };
      const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear Skies"];
      const temp = knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      resolve(
        JSON.stringify({
          location,
          temperature_celsius: temp,
          temperature_fahrenheit: Math.round(temp * 1.8 + 32),
          condition,
          humidity_percent: Math.floor(Math.random() * 40 + 40),
          wind_speed_kmh: Math.floor(Math.random() * 25 + 5),
          forecast: [
            { day: "Tomorrow", high: temp + 2, low: temp - 4, condition: "Partly Cloudy" },
            { day: "Day After", high: temp + 1, low: temp - 3, condition: "Sunny" },
          ],
        }),
      );
    }, 800);
  });
}

function getStockPrice({ symbol }: { symbol: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const s = symbol.toUpperCase();
      const knownPrices: Record<string, number> = {
        AAPL: 189.84,
        GOOGL: 141.8,
        TSLA: 248.42,
        MSFT: 378.91,
        AMZN: 178.25,
        NVDA: 875.28,
        META: 485.58,
      };
      const price = knownPrices[s] ?? Math.floor(Math.random() * 500 + 20);
      const change = parseFloat((Math.random() * 8 - 4).toFixed(2));
      resolve(
        JSON.stringify({
          symbol: s,
          price: parseFloat((price + change).toFixed(2)),
          change,
          change_percent: parseFloat(((change / price) * 100).toFixed(2)),
          volume: `${(Math.random() * 50 + 10).toFixed(1)}M`,
          day_high: parseFloat((price + Math.abs(change) + 1.5).toFixed(2)),
          day_low: parseFloat((price - Math.abs(change) - 1.2).toFixed(2)),
        }),
      );
    }, 600);
  });
}

function searchWeb({ query }: { query: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        JSON.stringify({
          query,
          results: [
            {
              title: `Top result for "${query}"`,
              snippet: `Comprehensive overview of ${query} with the latest information.`,
            },
            {
              title: `${query} - Latest News`,
              snippet: `Recent developments and updates related to ${query}.`,
            },
            {
              title: `Understanding ${query}`,
              snippet: `An in-depth guide explaining everything about ${query}.`,
            },
          ],
        }),
      );
    }, 1000);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const functionRegistry: Record<string, (args: any) => Promise<string>> = {
  get_weather: getWeather,
  get_stock_price: getStockPrice,
  search_web: searchWeb,
};

// Responses-API function tool shape (flat — not the chat-completions nesting).
const functionTools = [
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather for a location.",
    parameters: {
      type: "object",
      properties: { location: { type: "string", description: "City name" } },
      required: ["location"],
    },
  },
  {
    type: "function",
    name: "get_stock_price",
    description: "Get stock price for a ticker symbol.",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string", description: "Ticker symbol, e.g. AAPL" } },
      required: ["symbol"],
    },
  },
  {
    type: "function",
    name: "search_web",
    description: "Search the web for information.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Search query" } },
      required: ["query"],
    },
  },
];

// ── Tool-calling loop ──

interface PendingFunctionCall {
  call_id: string;
  name: string;
  arguments: string;
}

/** Run every requested function and build the follow-up input items. */
async function executeFunctionCalls(
  calls: PendingFunctionCall[],
): Promise<ResponseInputItem[]> {
  return Promise.all(
    calls.map(async (call): Promise<ResponseInputItem> => {
      let output: string;
      try {
        const impl = functionRegistry[call.name];
        output = impl
          ? await impl(JSON.parse(call.arguments || "{}"))
          : JSON.stringify({ error: `Unknown tool: ${call.name}` });
      } catch (err) {
        output = JSON.stringify({
          error: err instanceof Error ? err.message : "tool execution failed",
        });
      }
      return { type: "function_call_output", call_id: call.call_id, output };
    }),
  );
}

// The model rarely needs more than a couple of rounds; the cap only guards
// against a runaway request-tool-request cycle.
const MAX_TOOL_ROUNDS = 5;

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

  const createRound = (roundInput: ResponseInputItem[]) =>
    client.responses.create(
      {
        model: envOr("OPENUI_MODEL", "google/gemini-3.5-flash-free"),
        conversation: threadId,
        input: roundInput,
        stream: true,
        store: true,
        tools: [
          artifactTool({ artifacts: ["slides", "report"] }),
          { type: "web_search" },
          { type: "image_search" },
          ...functionTools,
        ],
        instructions: createResponsesInstructions({ componentLibrary: shadcnLibraryConfig }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { signal: req.signal },
    ) as Promise<unknown> as Promise<AsyncIterable<Record<string, unknown>>>;

  // First round outside the stream so upstream request errors stay HTTP errors.
  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = await createRound(input);
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
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      // Forward every event to the client and collect the round's function
      // calls (completed `function_call` output items).
      const pumpRound = async (roundStream: AsyncIterable<Record<string, unknown>>) => {
        const calls: PendingFunctionCall[] = [];
        for await (const event of roundStream) {
          send(event);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = event as any;
          if (e?.type === "response.output_item.done" && e.item?.type === "function_call") {
            calls.push({
              call_id: e.item.call_id,
              name: e.item.name,
              arguments: e.item.arguments ?? "",
            });
          }
        }
        return calls;
      };

      try {
        let calls = await pumpRound(stream);

        // Tool-calling loop: execute the requested functions, feed the results
        // back into the same stored conversation, and stream the next response.
        // Repeats until a round completes without function calls.
        for (let round = 0; calls.length > 0; round++) {
          if (round >= MAX_TOOL_ROUNDS) {
            send({
              type: "error",
              message: `Tool loop exceeded ${MAX_TOOL_ROUNDS} rounds — aborting.`,
            });
            break;
          }
          const outputs = await executeFunctionCalls(calls);
          calls = await pumpRound(await createRound(outputs));
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
