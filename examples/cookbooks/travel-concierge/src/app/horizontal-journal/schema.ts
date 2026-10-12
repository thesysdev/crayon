import { createLibrary, defineComponent } from "@openuidev/lang-core";
import type { ComponentRenderer } from "@openuidev/react-lang";
import { z } from "zod/v4";

// The journal's vocabulary: ten spreads from /design/pairings, each one full page, plus the small
// parts that fill them. The agent picks spreads and writes words; the app owns every position.
// Hand-drawn arrows only name a style and a direction, never a point.
//
// Schemas live here, apart from their views, so the API route can build the prompt without
// importing React (lang-core is the same library builder react-lang wraps). library.tsx supplies the views.

const subject = z
  .string()
  .describe("The exact English Wikipedia article title of a real place or dish, e.g. 'Fushimi Inari-taisha'");

export const colors = ["coral", "cobalt", "emerald", "magenta", "amber", "ink"] as const;
const color = z.enum(colors).optional().describe("The spread's colour; vary it across an entry");

export const arrowStyles = ["line", "swoop", "loop", "hook", "squiggle", "bounce", "dash"] as const;
export const arrowDirs = ["right", "left", "down", "up", "down-right", "down-left", "up-right", "up-left"] as const;

const marked = (what: string) =>
  z
    .string()
    .describe(`${what}. Mark at most one phrase: _underline_, ==highlight== or ((circle))`);

export const props = {
  Pen: z.object({
    text: z.string().describe("A short handwritten aside, 2 to 7 words, lower case, like a friend's scrawl"),
    arrow: z.enum(arrowStyles).optional().describe("A hand-drawn arrow beside the words; use sparingly"),
    dir: z.enum(arrowDirs).optional().describe("Which way the arrow points, toward what the note is about"),
  }),
  Dish: z.object({
    name: z.string().describe("The dish's short name, 1 or 2 words"),
    subject,
    price: z.string().optional().describe("Its local price, e.g. '6 €' or '¥300'"),
    circled: z.boolean().optional().describe("Circle this one's price: the pick of the three"),
  }),
  Stop: z.object({
    name: z.string().describe("The stop's short name, e.g. 'Florence'"),
    subject,
    leg: z.string().optional().describe("Handwritten note on the way to the next stop, e.g. '2h by fast train'"),
  }),
  Side: z.object({ label: z.string().describe("A handwritten label, 1 to 3 words"), subject }),
  Item: z.object({
    text: z.string().describe("A thing to do, 2 to 6 words"),
    subject,
    done: z.boolean().optional().describe("Highlight it as a must"),
    aside: z.string().optional().describe("A handwritten aside, 1 to 4 words"),
  }),
  Tile: z.object({ subject, note: z.string().optional().describe("A handwritten note on the photo, 2 to 5 words") }),
  Hotel: z.object({ id: z.string().describe("A hotel id from search_stays, e.g. 'hotel1'") }),
};

type Views = {
  [K in keyof typeof props]: ComponentRenderer<z.infer<(typeof props)[K]>>;
} & Record<(typeof spreads)[number] | "Journal", ComponentRenderer<never>>;

export const spreads = ["Bleed", "Split", "Trio", "Sentence", "Route", "Quote", "Versus", "Price", "Checklist", "Mosaic", "Stays"] as const;

