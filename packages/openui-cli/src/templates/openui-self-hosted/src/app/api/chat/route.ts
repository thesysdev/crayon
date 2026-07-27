import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    return await client.chat.completions
      .create(
        {
          model: "gpt-5.2",
          messages: [
            {
              role: "system",
              content: generateSystemPrompt({
                library: librarySpec,
                promptOptions,
              }),
            },
            ...messages,
          ],
          stream: true,
        },
        {
          signal: req.signal,
        },
      )
      .asResponse();
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
