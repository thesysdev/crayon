import OpenAI from "openai";

export const runtime = "nodejs";

// Names a trip for the Trips panel: the place it's about ("Bengaluru"), where that is
// ("Karnataka, India"), and the place's own photo from its Wikipedia article. The model reads
// what the traveller said and what's on the board, and answers through a forced tool call so
// the reply is plain JSON.

const USER_AGENT =
  "openui-booking-assistant-moodboard/0.1 (local dev; https://github.com/thesysdev/openui)";

const destinationTool = {
  type: "function" as const,
  function: {
    name: "destination",
    description: "The trip's main destination.",
    parameters: {
      type: "object",
      properties: {
        place: {
          type: "string",
          description:
            "The city, island, or region the trip is about, as its English Wikipedia article title, e.g. 'Kyoto', 'Amalfi Coast', 'Patagonia'. Empty if no place is known yet.",
        },
        location: {
          type: "string",
          description:
            "Where that is, region then country, e.g. 'Karnataka, India'. Empty if unknown.",
        },
      },
      required: ["place", "location"],
      additionalProperties: false,
    },
    strict: true,
  },
};

type Summary = { title?: string; type?: string; thumbnail?: { source: string } };

async function photoOf(place: string) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place.replace(/ /g, "_"))}`,
    { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(6_000) },
  ).catch(() => null);
  const page = response?.ok ? ((await response.json()) as Summary) : null;
  return page?.type === "standard" ? (page.thumbnail?.source ?? null) : null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { said?: string[]; pieces?: string[] };
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey)
    return Response.json({ error: "Set THESYS_API_KEY in .env.local." }, { status: 500 });
  const said = (body.said ?? []).map((line) => line.slice(0, 300)).slice(0, 8);
  const pieces = (body.pieces ?? []).map((line) => line.slice(0, 120)).slice(0, 30);
  if (!said.length && !pieces.length) return Response.json({ place: null });

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const completion = await gateway.chat.completions
    .create({
      model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
      messages: [
        {
          role: "user",
          content: `What place is this trip to?\n\nThe traveller said:\n${said.join("\n")}\n\nOn the board:\n${pieces.join("\n")}`,
        },
      ],
      tools: [destinationTool],
      tool_choice: { type: "function", function: { name: "destination" } },
    })
    .catch(() => null);
  const call = completion?.choices[0]?.message.tool_calls?.[0];
  let found: { place?: string; location?: string } = {};
  try {
    if (call?.type === "function") found = JSON.parse(call.function.arguments);
  } catch {}
  const place = found.place?.trim();
  if (!place) return Response.json({ place: null });
  return Response.json({
    place,
    location: found.location?.trim() || null,
    photo: await photoOf(place),
  });
}
