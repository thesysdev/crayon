import { createLibrary } from "@openuidev/react-lang";
import { openuiComponentGroups, openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { blocks } from "./blocks";
import {
  Collage,
  Day,
  Display,
  Gradient,
  Itinerary,
  Note,
  Palette,
  Photo,
  Quote,
  Swatch,
  TypePair,
  Words,
} from "./components";
import { tripComponents } from "./trip-components";

const names = (components: { name: string }[]) => components.map((component) => component.name);

// The moodboard library: small building blocks the planner composes freely into canvas pieces
// (type, media, lists, layout, accents), the trip data the app writes from trivago, and the full
// OpenUI library underneath. Each canvas piece is one program rendered with this library.
const legacy = [Display, Note, Itinerary, Day, Collage, TypePair, Gradient];

export const moodboardLibrary = createLibrary({
  root: openuiLibrary.root,
  componentGroups: [
    ...openuiComponentGroups,
    {
      name: "Type",
      components: [...names(blocks.type), "Quote", "Words"],
      notes: ["Heading sizes xl/l/m are serif display type; s is a plain sans label."],
    },
    {
      name: "Media",
      components: ["Photo", ...names(blocks.media)],
      notes: [
        "Photo finds a real photo of a named place, dish, or stay, so never write image URLs.",
      ],
    },
    { name: "Lists", components: names(blocks.lists) },
    {
      name: "Layout",
      components: names(blocks.layout),
      notes: ["Stack (column or row) and Columns arrange blocks inside a piece."],
    },
    { name: "Accents", components: ["Palette", "Swatch"] },
    {
      name: "Trip data",
      components: names(tripComponents),
      notes: ["The app writes these from trivago's live data. Never write them yourself."],
    },
    {
      name: "Older boards",
      components: names(legacy),
      notes: ["Kept so boards saved earlier still render. Don't use them in new pieces."],
    },
  ],
  components: [
    ...Object.values(openuiLibrary.components),
    ...blocks.type,
    ...blocks.media,
    ...blocks.lists,
    ...blocks.layout,
    Quote,
    Words,
    Photo,
    Palette,
    Swatch,
    ...legacy,
    ...tripComponents,
  ],
});
