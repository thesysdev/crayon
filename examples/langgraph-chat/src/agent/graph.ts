import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import { getStockPrice, getWeather, searchWeb } from "./tools";

/**
 * The OpenUI system prompt is generated from `src/library.ts` by the OpenUI
 * CLI (`pnpm generate:prompt`). It teaches the model to answer in OpenUI Lang
 * so the renderer can turn each reply into live React components.
 *
 * Every specialist shares this prompt, which is what makes their streamed
 * output render as generative UI in the chat.
 */
function loadSystemPrompt(): string {
  const candidates = [
    // Primary: relative to the working dir (how `langgraphjs dev` runs).
    join(process.cwd(), "src/generated/system-prompt.txt"),
    // Fallback: relative to this module, for runners whose cwd differs.
    join(dirname(fileURLToPath(import.meta.url)), "../generated/system-prompt.txt"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return readFileSync(path, "utf-8");
  }
  throw new Error(
    "OpenUI system prompt not found. Run `pnpm generate:prompt` before starting the graph.",
  );
}

const OPENUI_SYSTEM_PROMPT = loadSystemPrompt();

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

/** Streaming model used by the specialists (tokens stream to the UI). */
const chatModel = new ChatOpenAI({ model: MODEL, streaming: true });

/** Non-streaming model used by the router for a single structured decision. */
const routerModel = new ChatOpenAI({ model: MODEL });

// ── Specialists ──────────────────────────────────────────────────
// Each specialist owns one tool and a short role hint layered on top of the
// shared OpenUI prompt. Add a specialist by extending this map and wiring a
// matching agent/tools node pair below.

const SPECIALISTS = {
  weather: {
    tools: [getWeather],
    hint: "You are the weather specialist. Use get_weather, then present conditions and the forecast as generative UI (cards, stats, a small table).",
  },
  finance: {
    tools: [getStockPrice],
    hint: "You are the finance specialist. Use get_stock_price, then present the quote and day range as generative UI (stat cards, a chart or table).",
  },
  research: {
    tools: [searchWeb],
    hint: "You are the research specialist. Use search_web, then summarize the findings as generative UI (headings, lists, callouts).",
  },
} as const;

type Specialist = keyof typeof SPECIALISTS;

// ── State ────────────────────────────────────────────────────────

const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  next: Annotation<Specialist>(),
});

type State = typeof AgentState.State;

// ── Router node ──────────────────────────────────────────────────

const RouteSchema = z.object({
  next: z
    .enum(["weather", "finance", "research"])
    .describe("Which specialist should handle the most recent user request."),
});

const ROUTER_PROMPT = [
  "You are a supervisor routing a user request to exactly one specialist:",
  "- weather: current weather, forecasts, climate for a place.",
  "- finance: stock prices, tickers, market data.",
  "- research: everything else / general questions that need a web lookup.",
  "Pick the single best specialist for the latest user message.",
].join("\n");

async function router(state: State): Promise<Partial<State>> {
  try {
    const decision = await routerModel
      .withStructuredOutput(RouteSchema, { name: "route" })
      .invoke([new SystemMessage(ROUTER_PROMPT), ...state.messages]);
    return { next: decision.next };
  } catch {
    // Default to research if structured routing fails for any reason.
    return { next: "research" };
  }
}

// ── Agent node factory ───────────────────────────────────────────

function agentNode(specialist: Specialist) {
  const { tools, hint } = SPECIALISTS[specialist];
  const boundModel = chatModel.bindTools([...tools]);
  const systemMessage = new SystemMessage(`${OPENUI_SYSTEM_PROMPT}\n\n${hint}`);

  return async (state: State): Promise<Partial<State>> => {
    const response = await boundModel.invoke([systemMessage, ...state.messages]);
    return { messages: [response] };
  };
}

/** After an agent runs, loop to its tools if it requested any, else finish. */
function routeAfterAgent(state: State): "tools" | "end" {
  const last = state.messages[state.messages.length - 1] as AIMessage | undefined;
  return last?.tool_calls?.length ? "tools" : "end";
}

// ── Graph wiring ─────────────────────────────────────────────────
// Nodes are wired explicitly (rather than in a loop) to keep LangGraph's
// node-name types intact. Each specialist is its own ReAct loop:
//   agent -> (tool_calls?) -> tools -> agent -> ... -> END

export const graph = new StateGraph(AgentState)
  .addNode("router", router)
  .addNode("weather_agent", agentNode("weather"))
  .addNode("weather_tools", new ToolNode([...SPECIALISTS.weather.tools]))
  .addNode("finance_agent", agentNode("finance"))
  .addNode("finance_tools", new ToolNode([...SPECIALISTS.finance.tools]))
  .addNode("research_agent", agentNode("research"))
  .addNode("research_tools", new ToolNode([...SPECIALISTS.research.tools]))
  .addEdge(START, "router")
  .addConditionalEdges("router", (state: State) => state.next, {
    weather: "weather_agent",
    finance: "finance_agent",
    research: "research_agent",
  })
  .addConditionalEdges("weather_agent", routeAfterAgent, {
    tools: "weather_tools",
    end: END,
  })
  .addEdge("weather_tools", "weather_agent")
  .addConditionalEdges("finance_agent", routeAfterAgent, {
    tools: "finance_tools",
    end: END,
  })
  .addEdge("finance_tools", "finance_agent")
  .addConditionalEdges("research_agent", routeAfterAgent, {
    tools: "research_tools",
    end: END,
  })
  .addEdge("research_tools", "research_agent")
  .compile();
