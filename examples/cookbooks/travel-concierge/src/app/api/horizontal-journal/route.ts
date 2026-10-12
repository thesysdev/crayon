import { generateSystemPrompt } from "@openuidev/lang-core";
import { journalSpec } from "../../horizontal-journal/schema";
import { sampleStays, staysRules, streamAgent, today } from "./agent";

export const runtime = "nodejs";

type Turn = { prompt: string; code: string };

const example = `root = Journal([open, eat, line, train, pick, rules])
open = Bleed("Kyoto", "Fushimi Inari-taisha", Pen("go before seven", "swoop", "down-left"), "coral")
eat = Trio("What to eat in _Kyoto_", [Dish("Yudofu", "Yudofu", "¥1,500"), Dish("Mochi", "Mochi", "¥300", true), Dish("Matcha", "Matcha", "¥650")], Pen("the mochi stall by the shrine gate", "hook", "down-left"), "emerald")
line = Sentence("Matcha [Matcha] in the morning, then the _bamboo grove_ [Arashiyama] before the crowds.", Pen("this is the rule"), "coral")
train = Route("Kyoto to Nara", [Stop("Kyoto", "Kyoto Station", "45 min, Kintetsu line"), Stop("Nara", "Tōdai-ji")], "dash", "cobalt")
pick = Versus("or", Side("the shrine", "Kiyomizu-dera"), Side("the garden", "Kinkaku-ji"), Pen("both. obviously.", "squiggle", "up"), "magenta")
rules = Checklist("Kyoto, in ==order==", [Item("Fushimi Inari at dawn", "Fushimi Inari-taisha", true), Item("Nishiki Market lunch", "Nishiki Market", false, "go hungry"), Item("Gion after dark", "Gion")], "coral")`;

// Each prompt becomes one journal entry: a single Journal program, spread after spread.
function journalPrompt() {
  return generateSystemPrompt({
    cloud: true,
    library: journalSpec(),
    promptOptions: {
      additionalRules: [
        "You are a travel journal made of bold magazine spreads. Each reply is one journal entry written as a single OpenUI Lang program whose root is Journal. Never write prose outside the program, and never use code fences.",
        "A new destination or trip opens with a Bleed, then four to six more spreads in travel order. Mix layouts: never use the same spread twice in a row, and use Price and Bleed at most once each. A question about places already in the journal gets two or three spreads that answer it (Quote, Versus, Sentence, Checklist or Split work well), with no Bleed.",
        "Counts: a Trio has exactly 3 Dishes, a Route 2 to 4 Stops, a Checklist 3 to 5 Items, a Mosaic exactly 5 Tiles, and Stays 2 to 4 Hotels.",
        "Every subject (in Bleed, Split, Quote, Price, Dish, Stop, Side, Item, Tile) is the exact English Wikipedia article title of a real, specific place or dish, so its lead photo shows it. Use each subject once per entry. Never write image URLs.",
        "In a Sentence, set two or three photos into the line by writing [Wikipedia title] right after the word they show, e.g. 'Espresso [Espresso] standing up, then cannoli [Cannoli] in Palermo.'",
        "Titles and Split, Trio, Route and Checklist headlines may mark one phrase: _underlined_, ==highlighted== or ((circled)). Use marks on about half the spreads, never more than one per spread.",
        "Pen notes are handwritten asides in lower case, two to seven words, warm and opinionated, like a friend's scrawl in the margin. Give an arrow to at most one note in three; an arrow only names its style and the direction it points, toward the photo or list the note is about.",
        ...staysRules(
          today(),
          "Call it only when the traveller asks where to stay, about hotels or about prices. Then give the hotels a Stays spread (two to four hotels), alongside one or two other spreads about the area.",
        ),
        "Colours: coral is the accent; vary colours across an entry and lean bold. Headlines are short and plain. No numbering, counts, ratings, labels or statistics; prices only in Trio dishes and Price.",
      ],
      examples: [example],
    },
  });
}

// Streams one entry as plain OpenUI Lang. Earlier entries go along as the conversation so
// follow-up questions know the trip. Hotel searches run through the shared agent loop.
export async function POST(request: Request) {
  const { prompt, history } = (await request.json()) as { prompt?: string; history?: Turn[] };
  if (!prompt?.trim()) return Response.json({ error: "Write where you want to go." }, { status: 400 });
  return streamAgent({
    request,
    system: journalPrompt(),
    messages: [
      ...(history ?? []).flatMap((turn) => [
        { role: "user" as const, content: turn.prompt },
        { role: "assistant" as const, content: turn.code },
      ]),
      { role: "user", content: prompt.trim() },
    ],
  });
}

// Live trivago hotels as OpenUI statements (hotel1…hotel4), for the Stays samples in /components:
// GET /api/horizontal-journal?stays=Alfama, Lisbon
export async function GET(request: Request) {
  const destination = new URL(request.url).searchParams.get("stays")?.trim();
  if (!destination) return new Response("", { status: 400 });
  try {
    return new Response(await sampleStays(destination.slice(0, 80), "EUR", request.signal), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response("", { status: 502 });
  }
}
