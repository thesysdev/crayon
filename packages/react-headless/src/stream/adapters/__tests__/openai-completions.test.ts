import { describe, expect, it } from "vitest";
import { EventType } from "../../../types";
import { openAIAdapter } from "../openai-completions";

function makeSSEResponse(events: unknown[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream);
}

async function collect(response: Response) {
  const events = [];
  for await (const event of openAIAdapter().parse(response)) events.push(event);
  return events;
}

describe("openAIAdapter", () => {
  it("emits RUN_ERROR for an application error SSE payload", async () => {
    const events = await collect(makeSSEResponse([{ error: "Provider is at capacity" }]));

    expect(events).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: "Provider is at capacity",
      },
    ]);
  });

  it("extracts a nested OpenAI error message", async () => {
    const events = await collect(
      makeSSEResponse([{ type: "error", error: { message: "Request failed" } }]),
    );

    expect(events).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: "Request failed",
      },
    ]);
  });
});
