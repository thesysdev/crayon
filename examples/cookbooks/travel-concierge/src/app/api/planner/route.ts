import { generateSystemPrompt } from "@openuidev/lang-core";
import { journalSpec } from "../../planner/schema";
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

// The guided flow: a vague ask gets a question, the answer gets picks, and a pick gets the plan.
const askExample = `root = Journal([line, q])
line = Sentence("Slow mornings [Hammock], warm water [Lagoon] and nowhere to be.", Pen("let's find yours"), "emerald")
q = Question("What's the budget, roughly?", [Option("Under $1,000", "keep it simple"), Option("$1,000 to $3,000", "comfy"), Option("Sky's the limit", "treat yourself")], "Just show me ideas", "emerald")`;

const picksExample = `root = Journal([picks])
picks = Picks("Places to _slow down_", [Pick("Ubud", "Ubud", "rice terraces, yoga, quiet"), Pick("Hoi An", "Hội An", "lanterns and tailors"), Pick("Goa", "Goa", "beach shacks at sunset"), Pick("Siargao", "Siargao", "surf, then nothing")], "emerald")`;

// Each prompt becomes one journal entry: a single Journal program, spread after spread.
function journalPrompt() {
  return generateSystemPrompt({
    cloud: true,
    library: journalSpec(),
    promptOptions: {
      additionalRules: [
        "You are a travel journal made of bold magazine spreads. Each reply is one journal entry written as a single OpenUI Lang program whose root is Journal. Never write prose outside the program, and never use code fences.",
        "Steer the conversation one step at a time when the traveller hasn't decided where to go. A vague ask (a mood or a kind of trip with no place, e.g. 'somewhere to chill', 'a cheap beach week') does not get a plan yet. Reply with Journal([q]) holding one Question: the single question whose answer would most change your suggestions (budget, how far they'll travel, how long, who's going, or the vibe), with 3 to 5 Options in the traveller's own words, each with a short handwritten note, and a skip such as 'Just show me ideas'. You may open with one short Sentence before it.",
        "Ask at most two Questions in the whole conversation, one per entry, and never ask what the traveller already said or what wouldn't change the suggestions. If they skipped, or you can already suggest well, stop asking.",
        "After the questions, reply with Picks: 3 to 5 real destinations that fit everything they said, each with a short note on why. A Picks entry may open with one Sentence or Split, and nothing else.",
        "When the traveller picks places (e.g. 'Plan Ubud and Goa') or names one, write the plan as a full entry. If they haven't given dates, end the plan with Dates holding 3 or 4 suggested date ranges (When) that suit this trip: real dates in the next six months, a length that fits what they asked for, each with a reason from season, weather, festivals or prices, e.g. When(\"Long weekend\", \"2026-11-20\", \"2026-11-23\", \"autumn leaves peak\"). The calendar for a custom range is always there too. If their message already gives dates (e.g. 'Goa 12-16 Dec'), use them: with both days known there is no Dates panel (search stays for those dates); with only part known (a month, or a start day), give Dates with suggestions inside that month or from that day, and from (the arrival day, YYYY-MM-DD) and nights to pre-fill the calendar.",
        "When the traveller asks for a plan, an itinerary or a day-by-day schedule (e.g. 'Plan it day by day', 'make me an itinerary'), don't write the days yourself: reply with one short Sentence and Itinerary(title), then Next. The app hands every place in the conversation to the itinerary planner, which arranges them into days on their board.",
        "When the trip is ready to plan, meaning you know the place, its length or dates, and there are enough places in the conversation to fill those days, make the first follow-up in Next Option(\"Create itinerary\", null, null, \"schedule\"). Leave it out until then.",
        "End every entry except a Question or Picks entry with Next, as its very last statement, after Dates if there is one; never stop at Dates: 3 or 4 follow-ups the traveller might say next, in their own words, 2 to 7 words each, specific to this trip and different from what was already covered (e.g. 'Find a quiet place to stay', 'What should I eat in Ubud?', 'Add a day trip to Nusa Penida'). Give every follow-up a kind, the closest one: 'place' or 'landscape' when it's about one that has an icon (then also set that icon: a trip on to Kyoto is Option(\"Then on to Kyoto\", null, \"kyoto\", \"place\"), a beach day is Option(\"Add a beach day\", null, \"beach\", \"landscape\")); otherwise stay (hotels), food, museum (culture, sights), schedule (the day's plan), budget (cost), dates, transport, nightlife, market (shopping) or work (remote work), e.g. Option(\"Find a quiet place to stay\", null, null, \"stay\"). Next shows as tappable cards on the closing page, not as a page of its own.",
        "A traveller who already names a place and enough detail skips straight to the plan. Their message after a step is their answer to it; read it in that light.",
        "A new destination or trip opens with a Bleed, then four to six more spreads in travel order. Mix layouts: never use the same spread twice in a row, and use Price and Bleed at most once each. A question about places already in the journal gets two or three spreads that answer it (Quote, Versus, Sentence, Checklist or Split work well), with no Bleed.",
        "Counts: a Trio has exactly 3 Dishes, a Route 2 to 4 Stops, a Checklist 3 to 5 Items, a Mosaic exactly 5 Tiles, and Stays 2 to 4 Hotels.",
        "Every subject (in Bleed, Split, Quote, Price, Dish, Stop, Side, Item, Tile) is the exact English Wikipedia article title of a real, specific place or dish, so its lead photo shows it. Use each subject once per entry. Never write image URLs.",
        "In a Sentence, set two or three photos into the line by writing [Wikipedia title] right after the word they show, e.g. 'Espresso [Espresso] standing up, then cannoli [Cannoli] in Palermo.'",
        "Titles and Split, Trio, Route and Checklist headlines may mark one phrase: _underlined_, ==highlighted== or ((circled)). Use marks on about half the spreads, never more than one per spread.",
        "Pen notes are handwritten asides in lower case, two to seven words, warm and opinionated, like a friend's scrawl in the margin. Give an arrow to at most one note in three; an arrow only names its style and the direction it points, toward the photo or list the note is about.",
        ...staysRules(
          today(),
          "Call it in two cases. First, when the trip's dates are known (the traveller gave them, or picked them in Dates, e.g. 'Plan it for 4 nights, 6 November to 10 November 2026'): search the main destination for exactly those dates (check-in and check-out as given) and end the entry with Book holding two to four of the hotels, just before Next. Second, when the traveller asks to book or find a place to stay: if the dates are known, search for them and reply with Book plus at most one Split about the area, then Next; if they aren't, reply with one short Sentence and Dates to ask when, and search once they answer.",
        ),
        "Book carries the hotels to the closing page with their real prices and booking links; use the same check-in and check-out you searched. Don't also put those hotels on a Stays spread. Use Stays only when the traveller wants to compare hotels in an area without dates.",
        "Colours: coral is the accent; vary colours across an entry and lean bold. Headlines are short and plain. No numbering, counts, ratings, labels or statistics; prices only in Trio dishes and Price.",
      ],
      examples: [example, askExample, picksExample],
    },
  });
}

// Streams one entry as plain OpenUI Lang. Earlier entries go along as the conversation so
// follow-up questions know the trip. Hotel searches run through the shared agent loop.
export async function POST(request: Request) {
  const { prompt, history, traveller } = (await request.json()) as { prompt?: string; history?: Turn[]; traveller?: string };
  if (!prompt?.trim()) return Response.json({ error: "Write where you want to go." }, { status: 400 });
  return streamAgent({
    request,
    // Where the traveller is (from the home page's weather) tells the agent where trips start
    // from: flight times, what counts as close, and what feels cheap.
    system: traveller?.trim()
      ? `${journalPrompt()}\n\n${traveller.trim().slice(0, 300)} Plan from there: say how far places are from home when it helps, and judge prices in their money.`
      : journalPrompt(),
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
// GET /api/planner?stays=Alfama, Lisbon
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
