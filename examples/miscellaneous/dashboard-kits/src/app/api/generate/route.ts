import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { getKit } from "../../../kits";
import { modelClient } from "../../../kits/llm";
import { buildSystemPrompt } from "../../../kits/server";

export const runtime = "nodejs";

// Self-hosted serving: the kit's full system prompt (components, tools, rules,
// examples) is built here and sent as the system message. The model streams
// openui-lang back; the browser renders it with the same kit library.
export async function POST(request: Request) {
  const { kit: kitId, prompt } = (await request.json()) as { kit?: string; prompt?: string };
  const kit = getKit(kitId ?? "");
  if (!kit || !prompt?.trim()) {
    return Response.json({ error: "Send a kit id and a prompt." }, { status: 400 });
  }
  const llm = modelClient();
  if (!llm) {
    return Response.json(
      { error: "Set THESYS_API_KEY or OPENAI_API_KEY in .env.local, then restart." },
      { status: 503 },
    );
  }

  // Wait for the first chunk before answering, so a refusal from the model API
  // (a billing or rate limit, a bad key or model) comes back as a readable
  // error instead of a stream that breaks before any text arrives.
  let chunks: AsyncIterator<ChatCompletionChunk>;
  let first: IteratorResult<ChatCompletionChunk>;
  try {
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
    chunks = stream[Symbol.asyncIterator]();
    first = await chunks.next();
  } catch (error) {
    return upstreamError(error);
  }

  const encoder = new TextEncoder();
  const textOf = (chunk: ChatCompletionChunk) => chunk.choices[0]?.delta?.content ?? "";
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          if (!first.done) controller.enqueue(encoder.encode(textOf(first.value)));
          for (let next = await chunks.next(); !next.done; next = await chunks.next()) {
            const text = textOf(next.value);
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

/** The model API's refusal as a JSON error the Generate view can show. */
function upstreamError(error: unknown) {
  const status = (error as { status?: number }).status;
  const message = error instanceof Error ? error.message : String(error);
  return Response.json(
    {
      error: `The model API refused the request: ${message}${
        status ? "" : " (if this keeps happening, check the key's billing and rate limits)"
      }`,
    },
    { status: status && status >= 400 && status < 600 ? status : 502 },
  );
}
