import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/moodboard-spec.json";

// Three boards that look nothing alike, for syntax and range only: a type-led city, a
// photo-led landscape, and a compact food trip. The model composes its own pieces per trip.
const typeLed = `=== new board
=== title@3 | -
root = Stack([name, line], "column", "m")
name = Heading("Lisbon", "xl")
line = Paragraph("Five slow days in May: tiled hills, river light, and fado after dark.", "l", "muted")

=== quote@2 | -
root = Stack([quote, words], "column", "l")
quote = Quote("A city that sounds like a sigh and tastes like cinnamon.")
words = Words(["sun-washed", "hilly", "salty", "tiled"])

=== numbers@1 | At a glance
root = Stack([days, temp, cost], "column", "l")
days = Numeral("5 days", "Alfama, Belém, Sintra")
temp = Numeral("23°C", "typical May afternoon")
cost = Numeral("€150", "a day for two, mid-range")

=== alfama@2 | Alfama
root = Stack([pair], "column")
pair = PhotoWithCaption(Photo("Alfama", "Alfama", "place"), "Start in Alfama", "Get lost below the castle before the tour groups arrive, then lunch in a tasca.", "left")

=== days@2 | Itinerary
root = Stack([days], "column")
days = NumberedList([Step("Alfama on foot", "Castle at opening, fado in Mouraria."), Step("Belém by the river", "Monastery, tower, pastéis warm from the oven."), Step("Sintra", "Early train; Pena Palace first.")])

=== food@2 | Food
root = Stack([grid], "column")
grid = PhotoGrid([Photo("Pastel de nata", "Pastel de nata", "food"), Photo("Bifana", "Bifana", "food"), Photo("Grilled sardines", "Sardines", "food")], "strip")`;

const photoLed = `=== new board
=== hero@4 | -
root = Stack([grid, name], "column", "m")
grid = PhotoGrid([Photo("Perito Moreno Glacier", "Perito Moreno", "place"), Photo("Torres del Paine National Park", "Torres del Paine", "place"), Photo("Fitz Roy", "Fitz Roy", "place"), Photo("Grey Glacier", "Grey Glacier", "place"), Photo("Marble Caves", "Marble Caves", "place")], "bento")
name = Heading("Patagonia, on foot", "l")

=== trails@3 | Trails
root = Stack([grid], "column")
grid = PhotoGrid([Photo("W Trek", "The W Trek", "place"), Photo("Laguna de los Tres", "Laguna de los Tres", "place"), Photo("El Chaltén", "El Chaltén", "place"), Photo("Cerro Torre", "Cerro Torre", "place"), Photo("windswept steppe road", "Ruta 40", "scene"), Photo("Lago Pehoé", "Lago Pehoé", "place")], "masonry", 3)

=== kit@1 | Packing
root = Stack([kit], "column")
kit = Bullets(["Windproof shell", "Broken-in boots", "Layers for four seasons a day", "Cash for El Chaltén"])

=== facts@1 | Practical info
root = Stack([facts], "column")
facts = KeyValue([KV("Best time", "November to March"), KV("Getting around", "Long-distance buses"), KV("Budget", "About $70 a day in hostels")])`;

const foodLed = `=== new board
=== title@2 | -
root = Stack([name, line], "column", "s")
name = Heading("Eating Osaka", "xl")
line = Paragraph("Three nights of counters, stalls, and neon in Dotonbori.", "m", "muted")

=== dishes@2 | Food
root = Stack([grid], "column")
grid = PhotoGrid([Photo("Takoyaki", "Takoyaki", "food"), Photo("Okonomiyaki", "Okonomiyaki", "food"), Photo("Kushikatsu", "Kushikatsu", "food"), Photo("Kitsune udon", "Kitsune udon", "food")], "tiles", 2)

=== crawl@2 | Where to eat
root = Columns([list, photo], [3, 2])
list = NumberedList([Step("Kuromon Market", "Breakfast of grilled scallops."), Step("Shinsekai", "Kushikatsu, no double-dipping."), Step("Dotonbori", "Takoyaki under the Glico sign.")])
photo = Photo("Dotonbori", "Dotonbori", "place", "portrait")

=== colours@1 | Colours
root = Stack([palette], "column")
palette = Palette([Swatch("#E6002D", "Lantern red", "Signs"), Swatch("#1B1B1F", "Night street", "Base"), Swatch("#F2B33D", "Fry gold", "Accent")])`;

export function moodboardPrompt() {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        "You are a travel planner who sketches trips as moodboards on a canvas. Reply only with header lines, each followed by a piece's OpenUI Lang program with its own root = Stack(...) or root = Columns(...). Never write prose outside the pieces, and never wrap anything in code fences.",
        "Headers: '=== <kind>@<width> | <label>'. kind is a short slug you choose (food, alfama, night-markets). width is how many of the board's 4 columns the piece spans, 1 to 4. label is the piece's plain section name ('Food', 'Itinerary', 'Where to stay', 'Practical info'), or '-' for none, as for a title or a quote. Never invent poetic labels.",
        "The message starts with the canvas. If it's empty, or the request is a different trip or destination than the current board, start with '=== new board' and compose a whole board. Otherwise edit it with as few pieces as possible: '=== replace <id> | <kind>@<width> | <label>' rewrites a piece in full, '=== <kind>@<width> | <label>' adds one, and '=== remove <id>' deletes one (no program). When pieces are selected, the request is about them. Never repeat unchanged pieces. The app arranges pieces on the canvas; never think about positions.",
        "Compose each board for its destination rather than filling a template. Vary the number of pieces (4 to 12), their widths, and their mix: a city of neighbourhoods might be type-led with Numerals and PhotoWithCaption; a landscape photo-led with big PhotoGrids; a food trip built around dishes. Use different PhotoGrid variants and Columns layouts across pieces, and don't give every board the same sections. The examples show the range, not a structure to copy. Don't open every board with a title, a quote, and figures: sometimes lead with a full-width photo grid, a single huge Heading, a PhotoWithCaption, or a NumberedList. When the canvas already has a board, make the new one structurally different from it (different opening, piece count, widths, and blocks). Follow the message's style hint for a new board.",
        "Build pieces from these blocks only: Heading, Paragraph, Quote, Words, Numeral (type); Photo, PhotoGrid, PhotoWithCaption (media); Bullets, NumberedList with Step, KeyValue with KV (lists); Stack, Columns, Spacer, Rule (layout); Palette with Swatch, Tag (accents). Never use cards, tabs, callouts, charts, Image, Display, Note, Itinerary, or Collage. Editorial type and tight photo grids, no boxes.",
        "Photo subjects for places, food, and stays are exact English Wikipedia article titles of real, specific things: landmarks, temples, markets, neighbourhoods, dishes ('Fushimi Inari-taisha', 'Nishiki Market', 'Kaiseki', 'Gion'). Scene subjects (kind 'scene') are 2-4 plain words. Captions are the short name. Use each subject once on the board. Never write image URLs.",
        "Be specific and brief: one sentence per Step, KV, or caption. Temperatures and costs are typical estimates.",
      ],
      examples: [typeLed, photoLed, foodLed],
    },
  });
}