export function buildLibrary(views: Views) {
  const part = <K extends keyof typeof props>(name: K, description: string) =>
    defineComponent({ name, props: props[name], description, component: views[name] as ComponentRenderer<never> });

  const Pen = part("Pen", "A note in handwriting, with an optional arrow. Notes are the journal's voice; keep them short.");
  const Dish = part("Dish", "A dish in a Trio.");
  const Stop = part("Stop", "A stop on a Route.");
  const Side = part("Side", "One side of a Versus.");
  const Item = part("Item", "A row of a Checklist, with a small photo.");
  const Tile = part("Tile", "A photo in a Mosaic.");
  const Hotel = part("Hotel", "A real hotel from a trivago search, by its id. The app fills in the rest.");

  const spread = (name: (typeof spreads)[number], shape: z.ZodObject, description: string) =>
    defineComponent({ name, props: shape, description, component: views[name] });

  const Bleed = spread(
    "Bleed",
    z.object({ title: z.string().describe("The place, 1 to 3 words"), subject, note: z.optional(Pen.ref), color }),
    "A full-bleed photo with a huge title. Opens a new destination; also good for a big stop.",
  );
  const Split = spread(
    "Split",
    z.object({
      title: marked("A short headline, 2 to 5 words"),
      text: z.string().describe("One or two warm sentences"),
      subject,
      note: z.optional(Pen.ref),
      color,
      photo: z.enum(["right", "left"]).optional(),
    }),
    "A solid colour block with the words, beside a tall photo.",
  );
  const Trio = spread(
    "Trio",
    z.object({ title: marked("A headline, 2 to 5 words"), dishes: z.array(Dish.ref).describe("Exactly 3"), note: z.optional(Pen.ref), color }),
    "Three food photos under a headline, names and prices beneath.",
  );
  const Sentence = spread(
    "Sentence",
    z.object({
      text: z
        .string()
        .describe(
          "One giant sentence, 8 to 16 words, with 2 or 3 photos set into the line as [Subject], e.g. 'Espresso [Espresso] standing up, then cannoli [Cannoli] in Palermo.' May mark one phrase with _underline_",
        ),
      note: z.optional(Pen.ref),
      color,
    }),
    "A huge sentence with small photos set into the line like words.",
  );
  const Route = spread(
    "Route",
    z.object({
      title: marked("A headline, e.g. 'Italy by train'"),
      stops: z.array(Stop.ref).describe("2 to 4 stops in travel order"),
      arrow: z.enum(arrowStyles).optional(),
      color,
      dark: z.boolean().optional().describe("Black page instead of the canvas"),
    }),
    "Photos in a row with a hand-drawn arrow and a note in each gap. For getting from place to place.",
  );
  const Quote = spread(
    "Quote",
    z.object({
      quote: z.string().describe("One vivid line, 6 to 14 words, no quote marks"),
      subject,
      reply: z.optional(Pen.ref),
      color,
      photo: z.enum(["right", "left"]).optional(),
    }),
    "A big line of type beside a photo, with a handwritten reply.",
  );
  const Versus = spread(
    "Versus",
    z.object({ title: z.string().describe("One word, e.g. 'or', or the place"), a: Side.ref, b: Side.ref, verdict: z.optional(Pen.ref), color }),
    "Two photos head to head with a verdict. For a choice between two things.",
  );
  const Price = spread(
    "Price",
    z.object({
      price: z.string().describe("A local price, short, e.g. '40k ₫'"),
      item: z.string().describe("What it buys, e.g. 'Phở bò, on a plastic stool'"),
      subject,
      note: z.string().optional().describe("A handwritten verdict, 3 to 6 words"),
      color,
    }),
    "A food photo beside a colour block with a huge circled price. One per entry at most.",
  );
  const Checklist = spread(
    "Checklist",
    z.object({ title: marked("A headline, e.g. 'Istanbul, in order'"), items: z.array(Item.ref).describe("3 to 5 rows"), color }),
    "A list of things to do, each with a small photo; highlights and asides in pen.",
  );
  const Mosaic = spread(
    "Mosaic",
    z.object({ title: z.string().describe("A headline, 2 to 5 words"), tiles: z.array(Tile.ref).describe("Exactly 5"), color }),
    "Five photos in an uneven grid with the title cut in. For a region or a mood.",
  );
  const Stays = spread(
    "Stays",
    z.object({
      title: marked("A headline, e.g. 'Where to sleep in _Alfama_'"),
      hotels: z.array(Hotel.ref).describe("2 to 4 Hotels, best first"),
      note: z.optional(Pen.ref),
      color,
    }),
    "Real hotels from a trivago search, side by side with photo, price and a booking link.",
  );
  const all = [Bleed, Split, Trio, Sentence, Route, Quote, Versus, Price, Checklist, Mosaic, Stays];
  const Journal = defineComponent({
    name: "Journal",
    props: z.object({ pages: z.array(z.union(all.map((s) => s.ref) as never)) }),
    description: "The root: one journal entry, its spreads in reading order, left to right.",
    component: views.Journal,
  });
  return createLibrary<ComponentRenderer<any>>({
    root: "Journal",
    components: [Journal, ...all, Pen, Dish, Stop, Side, Item, Tile, Hotel] as never[],
  });
}

/** The same library with empty views, for building the system prompt on the server. */
export const journalSpec = () => {
  const none = () => null;
  const views = Object.fromEntries([...spreads, "Journal", ...Object.keys(props)].map((k) => [k, none]));
  return buildLibrary(views as unknown as Views).toSpec();
};
