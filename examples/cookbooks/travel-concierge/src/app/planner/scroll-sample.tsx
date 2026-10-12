"use client";

import { Renderer } from "@openuidev/react-lang";
import { handFont } from "../horizontal-journal/fonts";
import { journalLibrary } from "./library";
import "./scroll-sample.css";

// The planner's board in miniature for /components: your message in pencil, then the entry's
// spreads sitting straight on the white board, each at its own size and height, scrolled freely.
// Each spread is the same OpenUI Lang the agent writes, rendered by the planner's library.

const entry = [
  `root = Journal([s])\ns = Bleed("Kyoto in autumn", "Kiyomizu-dera", Pen("maples doing the most", "swoop", "down-left"))`,
  `root = Journal([s])\ns = Sentence("Matcha [Matcha] _at dawn_, then the torii [Fushimi Inari-taisha] before the crowds.", Pen("go at 6am"), "emerald")`,
  `root = Journal([s])\ns = Route("Kyoto to Nara", [Stop("Kyoto", "Kinkaku-ji", "JR Nara line, 45 min"), Stop("Nara", "Tōdai-ji", "bus, 20 min"), Stop("Kasuga", "Kasuga-taisha")], "dash", "coral")`,
  `root = Journal([s])\ns = Price("¥700", "Kitsune udon by the river", "Kitsune udon", "the broth!", "amber")`,
  `root = Journal([s])\ns = Split("Arashiyama _before 8am_", "The tour buses arrive at nine. Walk the bamboo grove first, then cross the bridge for breakfast.", "Arashiyama Bamboo Grove", Pen("this light", "dash", "right"), "emerald")`,
  `root = Journal([s])\ns = Trio("Snacks in _Nishiki_", [Dish("Sushi", "Sushi", "¥1,800"), Dish("Mochi", "Mochi", "¥300", true), Dish("Matcha", "Matcha", "¥650")], Pen("the mochi stall by the shrine gate", "hook", "down-left"), "emerald")`,
  `root = Journal([s])\ns = Quote("The quietest garden is the one with no flowers.", "Ryōan-ji", Pen("go on a weekday"), "cobalt", "left")`,
  `root = Journal([s])\ns = Versus("or", Side("the gold one", "Kinkaku-ji"), Side("the silver one", "Ginkaku-ji"), Pen("do both. different moods."), "ink")`,
  `root = Journal([s])\ns = Checklist("Kyoto, in order", [Item("Fushimi Inari at dawn", "Fushimi Inari-taisha", true), Item("Tea in Gion", "Gion", true), Item("Philosopher's Path", "Philosopher's Path", false, "go in the rain"), Item("Kaiseki dinner", "Kaiseki")])`,
  `root = Journal([s])\ns = Mosaic("A quieter afternoon", [Tile("Kiyomizu-dera", "slow down here"), Tile("Gion", "lanterns at 7"), Tile("Tōfuku-ji"), Tile("Nishiki Market"), Tile("Kamo River")], "coral")`,
];

// The same widths the planner gives each kind of page, in grid columns (see journal.css).
const spans: Record<string, number> = { Bleed: 9, Split: 10, Trio: 10, Sentence: 7, Quote: 8, Price: 7, Checklist: 9, Versus: 8, Mosaic: 12 };
function span(code: string) {
  const kind = code.match(/s = (\w+)\(/)?.[1] ?? "";
  if (kind === "Route") return Math.min(12, 1 + 3 * (code.match(/Stop\(/g)?.length ?? 2));
  return spans[kind] ?? 9;
}

// Each kind's scale and resting height on the board, as [h, y] (see the board in journal.css).
const board: Record<string, [number, number]> = {
  Bleed: [0.88, 0],
  Route: [0.74, 0.75],
  Split: [0.92, 1],
  Mosaic: [1, 0.5],
  Trio: [0.8, 0.1],
  Checklist: [0.92, 1],
  Sentence: [0.72, 0.8],
  Quote: [0.7, 0.2],
  Price: [0.7, 0.6],
  Versus: [0.82, 0.35],
};
function place(code: string) {
  const [h, y] = board[code.match(/s = (\w+)\(/)?.[1] ?? ""] ?? [1, 0.5];
  return { flexBasis: `${span(code) * 8 * h}%`, height: `${h * 100}cqh`, marginTop: `${(1 - h) * y * 100}cqh` };
}

export function PlannerScrollSample() {
  return (
    <div className={`pl-scroll-sample ${handFont.variable}`}>
      <div className="pl-scroll-sample__strip">
        <p className="pl-scroll-sample__said">Four days in Kyoto in autumn</p>
        {entry.map((code, i) => (
          <div key={i} className="hj-frame pl-scroll-sample__panel" style={place(code)}>
            <Renderer response={code} library={journalLibrary} isStreaming={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
