import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const runtime = "nodejs";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const payload = (await req.json()) as { messages?: UIMessage[] };
  if (!Array.isArray(payload.messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }

  const result = streamText({
    model: openai.chat(process.env.OPENAI_MODEL ?? "gpt-5.2"),
    system: generateSystemPrompt({ library: librarySpec, promptOptions }),
    messages: await convertToModelMessages(payload.messages),
    abortSignal: req.signal,
  });

  // Preserve the AI SDK's native UIMessage stream. The frontend adapter uses
  // the AI SDK itself to decode it before mapping chunks into OpenUI events.
  return result.toUIMessageStreamResponse();
}
