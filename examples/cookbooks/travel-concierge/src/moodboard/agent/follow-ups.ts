import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Follow-up chips: after every agent turn, a few short next steps (or likely answers, when the
// planner just asked something), and on an empty trip, a few trips to start from. One small,
// forced tool call each, so the reply is plain JSON.

export const chipIcons = [
  "plane",
  "leaf",
  "heart",
  "mountain",
  "palm",
  "moon",
  "sun",
  "snow",
  "food",
  "bed",
  "calendar",
  "wallet",
  "users",
  "camera",
  "map",
  "sparkles",
] as const;

export type Chip = { label: string; prompt: string; icon: (typeof chipIcons)[number] };

const chipsTool = {
  type: "function" as const,
  function: {
    name: "chips",
    description: "Tappable suggestions shown above the traveller's prompt bar.",
    parameters: {
      type: "object",
      properties: {
        chips: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "2-4 words shown on the chip." },
              prompt: {
                type: "string",
                description: "What tapping it sends, in the traveller's voice, one sentence.",
              },
              icon: { type: "string", enum: chipIcons },
            },
            required: ["label", "prompt", "icon"],
            additionalProperties: false,
          },
        },
      },
      required: ["chips"],
      additionalProperties: false,
    },
    strict: true,
  },
};

async function ask(gateway: OpenAI, content: string, signal?: AbortSignal) {
  const completion = await gateway.chat.completions
    .create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        messages: [{ role: "user", content }],
        tools: [chipsTool],
        tool_choice: { type: "function", function: { name: "chips" } },
      },
      { signal },
    )
    .catch(() => null);
  const call = completion?.choices[0]?.message.tool_calls?.[0];
  try {
    if (call?.type !== "function") return [];
    const { chips } = JSON.parse(call.function.arguments) as { chips: Chip[] };
    return chips
      .filter((chip) => chip.label?.trim() && chip.prompt?.trim())
      .map((chip) => ({ ...chip, icon: chipIcons.includes(chip.icon) ? chip.icon : "sparkles" }))
      .slice(0, 5);
  } catch {
    return [];
  }
}

const text = (content: unknown) =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part) => (part as { text?: string }).text ?? "").join("")
      : "";

// The conversation, short: what the traveller asked and answered, the headings of the pieces
// the planner wrote, and the question it's waiting on, if any.
function transcript(messages: ChatCompletionMessageParam[]) {
  const lines: string[] = [];
  for (const message of messages) {
    const body = text(message.content);
    if (message.role === "user")
      lines.push(`Traveller: ${(/Request:\s*([^\n]+)/.exec(body)?.[1] ?? body).slice(0, 300)}`);
    else if (message.role === "tool" && !body.includes('"skipped"') && !body.includes("stays"))
      lines.push(`Traveller answered: ${body.slice(0, 200)}`);
    else if (message.role === "assistant") {
      const headings = body.match(/^===.*$/gm) ?? [];
      if (headings.length) lines.push(`Planner put on the board:\n${headings.join("\n")}`);
      for (const call of message.tool_calls ?? [])
        if (call.type === "function" && call.function.name.startsWith("ask_"))
          lines.push(`Planner asked (${call.function.name}): ${call.function.arguments.slice(0, 400)}`);
    }
  }
  return lines.slice(-14).join("\n");
}

// After a turn: likely answers if the planner is waiting on a question, else next steps.
export function suggestFollowUps(
  gateway: OpenAI,
  messages: ChatCompletionMessageParam[],
  { asking }: { asking: boolean },
  signal?: AbortSignal,
) {
  const goal = asking
    ? "The planner just asked the traveller a question. Suggest 3-4 likely answers the traveller could tap, specific to this trip (real dates, places, budgets), each a complete answer."
    : "Suggest 4 next steps the traveller might want for this trip board: change or add something specific (a day trip, food, stays, budget, pace, dates). Specific to this trip, never generic.";
  return ask(gateway, `${goal}\n\nConversation so far:\n${transcript(messages)}`, signal);
}

// On an empty trip: places to start from, avoiding trips the traveller already has.
export function suggestStarters(gateway: OpenAI, avoid: string[], signal?: AbortSignal) {
  return ask(
    gateway,
    `Suggest 5 varied trip ideas for a travel moodboard, each a different kind of trip (city, nature, beach, food, adventure) in a different part of the world. Label: the place and the mood, 2-3 words, like "Kyoto in autumn". Prompt: one vivid sentence describing the trip.${
      avoid.length ? ` The traveller already has trips to ${avoid.join(", ")}; suggest other places.` : ""
    } Month now: ${new Date().toLocaleString("en", { month: "long" })}.`,
    signal,
  );
}
