import { createLibrary, defineComponent } from "@openuidev/lang-core";
import type { ComponentRenderer } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { followUpKinds, icons } from "../schema";

// The Chat tab's vocabulary: chat-sized variants of the journal's pieces, set in one centred
// column. Type does most of the talking (a headline, a pull-quote sized line, plain headings and
// body), and the agent mixes in prints, place cards, hotels, a map, a mini map, the trip's
// itinerary and follow-up cards where they help. Like Explore, it can also steer: a Question with
// options to tap, Picks of places, and Dates, each tap sent as the traveller's next message. Schemas live apart from their views so the API
// route can build the prompt without importing React; chat-library.tsx supplies the views.

const subject = z
  .string()
  .describe("The exact English Wikipedia article title of a real place or dish, e.g. 'Fushimi Inari-taisha'");

const withPhotos = (what: string) =>
  z
    .string()
    .describe(
      `${what}. May set one or two small photos into the line by writing [Wikipedia title] right after the word they show, e.g. 'Matcha [Matcha] first, then the bamboo [Arashiyama] before nine.' May mark one phrase: _underline_, ==highlight== or ((circle))`,
    );

export const chatProps = {
  Print: z.object({
    subject,
    caption: z.string().optional().describe("A short caption, 1 to 4 words, e.g. the place's short name"),
    note: z.string().optional().describe("A handwritten aside, 2 to 6 words, lower case"),
  }),
  Place: z.object({
    name: z.string().describe("The place's short name, e.g. 'Nishiki Market'"),
    subject,
    about: z.string().describe("One warm line on why to go, 6 to 16 words"),
    area: z.string().optional().describe("The neighbourhood, e.g. 'Gion'"),
    kind: z.enum(["place", "food"]).optional().describe("food for a dish, café or restaurant"),
  }),
  Hotel: z.object({ id: z.string().describe("A hotel id from search_stays, e.g. 'hotel1'") }),
  Option: z.object({
    label: z.string().describe("What the traveller might say next, in their own words, 2 to 7 words. Tapping it sends exactly this"),
    icon: z.enum(icons).optional().describe("With kind 'place' or 'landscape': the 3D icon of that place or landscape"),
    kind: z.enum(followUpKinds).optional().describe("What it's about, the closest of the kinds; always set it"),
  }),
  When: z.object({
    label: z.string().describe("A short name for the window, 1 to 3 words, e.g. 'Long weekend' or 'Early December'"),
    from: z.string().describe("YYYY-MM-DD: the arrival day"),
    to: z.string().describe("YYYY-MM-DD: the departure day"),
    why: z.string().describe("Why then, 2 to 5 words, lower case, e.g. 'cool, dry days' or 'diwali lights'"),
  }),
  Pick: z.object({
    name: z.string().describe("The destination's short name, e.g. 'Ubud'"),
    subject,
    note: z.string().optional().describe("Why it fits, handwritten, 2 to 6 words, lower case"),
  }),
  Stop: z.object({
    name: z.string().describe("The stop's short name, e.g. 'Florence'"),
    subject,
    leg: z.string().optional().describe("How to get on to the next stop, 2 to 6 words, e.g. '1h 30 by fast train'"),
  }),
  Dish: z.object({
    name: z.string().describe("The dish's short name, 1 or 2 words"),
    subject,
    price: z.string().optional().describe("Its local price, e.g. '6 €' or '¥300'"),
    circled: z.boolean().optional().describe("Circle this one's price: the pick of the three"),
  }),
  Side: z.object({ label: z.string().describe("A short label, 1 to 3 words"), subject }),
  Item: z.object({
    text: z.string().describe("A thing to do, 2 to 6 words"),
    subject,
    done: z.boolean().optional().describe("Highlight it as a must"),
    aside: z.string().optional().describe("A handwritten aside, 1 to 4 words, lower case"),
  }),
};

export const chatBlocks = [
  "Headline",
  "Pull",
  "Heading",
  "Text",
  "Prints",
  "Places",
  "Hotels",
  "Map",
  "Spot",
  "Choices",
  "Plan",
  "Replan",
  "FollowUps",
  "Question",
  "Picks",
  "Dates",
  "Route",
  "Dishes",
  "Versus",
  "Price",
  "Checklist",
] as const;

type Views = {
  [K in keyof typeof chatProps]: ComponentRenderer<z.infer<(typeof chatProps)[K]>>;
} & Record<(typeof chatBlocks)[number] | "Chat", ComponentRenderer<never>>;

