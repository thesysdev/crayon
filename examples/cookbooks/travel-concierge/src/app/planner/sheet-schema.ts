import { createLibrary, defineComponent } from "@openuidev/lang-core";
import type { ComponentRenderer } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { props as journalProps } from "./schema";

// The detail sheet a photo opens: one listing-style page, laid out like an Airbnb listing.
// Photos on top, the place's highlights and story on the left, hotels from trivago in a card
// on the right. Like schema.ts, hook-free so the sheet route can build its prompt from it.

const subject = z.string().describe("The exact English Wikipedia article title of a real place or dish");

export const sheetProps = {
  Highlight: z.object({
    title: z.string().describe("A short, specific line, 3 to 6 words"),
    text: z.string().describe("One sentence that backs it up"),
  }),
  Thing: z.object({
    name: z.string().describe("Short name"),
    subject,
    note: z.string().describe("One short line on why"),
  }),
  Section: z.object({ title: z.string().describe("A plain heading, e.g. 'What to eat nearby'") }),
  Hotel: journalProps.Hotel,
};

type Views = Record<"Sheet" | "Highlight" | "Thing" | "Section" | "Hotel", ComponentRenderer<never>>;

export function buildSheetLibrary(views: Views) {
  const Highlight = defineComponent({ name: "Highlight", props: sheetProps.Highlight, description: "One of three highlights under the photos.", component: views.Highlight });
  const Thing = defineComponent({ name: "Thing", props: sheetProps.Thing, description: "A nearby place, sight or dish with a photo.", component: views.Thing });
  const Section = defineComponent({
    name: "Section",
    props: sheetProps.Section.extend({ things: z.array(Thing.ref).describe("3 to 6 Things") }),
    description: "A titled group of Things.",
    component: views.Section,
  });
  const Hotel = defineComponent({
    name: "Hotel",
    props: sheetProps.Hotel,
    description: "A real hotel from a trivago search, by its id. The app fills in the rest.",
    component: views.Hotel,
  });
  const Sheet = defineComponent({
    name: "Sheet",
    props: z.object({
      title: z.string().describe("The place's name"),
      line: z.string().describe("Where it is and what it is, e.g. 'Lisbon's oldest quarter, Portugal'"),
      photos: z.array(subject).describe("Exactly 5 Wikipedia titles: the place itself first, then 4 sights, details or dishes of it"),
      highlights: z.array(Highlight.ref).describe("Exactly 3"),
      about: z.string().describe("Three to five warm sentences: what it is like, when to go, how to spend the time"),
      sections: z.array(Section.ref).describe("1 or 2 Sections"),
      tips: z.array(z.string()).describe("3 to 5 short practical lines"),
      hotels: z.array(Hotel.ref).optional().describe("Hotels from the search, best first, when it found any"),
      note: z.string().optional().describe("A handwritten aside, 2 to 6 words, lower case"),
    }),
    description: "The root: the whole detail sheet for one place.",
    component: views.Sheet,
  });
  return createLibrary<ComponentRenderer<any>>({ root: "Sheet", components: [Sheet, Highlight, Section, Thing, Hotel] as never[] });
}

export const sheetSpec = () => {
  const none = () => null;
  return buildSheetLibrary({ Sheet: none, Highlight: none, Thing: none, Section: none, Hotel: none }).toSpec();
};
