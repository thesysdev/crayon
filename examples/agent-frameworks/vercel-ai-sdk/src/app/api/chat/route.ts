import { storeTurn, THESYS_API_URL } from "@/lib/chat-history";
import { cloudInstructions } from "@/lib/cloud-prompt";
import { tools } from "@/lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";

const openai = createOpenAI({
  baseURL: `${THESYS_API_URL}/v1/embed`,
  apiKey: process.env.THESYS_API_KEY,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractText(msg: any): string {
  const content = msg?.content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.parts)
        return parsed.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
    } catch {
      /* plain string */
    }
    return content;
  }
  if (Array.isArray(content))
    return content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  if (Array.isArray(msg?.parts))
    return msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  if (typeof msg?.text === "string") return msg.text;
  return JSON.stringify(msg);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastUserMsg = (messages as any[]).filter((m: any) => m.role === "user").pop();

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai.chat("google/gemini-3.6-flash-free"),
    system: cloudInstructions(),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    // Each step's text is one segment of the reply, as the chat shows it.
    onFinish: ({ steps }) =>
      storeTurn(
        threadId,
        extractText(lastUserMsg),
        steps.map((step) => step.text),
      ),
  });

  return result.toUIMessageStreamResponse();
}
