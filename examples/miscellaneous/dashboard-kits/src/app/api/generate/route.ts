import OpenAI from "openai";
import { getKit } from "../../../kits";
import { buildSystemPrompt } from "../../../kits/server";

export const runtime = "nodejs";

// Self-hosted serving: the kit's full system prompt (components, tools, rules,
// examples) is built here and sent as the system message. The model streams
// openui-lang back; the browser renders it with the same kit library.
function client() {
  if (process.env.THESYS_API_KEY) {
    return {
      openai: new OpenAI({
        apiKey: process.env.THESYS_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL ?? "https://api.thesys.dev/v1/embed",
      }),
      model: process.env.OPENUI_MODEL ?? "openai/gpt-5.5",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      openai: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      }),
      model: process.env.OPENUI_MODEL ?? "gpt-5.5",
    };
  }
  return null;
}

export async function POST(request: Request) {
  const { kit: kitId, prompt } = (await request.json()) as { kit?: string; prompt?: string };
  const kit = getKit(kitId ?? "");
  if (!kit || !prompt?.trim()) {
    return Response.json({ error: "Send a kit id and a prompt." }, { status: 400 });
  }
  const llm = client();
  if (!llm) {
    return Response.json(
      { error: "Set THESYS_API_KEY or OPENAI_API_KEY in .env.local, then restart." },
      { status: 503 },
    );
  }

  const stream = await llm.openai.chat.completions.create(
    {
      model: llm.model,
      stream: true,
      messages: [
        { role: "system", content: buildSystemPrompt(kit) },
        { role: "user", content: prompt },
      ],
    },
    { signal: request.signal },
  );

  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Model": llm.model } },
  );
}
