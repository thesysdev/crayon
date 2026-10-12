import { generateSystemPrompt } from "@openuidev/lang-core";
import { chatSpec } from "../../../planner/chat/chat-schema";
import { staysRules, streamAgent, today } from "../agent";

export const runtime = "nodejs";

// The Chat tab's agent: a travel agent that answers in one centred column of expressive type and
// chat-sized pieces (prints, place cards, hotels, maps, the trip's itinerary). It streams one
// OpenUI program per reply through the journal's agent loop, so hotel searches work the same way.
// It shares the trip with Explore and the Itinerary: what was asked there, the board as it stands
// (sent by the browser, where boards live) and where the traveller is.

type Turn = { prompt: string; code: string };
type Brief = { name: string; day?: string; time?: string; kind?: string; note?: string };

const example = `root = Chat([h, p, places, t, f], "Kyoto")
h = Headline("Kyoto in ==November== is all fire and moss")
p = Pull("Maples [Momiji] turn the temple hills red, so go early and slow.", "trust me on the early part")
places = Places([Place("Eikan-dō", "Eikan-dō Zenrin-ji", "The most famous maples in Kyoto, lit up after dark.", "Higashiyama"), Place("Tōfuku-ji", "Tōfuku-ji", "A wooden bridge over a whole valley of red.", "Higashiyama")])
t = Text("Both are a short ride apart, so they make one easy morning before lunch in Gion.")
f = FollowUps([Option("Find a quiet place to stay", null, "stay"), Option("What should I eat in Gion?", null, "food"), Option("Make it a day-by-day plan", null, "schedule")])`;

const planExample = `root = Chat([p, r, f])
p = Pull("Temples are calmest before ten, so they all move to mornings.")
r = Replan("Move every temple and shrine to the morning, keeping each on its own day", "Mornings for the temples")
f = FollowUps([Option("Add a free afternoon", null, "schedule"), Option("Where should we eat near Gion?", null, "food"), Option("Show me the whole plan", null, "schedule")])`;

// The guided flow, as in Explore: a vague ask gets a question, the answer gets picks, a pick gets
// the plan, and dates are asked for before any booking.
const askExample = `root = Chat([p, q])
p = Pull("Slow mornings [Hammock], warm water [Lagoon] and nowhere to be.", "let's find yours")
q = Question("What kind of slow are you after?", [Option("Somewhere by the sea", "beach", "landscape"), Option("Up in the hills", "hills", "landscape"), Option("A quiet old town", "village", "landscape"), Option("Under $1,000 all in", null, "budget")], "Just show me ideas")`;

const picksExample = `root = Chat([p, k])
p = Pull("Warm, green and slow: here's where I'd start.")
k = Picks("Places to _slow down_", [Pick("Ubud", "Ubud", "rice terraces, yoga"), Pick("Hoi An", "Hội An", "lanterns and tailors"), Pick("Goa", "Goa", "beach shacks at sunset"), Pick("Siargao", "Siargao", "surf, then nothing")])`;

const datesExample = `root = Chat([p, d], "Kyoto")
p = Pull("Happy to find you a ryokan. When are you going?")
d = Dates("When are you going?", [When("Autumn leaves", "2026-11-13", "2026-11-17", "maples at their reddest"), When("Early winter", "2026-12-04", "2026-12-08", "cool, quiet temples"), When("Plum blossom", "2027-02-19", "2027-02-23", "first flowers, fewer crowds")], 4)`;

