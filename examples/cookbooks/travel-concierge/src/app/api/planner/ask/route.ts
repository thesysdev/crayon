import OpenAI from "openai";

// The Explore agent, asked from the Itinerary board: a short answer plus the places it suggests,
// as JSON, so the board can show them as cards to drag onto a day. Requests that reshape the plan
// go to the itinerary agent instead; the board routes by intent.

export const runtime = "nodejs";

type Answer = { answer: string; places: { name: string; subject: string; note?: string; kind?: "place" | "food" | "stay" }[] };

const system = `You are a warm, well-travelled friend helping someone plan a trip. They are looking at their itinerary board and ask a question.
Reply with JSON only, no prose around it and no code fences:
{"answer":"…","places":[{"name":"…","subject":"…","note":"…","kind":"place"}]}
Rules:
- "answer" is two or three short sentences that answer the question directly, specific to this trip.
- "places" are the 2 to 6 real places, dishes or stays your answer suggests, best first, so they can drag them onto a day. Leave it empty when the question isn't about places.
- "name" is short (1 to 4 words); "subject" is the exact English Wikipedia article title, so its photo can be found; "note" is why, 2 to 6 words, lower case; "kind" is "place", "food" (a dish or a food market) or "stay".
- Don't suggest what's already on the board.`;

export async function POST(request: Request) {
  const { prompt, place, dates, saved, context, traveller } = (await request.json()) as {
    prompt?: string;
    place?: string;
    dates?: string;
    saved?: string[];
    context?: string;
    traveller?: string;
  };
  if (!prompt?.trim()) return Response.json({ error: "Ask something." }, { status: 400 });
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) return Response.json({ error: "Set THESYS_API_KEY in .env.local." }, { status: 500 });
  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const brief = [
    traveller?.slice(0, 300),
    place ? `The trip: ${place}${dates ? `, ${dates}` : ""}.` : "",
    context ? `What they asked so far: ${context.slice(0, 600)}` : "",
    saved?.length ? `Already on the board: ${saved.slice(0, 40).join(", ")}.` : "",
    `Question: ${prompt.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
  // The model reasons before it answers, and a tight token cap can leave the answer empty (that
  // was the "Unexpected end of JSON input"), so give it room and try once more if it comes back
  // empty or cut short.
  const once = async () => {
    const completion = await gateway.chat.completions.create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        messages: [
          { role: "system", content: system },
          { role: "user", content: brief },
        ],
        max_completion_tokens: 8000,
      },
      { signal: request.signal },
    );
    const text = completion.choices[0]?.message?.content ?? "";
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Answer;
  };
  try {
    const reply = await once().catch(() => once());
    const places = (Array.isArray(reply.places) ? reply.places : []).filter((p) => p?.name && p.subject).slice(0, 6);
    return Response.json({ answer: String(reply.answer ?? ""), places });
  } catch {
    return Response.json({ error: "The answer didn't come back. Ask again?" }, { status: 502 });
  }
}
