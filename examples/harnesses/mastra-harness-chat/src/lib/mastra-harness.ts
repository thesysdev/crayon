import { Agent } from "@mastra/core/agent";
import { Harness, type Session, type ToolCategory } from "@mastra/core/harness";
import { createTool } from "@mastra/core/tools";
import { LibSQLStore } from "@mastra/libsql";
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";

const systemPrompt = readFileSync(
  join(process.cwd(), "src/generated/system-prompt.txt"),
  "utf-8",
);

const HARNESS_CONFIG_VERSION = "2026-07-04.1";

const getWeather = createTool({
  id: "get_weather",
  description: "Get current weather for a city.",
  inputSchema: z.object({ location: z.string().describe("City name") }),
  execute: async ({ location }) => {
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
    const temp = knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
    return { location, temperature_celsius: temp, condition: "Clear" };
  },
});

const getStockPrice = createTool({
  id: "get_stock_price",
  description: "Get current stock price for a ticker symbol.",
  inputSchema: z.object({ symbol: z.string().describe("Ticker symbol, e.g. AAPL") }),
  execute: async ({ symbol }) => {
    const prices: Record<string, number> = {
      AAPL: 189.84,
      GOOGL: 141.8,
      TSLA: 248.42,
      MSFT: 378.91,
      NVDA: 875.28,
    };
    const s = symbol.toUpperCase();
    const price = prices[s] ?? Math.floor(Math.random() * 500 + 50);
    return { symbol: s, price, currency: "USD" };
  },
});

function modelConfig() {
  return {
    id: (process.env.OPENAI_MODEL as `${string}/${string}`) || "openai/gpt-5.5",
    apiKey: process.env.OPENAI_API_KEY,
    url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  };
}

function toolCategoryResolver(toolName: string): ToolCategory {
  if (
    toolName === "get_weather" ||
    toolName === "get_stock_price" ||
    toolName.startsWith("task_")
  ) {
    return "read";
  }
  return "other";
}

function createHarness() {
  mkdirSync(join(process.cwd(), ".mastra-harness-chat"), { recursive: true });

  const agent = new Agent({
    id: "openui-mastra-harness-agent",
    name: "OpenUI Mastra Harness Agent",
    instructions:
      "You are a helpful assistant. Use tools when relevant, and always answer with valid OpenUI Lang for the configured component library.\n\n" +
      systemPrompt,
    model: modelConfig(),
    tools: { get_weather: getWeather, get_stock_price: getStockPrice },
  });

  return new Harness({
    id: "openui-mastra-harness",
    storage: new LibSQLStore({
      id: "openui-mastra-harness-storage",
      url: process.env.MASTRA_HARNESS_DB_URL || "file:./.mastra-harness-chat/openui-harness.db",
    }),
    agent,
    defaultModeId: "default",
    modes: [
      {
        id: "default",
        name: "Default",
        description: "Use tools and render complete OpenUI responses.",
        metadata: { default: true },
        instructions:
          [
            "Optimize for useful depth, exploration, and rich generated UI.",
            "When the prompt asks for analysis, planning, comparison, status, or data, prefer structured UI such as SectionBlock, Table, TagBlock, ListBlock, charts, and FollowUpBlock.",
            "Use tools when relevant and include the tool-derived facts in the rendered UI.",
            "Default shape: root = Card([header, overview, details, actions, followups]) or a richer equivalent.",
          ].join("\n"),
      },
    ],
    disableBuiltinTools: ["ask_user", "submit_plan", "subagent"],
    toolCategoryResolver,
  });
}

export interface HarnessSessionEntry {
  session: Session;
  lastUsed: number;
}

const IDLE_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 50;

const globalStore = globalThis as unknown as {
  __openuiMastraHarness?: Harness;
  __openuiMastraHarnessConfigSignature?: string;
  __openuiMastraHarnessInit?: Promise<void>;
  __openuiMastraHarnessSessions?: Map<string, HarnessSessionEntry>;
  __openuiMastraHarnessCreating?: Map<string, Promise<HarnessSessionEntry>>;
};

const SESSIONS = (globalStore.__openuiMastraHarnessSessions ??= new Map<
  string,
  HarnessSessionEntry
>());
const CREATING = (globalStore.__openuiMastraHarnessCreating ??= new Map<
  string,
  Promise<HarnessSessionEntry>
>());

function harnessConfigSignature(): string {
  return JSON.stringify({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    baseUrl: process.env.OPENAI_BASE_URL ?? "",
    dbUrl: process.env.MASTRA_HARNESS_DB_URL ?? "",
    model: process.env.OPENAI_MODEL ?? "",
    version: HARNESS_CONFIG_VERSION,
  });
}

async function getHarness(): Promise<Harness> {
  const signature = harnessConfigSignature();
  if (
    globalStore.__openuiMastraHarness &&
    globalStore.__openuiMastraHarnessConfigSignature !== signature
  ) {
    for (const entry of SESSIONS.values()) {
      await releaseSession(entry);
    }
    SESSIONS.clear();
    CREATING.clear();
    await globalStore.__openuiMastraHarness.destroy();
    globalStore.__openuiMastraHarness = undefined;
    globalStore.__openuiMastraHarnessInit = undefined;
  }

  const harness = (globalStore.__openuiMastraHarness ??= createHarness());
  globalStore.__openuiMastraHarnessConfigSignature = signature;
  globalStore.__openuiMastraHarnessInit ??= harness.init();
  await globalStore.__openuiMastraHarnessInit;
  return harness;
}

async function releaseSession(entry: HarnessSessionEntry): Promise<void> {
  entry.session.abort();
  await entry.session.thread.clearAndReleaseLock().catch(() => undefined);
}

async function evictIdle(now: number): Promise<void> {
  for (const [id, entry] of SESSIONS) {
    if (now - entry.lastUsed > IDLE_TTL_MS && !entry.session.run.isRunning()) {
      await releaseSession(entry);
      SESSIONS.delete(id);
    }
  }
}

async function evictOldestIfFull(): Promise<void> {
  if (SESSIONS.size < MAX_SESSIONS) return;
  let oldestId: string | undefined;
  let oldest = Number.POSITIVE_INFINITY;
  for (const [id, entry] of SESSIONS) {
    if (entry.session.run.isRunning()) continue;
    if (entry.lastUsed < oldest) {
      oldest = entry.lastUsed;
      oldestId = id;
    }
  }
  if (oldestId) {
    const entry = SESSIONS.get(oldestId);
    if (entry) await releaseSession(entry);
    SESSIONS.delete(oldestId);
  }
}

async function createSession(conversationId: string): Promise<HarnessSessionEntry> {
  await evictOldestIfFull();

  const harness = await getHarness();
  const session = await harness.createSession({
    resourceId: `openui-thread:${conversationId}`,
  });
  session.grantCategory("read");

  return { session, lastUsed: Date.now() };
}

export async function getOrCreateHarnessSession(
  conversationId: string,
): Promise<HarnessSessionEntry> {
  const now = Date.now();
  await evictIdle(now);

  const existing = SESSIONS.get(conversationId);
  if (existing) {
    existing.lastUsed = now;
    return existing;
  }

  const inFlight = CREATING.get(conversationId);
  if (inFlight) return inFlight;

  const creation = createSession(conversationId)
    .then((entry) => {
      SESSIONS.set(conversationId, entry);
      return entry;
    })
    .finally(() => {
      CREATING.delete(conversationId);
    });

  CREATING.set(conversationId, creation);
  return creation;
}