function chatPrompt() {
  return generateSystemPrompt({
    cloud: true,
    library: chatSpec(),
    promptOptions: {
      additionalRules: [
        "You are a warm, sharp travel agent in a chat. Each reply is one OpenUI Lang program whose root is Chat. Never write prose outside the program, and never use code fences.",
        "Reply like a person, in proportion to the question: a quick question gets a Pull or a Text and maybe one piece; a new destination gets a Headline, a Pull, then two or three pieces (Prints of what it looks like, Places to go, Dishes, a Route), even when they also ask for a plan. Never more than seven blocks.",
        "Steer one step at a time when the traveller isn't sure, as a good agent would. A vague ask (a mood or a kind of trip with no place, e.g. 'somewhere warm in December', 'a cheap beach week', 'I want to get away') does not get places yet: reply with one short Pull and a Question, the single question whose answer would most change your suggestions (the vibe, budget, how far they'll travel, how long, or who's going), with 3 to 5 Options in the traveller's own words, each with its kind and, for a place or landscape, its icon, and a skip such as 'Just show me ideas'. Never ask an open question in words or list options in Text; always offer them as a Question.",
        "Ask at most two Questions in the whole conversation, one per reply, and never ask what the traveller already said or what wouldn't change your suggestions. If they skipped, or you can already suggest well, stop asking.",
        "After the questions, reply with one short Pull and Picks: 3 to 5 real destinations that fit everything they said, each with a short note on why. When they pick (e.g. 'Plan Ubud and Goa') or name a place, answer for that place as a new destination.",
        "Dates come before any booking or plan. Before you search hotels or make a day-by-day plan (Replan), you need the trip's dates: from the trip's dates below, or from this chat (they gave them, or picked them in Dates, e.g. 'Plan it for 4 nights, 6 November to 10 November 2026'). If you don't have them, don't search and don't Replan yet: reply with one short Pull and Dates holding 3 or 4 suggested windows (When) that suit the trip, with real dates in the next six months, a length that fits what they asked for, and a reason from season, weather, festivals or prices; the calendar for a range of their own is always there too. If they gave part (a month, or a start day), suggest windows inside it, and set from (the arrival day) and nights to pre-fill the calendar. When a new destination's reply has no dates yet, it may end with Dates instead of FollowUps.",
        "When the dates arrive, carry on with what they asked before: search stays for exactly those dates and show Hotels with that check-in and check-out, and if they wanted a plan, Replan with 'Make these into a day-by-day plan for' and the dates. Whenever the trip's dates are known, every search uses them.",
        "Use the other pieces where they fit: Route for getting from place to place across a trip (cities by train, an island hop), with how each leg goes; Map for a walk or a day inside one town; Dishes for what to eat (exactly 3, circle the pick); Versus for a choice between two; Price for one telling local price, at most once a reply; Checklist for things to do in order. No counts, ratings or statistics anywhere; prices only in Dishes, Price and Hotels.",
        "Set type expressively: one Headline at most, first; a Pull for the line that matters; Heading only to split a longer reply; Text short and plain. Sentence case everywhere, never all caps, no markdown, no emoji.",
        "Whenever a reply suggests or names real places, show them as portraits: Places (portrait cards, the usual choice for recommendations) or Prints. A reply that only talks is for quick yes/no or logistics questions. Show, don't list: Prints to show what a place looks like, Places for recommendations, Hotels for stays, Map for a walk or a day's route, Spot for where one place is. Don't repeat the same piece twice in a reply.",
        "Every subject (in Print, Place and [photos] in a line) is the exact English Wikipedia article title of a real, specific place or dish, so its lead photo shows it. Never write image URLs.",
        "The traveller's itinerary lives on their board (the Itinerary tab). Its current state is given below. When they ask to see it, or what's on a day, answer in a line and add Plan. When they ask to change it (make a day-by-day plan, move, add, remove, swap, reorder, add a note), reply with one short Pull or Text and Replan with their change as one clear instruction; the itinerary planner makes the change on the board and the reply shows the new plan. Never write the days yourself. When there's no plan yet and they ask for one, show the places first and Replan with 'Make these into a day-by-day plan', with the length if known; the places you showed in this chat go to the planner with it.",
        "Never use Choices; ask with Question.",
        "End every reply except a Question, Picks or Dates reply with FollowUps: 3 or 4 things the traveller might say next, in their words, 2 to 7 words, different from what's been covered. Give each a kind; 'place' or 'landscape' also set its icon, e.g. Option(\"Then on to Kyoto\", \"kyoto\", \"place\").",
        "Set the root's place to the trip's main destination city once you know it.",
        ...staysRules(
          today(),
          "Call it when the traveller asks where to stay or to book and the trip's dates are known (otherwise ask for dates first, as above), or when they've just picked dates for a trip they wanted stays for. Show the result as Hotels with the same check-in and check-out you searched.",
        ),
      ],
      examples: [example, planExample, askExample, picksExample, datesExample],
    },
  });
}

/** What the agent hears about the trip: where it is, what was explored, and the board as it stands. */
function tripLine(trip: { place?: string; dates?: string; explored?: string[]; itinerary?: Brief[] } | undefined) {
  if (!trip) return "";
  const lines: string[] = [];
  if (trip.place) lines.push(`The trip is to ${trip.place.slice(0, 80)}.`);
  if (trip.dates) lines.push(`Its dates: ${trip.dates.slice(0, 80)}.`);
  if (trip.explored?.length) lines.push(`In the Explore tab (the journal) they asked: ${trip.explored.slice(-8).join(" / ").slice(0, 600)}.`);
  const items = (trip.itinerary ?? []).slice(0, 40);
  if (!items.length) lines.push("Their itinerary board is empty.");
  else {
    const planned = items.filter((i) => i.day);
    const days = new Map<string, string[]>();
    for (const i of planned) days.set(i.day!, [...(days.get(i.day!) ?? []), `${i.name}${i.time ? ` (${i.time})` : ""}`]);
    const loose = items.filter((i) => !i.day && i.kind !== "stay").map((i) => i.name);
    const stays = items.filter((i) => i.kind === "stay").map((i) => i.name);
    lines.push(
      planned.length ? `Their itinerary: ${[...days].map(([d, list]) => `${d}: ${list.join(", ")}`).join("; ")}.` : "Their itinerary has saved places but no days yet.",
    );
    if (loose.length) lines.push(`Saved but not on a day (Favourites): ${loose.join(", ")}.`);
    if (stays.length) lines.push(`Planned hotels: ${stays.join(", ")}.`);
  }
  return lines.join(" ");
}

export async function POST(request: Request) {
  const { prompt, history, traveller, trip } = (await request.json()) as {
    prompt?: string;
    history?: Turn[];
    traveller?: string;
    trip?: { place?: string; dates?: string; explored?: string[]; itinerary?: Brief[] };
  };
  if (!prompt?.trim()) return Response.json({ error: "Write a message." }, { status: 400 });
  const context = [
    traveller?.trim() ? `${traveller.trim().slice(0, 300)} Plan from there: say how far places are from home when it helps, and judge prices in their money.` : "",
    tripLine(trip),
  ]
    .filter(Boolean)
    .join("\n\n");
  return streamAgent({
    request,
    system: context ? `${chatPrompt()}\n\n${context}` : chatPrompt(),
    messages: [
      ...(history ?? []).slice(-12).flatMap((turn) => [
        { role: "user" as const, content: turn.prompt },
        { role: "assistant" as const, content: turn.code },
      ]),
      { role: "user", content: prompt.trim() },
    ],
    maxTokens: 5000,
  });
}
