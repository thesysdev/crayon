import { cloudInstructions } from "@/lib/cloud-prompt";
import { CLOUD_EMBED_URL, DEFAULT_MODEL, requiredEnv } from "@/lib/env";
import { runFunctionToolLoop, type FunctionToolExecutor } from "@/lib/tool-loop";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";

import { setCurrentThreadId, tools } from "./tools";

const SPREADSHEET_INSTRUCTIONS = `
You are a helpful spreadsheet assistant. The user has a live Excel-like spreadsheet visible on the left panel at all times.

CAPABILITIES:
- View and analyze the current table data via the get_table_data tool
- Update individual cells or ranges
- Add formulas (386+ Excel-compatible functions: SUM, AVERAGE, IF, VLOOKUP, etc.)
- Add or delete rows and columns
- Query/filter data

CRITICAL RULES:

1. DO NOT modify the spreadsheet unless the user explicitly asks you to. Requests like "visualize", "show me", "analyze", "summarize" are READ-ONLY. For these, NEVER call update_cells, add_rows, delete_rows, set_formula, or add_column.

2. For READ-ONLY requests: use TextContent, MarkDownRenderer, Table, BarChart, LineChart, PieChart to display information. Do NOT use SpreadsheetTable for read-only requests.

3. For WRITE requests (user explicitly asks to change/add/delete data):
   a. Use the modification tools (update_cells, add_rows, delete_rows, set_formula, add_column).
   b. IMMEDIATELY after add_rows or delete_rows, ALWAYS call recalculate_aggregates to update Total/Average/Sum formulas.
   c. Then call get_table_data to get the updated data.
   d. Then you MUST emit a SpreadsheetTable component with the full updated data and colHeaders. This is how the live spreadsheet gets refreshed. Include it at the END of your response.
   e. Also include a TextContent message explaining what you changed.

4. Only call get_table_data when you need to read data (to answer a question or before/after a modification).

5. For tool calls, use zero-based indices (row 0, col 0 = cell A1). Cell references in formulas use Excel notation (A1, B2, etc.).

6. Common formulas: =SUM(range), =AVERAGE(range), =COUNT(range), =MAX(range), =MIN(range), =IF(condition, true_val, false_val)

IMPORTANT — OUTPUT FORMAT:
You MUST ALWAYS respond using OpenUI Lang syntax as described below. NEVER output plain text or markdown. Every response must define root = Stack([...]). Use TextContent for text paragraphs, MarkDownRenderer for formatted text, Table for tabular summaries, chart components for visualizations, and SpreadsheetTable ONLY after write operations to sync changes to the live spreadsheet.

FOLLOW-UP BUTTONS:
At the END of every response, ALWAYS include 2-3 follow-up suggestion buttons using Buttons([...]) with Button components. These help the user continue the conversation. Buttons without an Action prop automatically send their label as a message to you.
`.trim();

type LegacyTool = {
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    parse: (raw: string) => unknown;
    function: (args: never) => Promise<string>;
  };
};

const legacyTools = tools as LegacyTool[];

const appToolDeclarations = legacyTools.map((tool) => ({
  type: "function" as const,
  name: tool.function.name,
  description: tool.function.description,
  parameters: tool.function.parameters,
  strict: false,
}));

const appToolExecutors: Record<string, FunctionToolExecutor> = Object.fromEntries(
  legacyTools.map((tool) => [
    tool.function.name,
    async (argsJson: string) =>
      tool.function.function(tool.function.parse(argsJson || "{}") as never),
  ]),
);

export async function POST(req: Request) {
  const { threadId, messages } = (await req.json()) as {
    threadId?: string;
    messages?: ResponseInputItem[];
  };

  if (!threadId) return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty ResponseInputItem[]");
  }

  setCurrentThreadId(threadId);

  const client = new OpenAI({
    baseURL: CLOUD_EMBED_URL,
    apiKey: requiredEnv("THESYS_API_KEY"),
  });

  const createParams: ResponseCreateParamsNonStreaming = {
    model: DEFAULT_MODEL,
    conversation: threadId,
    input: messages.slice(-1),
    store: true,
    tools: appToolDeclarations as unknown as Tool[],
    instructions: cloudInstructions(SPREADSHEET_INSTRUCTIONS),
  };

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      { ...createParams, stream: true },
      { signal: req.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (err) {
    const e = err as { status?: number; error?: unknown; message?: string };
    return NextResponse.json(
      { error: e.error ?? { message: e.message ?? "upstream error" } },
      { status: e.status ?? 502 },
    );
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runFunctionToolLoop({
          client,
          createParams,
          firstStream: stream,
          tools: appToolExecutors,
          enqueue,
          signal: req.signal,
        });
      } catch (err) {
        enqueue({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
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

function badRequest(message: string): Response {
  return NextResponse.json({ error: { message } }, { status: 400 });
}
