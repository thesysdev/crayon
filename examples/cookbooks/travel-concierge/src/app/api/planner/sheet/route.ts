import { generateSystemPrompt } from "@openuidev/lang-core";
import { sheetSpec } from "../../../planner/sheet-schema";
import { staysRules, streamAgent, today } from "../agent";

export const runtime = "nodejs";

const example = `root = Sheet("Alfama", "Lisbon's oldest quarter, Portugal", ["Alfama", "Lisbon Cathedral", "Castle of São Jorge", "Fado", "Pastel de nata"], [h1, h2, h3], "A tangle of lanes that survived the 1755 earthquake, stacked up the hill below the castle. Come early, when the laundry is still going up and the trams are half empty. Spend the afternoon climbing between viewpoints and stay for fado after dark.", [see], ["Wear shoes with grip: the cobbles are polished smooth", "Tram 28 is fastest before 9am", "Most fado houses take bookings for dinner"], [Hotel("hotel1"), Hotel("hotel2"), Hotel("hotel3")], "get lost on purpose")
h1 = Highlight("Best at first light", "The lanes are empty and the river glows before nine.")
h2 = Highlight("Fado after dark", "Small houses sing from dinner until late.")
h3 = Highlight("Views at every turn", "Two miradouros look straight over the rooftops to the Tagus.")
see = Section("Nearby", [Thing("The castle", "Castle of São Jorge", "Walls and peacocks over the whole city"), Thing("The cathedral", "Lisbon Cathedral", "Romanesque and fortress-thick"), Thing("Feira da Ladra", "Feira da Ladra", "The flea market, Tuesdays and Saturdays")])`;

// The detail sheet for one photo: a listing-style page about that place, written as one Sheet
// program. When the place is somewhere people stay, the agent searches trivago first.
function sheetPrompt() {
  return generateSystemPrompt({
    cloud: true,
    library: sheetSpec(),
    promptOptions: {
      additionalRules: [
        "You write the detail sheet a traveller opens by clicking a photo in their travel journal. Each reply is one Sheet program. Never write prose outside the program, and never use code fences.",
        "A Sheet has exactly 5 photos, exactly 3 Highlights, one or two Sections of three to six Things each, and three to five tips.",
        "Every subject (photos and Things) is the exact English Wikipedia article title of a real, specific place, sight or dish, so its lead photo shows it. Use each once.",
        "Write like a well-travelled friend: concrete, warm, brief. No ratings, counts or statistics beyond what trivago returns.",
        "For a dish, the Sheet is about the dish: where it comes from, where to eat it, and its Sections are places to try it and dishes like it.",
        ...staysRules(
          today(),
          "Call it when the place is a city, town, island, region or neighbourhood where people stay, before writing the Sheet. Don't search for a dish or a single building.",
        ),
      ],
      examples: [example],
    },
  });
}

export async function POST(request: Request) {
  const { subject, name, context } = (await request.json()) as { subject?: string; name?: string; context?: string };
  if (!subject?.trim()) return Response.json({ error: "Pick a photo." }, { status: 400 });
  const label = name && name !== subject ? `"${name}" (Wikipedia: ${subject})` : `"${subject}"`;
  return streamAgent({
    request,
    system: sheetPrompt(),
    messages: [
      {
        role: "user",
        content: `Open the detail sheet for ${label}.${context ? ` The journal so far: ${context.slice(0, 600)}` : ""}`,
      },
    ],
  });
}
