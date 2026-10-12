import OpenAI from "openai";

export const runtime = "nodejs";

// POST /api/planner/weather-line { temp, conditions, city, country, isDay? }
// One short line about today's weather, in the concierge's voice, for the planner home. The model
// writes it with three slots the page fills in: {temp} (the temperature), {sky} (the 3D weather
// icon) and {place} (the flag and the city), so the icons stay inline in the sentence. A reply
// without all three slots, or too long for one line, comes back as { line: null } and the page
// keeps its plain line.

const MAX_CHARS = 76;

const SYSTEM = [
  "You are a travel concierge: warm, witty and well travelled, the friend who always knows somewhere better. You write the one line that greets a traveller on the trip planner's home page, about the weather where they are right now, and you tempt them toward a trip.",
  "Write one line of one or two short sentences, at most 64 characters once the slots are filled in. The first notices the weather with some wit. The second is the nudge, with a concrete image or kind of place (a terrace, a hammock, a fjord, a ski chalet), never a generic word like getaway, escape, trip or adventure. Don't start the nudge with Plan or Plot.",
  "No emoji, hashtags, semicolons or dashes, and no quotation marks around it. Vary how it opens; don't always lead with {temp}.",
  "Use each of these slots exactly once, written literally with their braces: {temp} for the temperature (it reads like '28°'), {sky} for a small weather icon that sits in the sentence like a word, {place} for the city with its flag (it reads like 'Bengaluru'). Put {sky} right after {temp} or right after a weather word.",
  "Do not repeat the country. Do not invent facts about the place.",
  "Examples of the voice (don't reuse them):",
  "{temp} {sky} in {place}. Somewhere, a hammock has your name on it.",
  "{place} is doing its moody {temp} {sky}. Lisbon's terraces aren't.",
  "A toasty {temp} {sky} in {place}. The fjords are pleasantly chilly.",
].join("\n");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    temp?: number;
    conditions?: string;
    city?: string;
    country?: string;
    isDay?: boolean;
  };
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) return Response.json({ error: "Set THESYS_API_KEY in .env.local." }, { status: 500 });
  const city = String(body.city ?? "").slice(0, 60);
  const conditions = String(body.conditions ?? "").slice(0, 40);
  if (!city || !conditions || !Number.isFinite(body.temp)) return Response.json({ line: null });

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const completion = await gateway.chat.completions
    .create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `It's ${body.temp}°C and ${conditions} in ${city}${body.country ? `, ${body.country}` : ""}, ${body.isDay === false ? "at night" : "during the day"}.`,
          },
        ],
        reasoning_effort: "low",
      },
      { signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]) },
    )
    .catch(() => null);
  return Response.json({ line: check(completion?.choices[0]?.message.content, city) });
}

/** The line as the model wrote it, or null unless it has each slot once and fits on one line. */
function check(text: string | null | undefined, city: string) {
  const line = text?.trim().replace(/^["“]|["”]$/g, "").split("\n")[0].trim();
  if (!line) return null;
  for (const slot of ["{temp}", "{sky}", "{place}"]) if (line.split(slot).length !== 2) return null;
  const filled = line.replace("{temp}", "28°").replace("{sky}", "").replace("{place}", `xx ${city}`);
  return filled.length <= MAX_CHARS ? line : null;
}
