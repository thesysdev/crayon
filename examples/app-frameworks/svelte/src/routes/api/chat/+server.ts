import { env } from "$env/dynamic/private";
import { library, promptOptions } from "$lib/library";
import { tools } from "$lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt, type ChatLibrary } from "@openuidev/thesys-server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";

const openai = createOpenAI({
  apiKey: env.THESYS_API_KEY ?? "",
  baseURL: "https://api.thesys.dev/v1/embed",
});

const { components: _components, ...chatLibrary } = library.toSpec() as ChatLibrary & {
  components?: unknown;
};

const systemPrompt = generateSystemPrompt({
  library: chatLibrary,
  promptOptions: {
    examples: promptOptions.examples,
    preamble: promptOptions.preamble,
    additionalRules: promptOptions.additionalRules,
  },
});

export async function POST({ request }: { request: Request }) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai.chat(env.OPENUI_MODEL || "google/gemini-3.6-flash-free"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
