import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt, type ChatLibrary } from "@openuidev/thesys-server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { library, promptOptions } from "~/lib/library";
import { tools } from "~/lib/tools";

const openai = createOpenAI({
  apiKey: process.env.THESYS_API_KEY ?? "",
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

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);

  const result = streamText({
    model: openai.chat(process.env.OPENUI_MODEL || "google/gemini-3.6-flash-free"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
});
