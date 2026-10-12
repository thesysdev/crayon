"use client";

import { Renderer } from "@openuidev/react-lang";
import { useCallback, useEffect, useState } from "react";
import { handFont } from "../horizontal-journal/fonts";
import { HandArrow, HotelsContext, journalLibrary, type Opened, Pen, readReply, SheetOpener } from "../horizontal-journal/library";
import { DetailSheet, sheetLibrary } from "../horizontal-journal/sheet";
import { DrawablyCircle, DrawablyHighlight, DrawablyUnderline } from "../horizontal-journal/drawably/react.js";
import { arrowStyles } from "../horizontal-journal/schema";

// The horizontal journal's spreads, live: each sample is the same OpenUI Lang the agent writes,
// rendered by the journal's own library into a 16:10 page.

const samples: Record<string, string[]> = {
  bleed: [
    `root = Journal([s])\ns = Bleed("Lisbon", "Alfama", Pen("climb up here for sunset", "swoop", "down-left"))`,
    `root = Journal([s])\ns = Bleed("Petra", "Petra", Pen("800 steps up. sunset."), "amber")`,
  ],
  split: [
    `root = Journal([s])\ns = Split("Hallstatt before _8am_", "The day-trippers arrive at ten. Take the first ferry and have the lake and the church spire to yourself.", "Hallstatt", Pen("this view", "dash", "right"), "cobalt")`,
    `root = Journal([s])\ns = Split("Seville, slowly", "Lunch at three, siesta till seven, churros at two in the morning. Nobody here is in a hurry.", "Plaza de España (Seville)", Pen("the tiles!", "hook", "left"), "magenta", "left")`,
  ],
  trio: [
    `root = Journal([s])\ns = Trio("Snacks in _Kyoto_", [Dish("Sushi", "Sushi", "¥1,800"), Dish("Mochi", "Mochi", "¥300", true), Dish("Matcha", "Matcha", "¥650")], Pen("the mochi stall by the shrine gate", "hook", "down-left"), "emerald")`,
  ],
  sentence: [
    `root = Journal([s])\ns = Sentence("Espresso [Espresso] _standing up_, then cannoli [Cannoli] in Palermo.", Pen("this is the rule"), "coral")`,
    `root = Journal([s])\ns = Sentence("A lobster roll [Lobster roll] on the dock and the ferry [Staten Island Ferry] home.", Pen("the 6:40pm ferry"), "cobalt")`,
  ],
  route: [
    `root = Journal([s])\ns = Route("Italy by ((train))", [Stop("Rome", "Colosseum", "1h 32m, fast train"), Stop("Florence", "Florence Cathedral", "2h, sit on the left"), Stop("Venice", "Grand Canal")], "dash", "coral")`,
    `root = Journal([s])\ns = Route("Tokyo to Kyoto", [Stop("Tokyo", "Shibuya Crossing", "Romancecar, 85 min"), Stop("Hakone", "Lake Ashi", "Shinkansen, 2h"), Stop("Kyoto", "Fushimi Inari-taisha")], "swoop", "amber", true)`,
  ],
  quote: [
    `root = Journal([s])\ns = Quote("Worth every one of the sixteen hundred steps.", "Machu Picchu", Pen("my legs disagree", "swoop", "right"))`,
    `root = Journal([s])\ns = Quote("In July the light never quite leaves.", "Lofoten", Pen("slept three hours a night"), "cobalt", "left")`,
  ],
  versus: [
    `root = Journal([s])\ns = Versus("Tokyo", Side("the crossing", "Shibuya Crossing"), Side("the mountain", "Mount Fuji"), Pen("two hours apart. do both."), "ink")`,
    `root = Journal([s])\ns = Versus("or", Side("sweet", "Croissant"), Side("savoury", "Croque monsieur"), Pen("both. obviously.", "squiggle", "up"), "magenta")`,
  ],
  price: [
    `root = Journal([s])\ns = Price("40k ₫", "Phở bò, on a plastic stool", "Pho", "best breakfast of the trip", "coral")`,
    `root = Journal([s])\ns = Price("₹280", "Dum biryani, eaten with your hands", "Hyderabadi biryani", "ask for extra raita", "emerald")`,
  ],
  checklist: [
    `root = Journal([s])\ns = Checklist("Istanbul, in order", [Item("Hagia Sophia at opening", "Hagia Sophia", true), Item("Coffee, read the grounds", "Turkish coffee", true), Item("Lokum from Karaköy", "Turkish delight", false, "buy two boxes"), Item("Kebab by the Bosphorus", "Kebab"), Item("Night bus to Cappadocia", "Cappadocia", false, "book ahead!!")])`,
  ],
  mosaic: [
    `root = Journal([s])\ns = Mosaic("Ten weeks south", [Tile("Tulum"), Tile("Al pastor", "tacos at 1am"), Tile("Ceviche"), Tile("Arepa"), Tile("Old Havana", "havana from a roof")], "magenta")`,
    `root = Journal([s])\ns = Mosaic("Small towns, loud colours", [Tile("Burano"), Tile("Giethoorn", "no cars at all"), Tile("Manarola"), Tile("Kotor", "walk the walls at 8"), Tile("Hallstatt")], "cobalt")`,
  ],
};

