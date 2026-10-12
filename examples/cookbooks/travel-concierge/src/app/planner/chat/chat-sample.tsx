"use client";

import { useEffect, useState } from "react";
import { handFont } from "../../horizontal-journal/fonts";
import { type ItineraryItem, ItineraryProvider } from "../itinerary";
import { ChatAnswer, ChatSaid, ChatThinking } from "./chat";
import { ChatItineraryCard } from "./chat-library";
import { type PlannerMode, PlannerChatTabs } from "./chat-tabs";

// The Chat tab's pieces for /components. Hearts here save to a sample trip of their own, so they
// never touch a real one; follow-up taps go nowhere.

const SAMPLE = "components-chat-sample";
const nowhere = () => {};

function Stage({ children, column = true }: { children: React.ReactNode; column?: boolean }) {
  return (
    <ItineraryProvider trip={SAMPLE}>
      <div className={`pl-chat-sample ${handFont.variable}`} style={column ? { width: "min(880px, 100%)", margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 } : undefined}>
        {children}
      </div>
    </ItineraryProvider>
  );
}

export function ChatTabsSample() {
  const [mode, setMode] = useState<PlannerMode>("chat");
  return (
    <Stage column={false}>
      <div className="pl-sample-box pl-sample-box--tabs">
        <PlannerChatTabs mode={mode} onChange={setMode} />
      </div>
    </Stage>
  );
}

const reply = `root = Chat([h, p, prints, places, f], "Kyoto")
h = Headline("Kyoto in ==November== is all fire and moss")
p = Pull("Maples [Momiji] turn the temple hills red, so go early and slow.", "trust me on the early part")
prints = Prints([Print("Kiyomizu-dera", "Kiyomizu-dera", "go before nine"), Print("Fushimi Inari-taisha", "Fushimi Inari"), Print("Arashiyama", "Arashiyama", "bamboo, then tea")])
places = Places([Place("Eikan-dō", "Eikan-dō Zenrin-ji", "The most famous maples in Kyoto, lit up after dark.", "Higashiyama"), Place("Nishiki Market", "Nishiki Market", "Five blocks of pickles, tofu doughnuts and tamagoyaki on sticks.", "Nakagyō", "food")])
f = FollowUps([Option("Find a quiet ryokan", null, "stay"), Option("What should I eat in Gion?", null, "food"), Option("Make it a day-by-day plan", null, "schedule"), Option("Then on to Tokyo", "tokyo", "place")])`;

/** One exchange: your message in pencil, and the agent's reply in type and pieces. */
export function ChatMessageSample() {
  return (
    <Stage>
      <article className="pl-chat-turn">
        <ChatSaid text="Four days in Kyoto in November" />
        <ChatAnswer code={reply} turn="sample" send={nowhere} />
      </article>
    </Stage>
  );
}

/** While the agent works: your message writes itself in pencil, then a pencil line keeps drawing. */
export function ChatLoadingSample() {
  const [run, setRun] = useState(0);
  return (
    <Stage>
      <article className="pl-chat-turn" key={run}>
        <ChatSaid text="Move the temples to mornings" writing />
        <ChatThinking />
      </article>
      <button type="button" className="pl-save" style={{ alignSelf: "flex-start" }} onClick={() => setRun((n) => n + 1)}>
        Write it again
      </button>
    </Stage>
  );
}

const items: ItineraryItem[] = [
  { id: "a", name: "Kiyomizu-dera", subject: "Kiyomizu-dera", day: "Day 1 · Fri 6 Nov", time: "Morning", addedAt: 0 },
  { id: "b", name: "Sannenzaka", subject: "Sannenzaka", day: "Day 1 · Fri 6 Nov", time: "Afternoon", addedAt: 0 },
  { id: "c", name: "Gion", subject: "Gion", day: "Day 1 · Fri 6 Nov", time: "Evening", addedAt: 0 },
  { id: "d", name: "Fushimi Inari-taisha", subject: "Fushimi Inari-taisha", day: "Day 2 · Sat 7 Nov", time: "Morning", addedAt: 0 },
  { id: "e", name: "Nishiki Market", subject: "Nishiki Market", kind: "food", day: "Day 2 · Sat 7 Nov", time: "Afternoon", addedAt: 0 },
  { id: "f", name: "Tenryū-ji", subject: "Tenryū-ji", day: "Day 3 · Sun 8 Nov", time: "Morning", addedAt: 0 },
  { id: "g", name: "Arashiyama", subject: "Arashiyama", day: "Day 3 · Sun 8 Nov", time: "Afternoon", addedAt: 0 },
  { id: "h", name: "Gion Fukuzumi Ryokan", subject: "Gion", kind: "stay", price: "¥24,999", addedAt: 0 },
];

/** The sample plan with its photos, looked up the way the journal's are. */
function useItems() {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    for (const subject of new Set(items.map((i) => i.subject ?? i.name)))
      fetch(`/api/moodboard/images?kind=named&q=${encodeURIComponent(subject)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((found: { url?: string } | null) => found?.url && setPhotos((p) => ({ ...p, [subject]: found.url! })))
        .catch(() => {});
  }, []);
  return items.map((i) => ({ ...i, photo: photos[i.subject ?? i.name] }));
}

/** The trip's itinerary in the conversation, as it stands and while the planner changes it. */
export function ChatItinerarySample() {
  const withPhotos = useItems();
  return (
    <Stage>
      <ChatItineraryCard items={withPhotos} title="Mornings for the temples" place="Kyoto" note="moved the temples to mornings" onOpen={nowhere} />
      <ChatItineraryCard items={withPhotos} title="Your Kyoto, day by day" place="Kyoto" working onOpen={nowhere} />
    </Stage>
  );
}

/** Hotels, a walk on the map and where one place is, from a live trivago search. */
export function ChatPiecesSample() {
  const [stays, setStays] = useState("");
  useEffect(() => {
    fetch(`/api/planner?stays=${encodeURIComponent("Gion, Kyoto")}`)
      .then((r) => (r.ok ? r.text() : ""))
      .then(setStays)
      .catch(() => {});
  }, []);
  const code = `root = Chat([p, hotels, map, spot])
p = Pull("Stay in Gion and the whole of _Higashiyama_ is a walk away.")
hotels = Hotels([Hotel("hotel1"), Hotel("hotel2"), Hotel("hotel3"), Hotel("hotel4")])
map = Map("A slow morning in Higashiyama", ["Kiyomizu-dera", "Sannenzaka", "Yasaka Shrine", "Gion"], "Kyoto")
spot = Spot("Nishiki Market", "Kyoto")
${stays}`;
  return (
    <Stage>
      <ChatAnswer key={stays ? "stays" : "waiting"} code={code} turn="sample-pieces" />
    </Stage>
  );
}