export function buildChatLibrary(views: Views) {
  const part = <K extends keyof typeof chatProps>(name: K, description: string) =>
    defineComponent({ name, props: chatProps[name], description, component: views[name] as ComponentRenderer<never> });
  const Print = part("Print", "One portrait photo print in Prints.");
  const Place = part("Place", "One place card in Places.");
  const Hotel = part("Hotel", "A real hotel from a trivago search, by its id. The app fills in the rest.");
  const Option = part("Option", "One follow-up card, or one answer to a Question.");
  const When = part("When", "One suggested date range in Dates.");
  const Pick = part("Pick", "One destination in Picks.");
  const Stop = part("Stop", "One stop on a Route.");
  const Dish = part("Dish", "One dish in Dishes.");
  const Side = part("Side", "One side of a Versus.");
  const Item = part("Item", "One row of a Checklist, with a small photo.");

  const block = (name: (typeof chatBlocks)[number], shape: z.ZodObject, description: string) =>
    defineComponent({ name, props: shape, description, component: views[name] });

  const Headline = block(
    "Headline",
    z.object({ text: withPhotos("The reply's big opening line, 3 to 10 words, sentence case, no full stop needed") }),
    "A huge line of type that opens a reply. At most one per reply, first.",
  );
  const Pull = block(
    "Pull",
    z.object({
      text: withPhotos("One vivid sentence, 8 to 24 words"),
      note: z.string().optional().describe("A handwritten aside in the margin, 2 to 7 words, lower case"),
    }),
    "A pull-quote sized sentence: the heart of the answer, set big.",
  );
  const Heading = block("Heading", z.object({ text: z.string().describe("A plain heading, 2 to 6 words, sentence case") }), "A plain section heading.");
  const Text = block(
    "Text",
    z.object({ text: z.string().describe("One short paragraph, 1 to 3 sentences, plain and warm. No markdown") }),
    "A paragraph of body text.",
  );
  const Prints = block(
    "Prints",
    z.object({ prints: z.array(Print.ref).describe("2 to 4 prints") }),
    "Portrait photo prints in a row, each with a caption. For showing what a place looks like.",
  );
  const Places = block(
    "Places",
    z.object({ places: z.array(Place.ref).describe("2 to 4 places, best first") }),
    "Place cards: a portrait photo beside the name, the area and a line on why. For recommendations.",
  );
  const isoDay = z.string().describe("YYYY-MM-DD, exactly as passed to search_stays");
  const Hotels = block(
    "Hotels",
    z.object({
      hotels: z.array(Hotel.ref).describe("2 to 4 Hotels from the search, best first"),
      checkIn: isoDay.optional(),
      checkOut: isoDay.optional(),
    }),
    "Real trivago hotel cards with the price in two currencies and a Book button.",
  );
  const MapBlock = block(
    "Map",
    z.object({
      title: z.string().describe("Where the walk goes, e.g. 'A slow morning in Gion'"),
      places: z.array(z.string()).describe("2 to 6 real named places in visiting order, each by its OpenStreetMap name or Wikipedia title"),
      near: z.string().describe("The city they're in, just its name, so only places there are found"),
    }),
    "A map of a walk or a day's stops in order, numbered, with the walk or ride between each. The app finds the coordinates; never give any.",
  );
  const Spot = block(
    "Spot",
    z.object({
      name: z.string().describe("One real place by its OpenStreetMap name or Wikipedia title"),
      near: z.string().describe("The city it's in"),
    }),
    "Where one place is: a small map with its pin, the neighbourhood and how far it is from the traveller's stay, and Open in Maps. For 'where is…' and 'how far…' questions.",
  );
  const Choices = block(
    "Choices",
    z.object({
      question: z.string().describe("One short question, 3 to 9 words"),
      options: z.array(Option.ref).describe("3 to 5 answers in the traveller's words"),
    }),
    "An older, plain form of Question, without icons. Use Question instead.",
  );
  const Plan = block(
    "Plan",
    z.object({ title: z.string().optional().describe("A short heading, e.g. 'Your Kyoto, day by day'") }),
    "The trip's itinerary as it stands on the traveller's board: each day with small prints, and a card that opens the Itinerary tab. For 'show me my plan' or after talking about it. Never write the days yourself.",
  );
  const Replan = block(
    "Replan",
    z.object({
      request: z
        .string()
        .describe("The change as one clear instruction for the itinerary planner, e.g. 'Move the temples to mornings' or 'Make these into a day-by-day plan for 4 days'"),
      title: z.string().optional().describe("A short heading for the updated plan"),
    }),
    "Changes the itinerary on the traveller's board (make a plan, move, add, remove, reorder, add notes), then shows the updated plan. The itinerary planner does the change; you only say what to do.",
  );
  const FollowUps = block(
    "FollowUps",
    z.object({ options: z.array(Option.ref).describe("3 or 4 things the traveller might say next, specific to this trip") }),
    "Follow-up cards with 3D icons. Always the last block of a reply.",
  );
  const Question = block(
    "Question",
    z.object({
      question: z.string().describe("One short question that narrows the search, 3 to 9 words, e.g. 'What kind of trip are you after?'"),
      options: z.array(Option.ref).describe("3 to 5 answers in the traveller's own words, each a different direction, each with its kind (and icon for a place or landscape)"),
      skip: z.string().optional().describe("A way to skip ahead, in the traveller's words, e.g. 'Just show me ideas'"),
    }),
    "Asks one question for a traveller who isn't sure yet; the answers are cards with 3D icons, and a tap sends the answer as their next message.",
  );
  const Picks = block(
    "Picks",
    z.object({
      title: z.string().describe("A headline, e.g. 'Places to _slow down_'. May mark one phrase: _underline_, ==highlight== or ((circle))"),
      picks: z.array(Pick.ref).describe("3 to 5 real destinations"),
    }),
    "Destinations as photo prints the traveller taps to pick, one or a few, then asks for the plan.",
  );
  const Dates = block(
    "Dates",
    z.object({
      title: z.string().describe("A short question, e.g. 'When are you going?'"),
      suggestions: z
        .array(When.ref)
        .describe("3 or 4 date ranges you suggest, soonest first, each with real dates in the next six months and a reason from season, weather or events; their length fits the trip"),
      nights: z.number().optional().describe("A sensible trip length, in nights, for a custom range"),
      from: z.string().optional().describe("YYYY-MM-DD: the arrival day if the traveller already named one, to pre-fill the calendar"),
    }),
    "Asks when: suggested date windows as cards, plus a calendar for a range of their own. The pick is sent as the traveller's next message.",
  );
  const Route = block(
    "Route",
    z.object({
      title: z.string().describe("A headline, e.g. 'Italy by _train_'. May mark one phrase"),
      stops: z.array(Stop.ref).describe("2 to 4 stops in travel order, each but the last with its leg"),
    }),
    "Getting from place to place across a trip: a print for each stop and how you get to the next. For trips over several towns or cities; Map is for a walk or a day inside one.",
  );
  const Dishes = block(
    "Dishes",
    z.object({
      title: z.string().describe("A headline, e.g. 'What to eat in _Lisbon_'. May mark one phrase"),
      dishes: z.array(Dish.ref).describe("Exactly 3"),
      note: z.string().optional().describe("A handwritten aside, 2 to 7 words, lower case"),
    }),
    "Three dishes to try as prints, with their local prices; circle the pick.",
  );
  const Versus = block(
    "Versus",
    z.object({
      a: Side.ref,
      b: Side.ref,
      verdict: z.string().optional().describe("Your verdict, handwritten, 3 to 9 words, lower case"),
    }),
    "Two places or things head to head as prints, and your verdict. For a choice between two.",
  );
  const Price = block(
    "Price",
    z.object({
      price: z.string().describe("A local price, short, e.g. '40k ₫'"),
      item: z.string().describe("What it buys, e.g. 'A bowl of phở bò on a plastic stool'"),
      subject,
      note: z.string().optional().describe("A handwritten verdict, 3 to 6 words, lower case"),
    }),
    "One telling local price, set huge and circled beside its photo. For what things cost there.",
  );
  const Checklist = block(
    "Checklist",
    z.object({
      title: z.string().describe("A headline, e.g. 'Istanbul, ==in order=='. May mark one phrase"),
      items: z.array(Item.ref).describe("3 to 5 rows, in the order to do them"),
    }),
    "Things to do in order, each beside a small photo; musts highlighted, asides in pencil.",
  );
  const all = [Headline, Pull, Heading, Text, Prints, Places, Hotels, MapBlock, Spot, Question, Picks, Dates, Route, Dishes, Versus, Price, Checklist, Choices, Plan, Replan, FollowUps];
  const Chat = defineComponent({
    name: "Chat",
    props: z.object({
      blocks: z.array(z.union(all.map((b) => b.ref) as never)),
      place: z.string().optional().describe("The trip's main destination city once known, e.g. 'Kyoto'"),
    }),
    description: "The root: one chat reply, its blocks top to bottom.",
    component: views.Chat,
  });
  return createLibrary<ComponentRenderer<any>>({
    root: "Chat",
    components: [Chat, ...all, Print, Place, Hotel, Option, When, Pick, Stop, Dish, Side, Item] as never[],
  });
}

/** The same library with empty views, for building the system prompt on the server. */
export const chatSpec = () => {
  const none = () => null;
  const views = Object.fromEntries([...chatBlocks, "Chat", ...Object.keys(chatProps)].map((k) => [k, none]));
  return buildChatLibrary(views as unknown as Views).toSpec();
};