// Stays shows live trivago hotels, so its sample fetches them before it renders.
const staysSamples = [
  { place: "Alfama, Lisbon", code: `root = Journal([s])\ns = Stays("Where to sleep in _Alfama_", [Hotel("hotel1"), Hotel("hotel2"), Hotel("hotel3")], Pen("ask for a river view"), "coral")` },
  { place: "Gion, Kyoto", code: `root = Journal([s])\ns = Stays("Kyoto, by the ((river))", [Hotel("hotel1"), Hotel("hotel2"), Hotel("hotel3"), Hotel("hotel4")], Pen("walk to everything", "swoop", "down-left"), "emerald")` },
];

function Stays() {
  const [codes, setCodes] = useState<string[]>([]);
  useEffect(() => {
    Promise.all(
      staysSamples.map((s) =>
        fetch(`/api/horizontal-journal?stays=${encodeURIComponent(s.place)}`)
          .then((r) => (r.ok ? r.text() : ""))
          .then((hotels) => `${s.code}\n${hotels}`),
      ),
    ).then(setCodes);
  }, []);
  return (
    <div className={`hj-samples journal-page ${handFont.variable}`}>
      {(codes.length ? codes : staysSamples.map(() => "")).map((code, i) => (
        <div key={i} className="hj-frame">
          {code ? (
            <HotelsContext.Provider value={readReply(code).hotels}>
              <Renderer response={readReply(code).program} library={journalLibrary} isStreaming={false} />
            </HotelsContext.Provider>
          ) : (
            <div className="hj-img is-loading" style={{ height: "100%" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Frames({ id }: { id: string }) {
  if (id === "stays") return <Stays />;
  return (
    <div className={`hj-samples journal-page ${handFont.variable}`}>
      {samples[id].map((code, i) => (
        <div key={i} className="hj-frame">
          <Renderer response={code} library={journalLibrary} isStreaming={false} />
        </div>
      ))}
    </div>
  );
}

const dirs = ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"] as const;

/** Pen notes and their arrows: every style pointing right, then one style turned every way. */
function Pens() {
  return (
    <div className={`hj-samples journal-page ${handFont.variable}`}>
      <div className="hj-sheet">
        <div className="hj-sheet__grid">
          {arrowStyles.map((style) => (
            <Pen key={style} note={{ text: style === "dash" ? "this way" : "look", arrow: style, dir: "right" }} color="#ff5364" />
          ))}
        </div>
        <div className="hj-sheet__row">
          {dirs.map((dir) => (
            <span key={dir} style={{ fontSize: 40 }}>
              <HandArrow style="swoop" dir={dir} />
            </span>
          ))}
        </div>
        <div className="hj-sheet__row">
          <Pen note="get six, not two" color="#000" />
          <Pen note="the 6:40pm ferry" color="#004ab0" />
          <Pen note="book ahead!!" color="#e5359e" />
        </div>
      </div>
    </div>
  );
}

/** The three marks a headline may carry, drawn over Timeless. */
function Marks() {
  return (
    <div className={`hj-samples journal-page ${handFont.variable}`}>
      <div className="hj-sheet hj-sheet--type">
        <p>
          A slow day in <DrawablyUnderline stroke="#ff5364" width={3}>Kyoto</DrawablyUnderline>
        </p>
        <p>
          Slurping is <DrawablyHighlight fill="#feb600">polite</DrawablyHighlight> here
        </p>
        <p>
          Get <DrawablyCircle stroke="#ff5364" width={3}>six</DrawablyCircle>, not two
        </p>
      </div>
    </div>
  );
}

// The detail sheet a photo opens, laid out inline: the agent's own example, with live trivago hotels.
const sheetSample = `root = Sheet("Alfama", "Lisbon's oldest quarter, Portugal", ["Alfama", "Lisbon Cathedral", "Castle of São Jorge", "Fado", "Pastel de nata"], [h1, h2, h3], "A tangle of lanes that survived the 1755 earthquake, stacked up the hill below the castle. Come early, when the laundry is still going up and the trams are half empty. Spend the afternoon climbing between viewpoints and stay for fado after dark.", [see], ["Wear shoes with grip: the cobbles are polished smooth", "Tram 28 is fastest before 9am", "Most fado houses take bookings for dinner"], [Hotel("hotel1"), Hotel("hotel2"), Hotel("hotel3")], "get lost on purpose")
h1 = Highlight("Best at first light", "The lanes are empty and the river glows before nine.")
h2 = Highlight("Fado after dark", "Small houses sing from dinner until late.")
h3 = Highlight("Views at every turn", "Two miradouros look straight over the rooftops to the Tagus.")
see = Section("Nearby", [Thing("The castle", "Castle of São Jorge", "Walls and peacocks over the whole city"), Thing("The cathedral", "Lisbon Cathedral", "Romanesque and fortress-thick"), Thing("Feira da Ladra", "Feira da Ladra", "The flea market, Tuesdays and Saturdays")])`;

function SheetSample() {
  const [hotels, setHotels] = useState("");
  useEffect(() => {
    fetch(`/api/horizontal-journal?stays=${encodeURIComponent("Alfama, Lisbon")}`)
      .then((r) => (r.ok ? r.text() : ""))
      .then(setHotels);
  }, []);
  const reply = readReply(`${sheetSample}\n${hotels}`);
  return (
    <div className={`hj-samples journal-page ${handFont.variable}`}>
      <div className="hj-sheet-panel hj-sheet-panel--inline">
        <HotelsContext.Provider value={reply.hotels}>
          <Renderer response={reply.program} library={sheetLibrary} isStreaming={false} />
        </HotelsContext.Provider>
      </div>
    </div>
  );
}

/** One item of the Journal spreads group in /components: `pen`, `marks`, `sheet`, or a spread's
 *  samples. Photos here open the real detail sheet, written live, just as in the journal. */
export function JournalSpread({ id }: { id: string }) {
  const [open, setOpen] = useState<Opened | null>(null);
  const close = useCallback(() => setOpen(null), []);
  return (
    <SheetOpener.Provider value={setOpen}>
      {id === "pen" ? <Pens /> : id === "marks" ? <Marks /> : id === "sheet" ? <SheetSample /> : <Frames id={id} />}
      {open ? (
        <div className={`journal-page ${handFont.variable}`}>
          <DetailSheet key={open.subject} open={open} context="" onClose={close} />
        </div>
      ) : null}
    </SheetOpener.Provider>
  );
}
