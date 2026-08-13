import { createLangChainStreamResponse } from "@openuidev/langchain";

export const runtime = "nodejs";

const API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const ASSISTANT_ID = process.env.LANGGRAPH_ASSISTANT_ID || "agent";

/**
 * Browser-to-Agent-Server proxy. The agent itself lives in src/agent/agent.ts
 * and can be run locally or deployed independently to LangSmith.
 */
export async function POST(request: Request) {
  return createLangChainStreamResponse(request, {
    apiUrl: API_URL,
    assistantId: ASSISTANT_ID,
    apiKey: process.env.LANGSMITH_API_KEY,
    debug: process.env.NODE_ENV !== "production",
  });
}
