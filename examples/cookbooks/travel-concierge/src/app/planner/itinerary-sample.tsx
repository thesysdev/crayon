"use client";

import { LatestArrowButton } from "./latest-arrow";
import { ItineraryPreview } from "./itinerary-spread";
import { AskPanel } from "./ask-panel";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { handFont } from "../horizontal-journal/fonts";
import type { ItineraryItem } from "./itinerary";
import { flyToItinerary, ItineraryProvider, PlannerTabs, SaveButton, SaveHeart } from "./itinerary";
import { ItineraryCard } from "./board";
import { Doodle, doodleNames, stickerNames } from "./doodles";
import { Mascot } from "./mascot";
import { Breeze, BreezeSheet } from "./breeze";
import "./scroll-sample.css";

// The itinerary pieces for /components: the tabs, the heart, a card, and the board. Hearts here
// save to a sample trip of their own, so they never touch a real one.

const SAMPLE = "components-sample";

/** Wikipedia lead photos by title, as the journal finds them (outside a Renderer, so no usePhoto). */
function usePhotos(subjects: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = subjects.join("|");
  useEffect(() => {
    for (const subject of key.split("|"))
      fetch(`/api/moodboard/images?kind=named&q=${encodeURIComponent(subject)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((found: { url?: string } | null) => found?.url && setUrls((u) => ({ ...u, [subject]: found.url! })))
        .catch(() => {});
  }, [key]);
  return urls;
}
const BoardCanvas = dynamic(() => import("./board").then((m) => m.BoardCanvas), { ssr: false });

export function TabsSample() {
  const [mode, setMode] = useState<"explore" | "itinerary">("explore");
  return (
    <ItineraryProvider trip={SAMPLE}>
      <div className="pl-sample-box pl-sample-box--tabs">
        <PlannerTabs mode={mode} onChange={setMode} />
      </div>
      <p className="pl-steps-sample__sent">
        A save flies up into the Itinerary tab, which turns into a black pill for a moment.{" "}
        <button
          type="button"
          className="pl-save"
          onClick={(e) =>
            flyToItinerary(
              { name: "Torre dos Clérigos", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Torre_dos_Cl%C3%A9rigos_-_Porto.jpg/400px-Torre_dos_Cl%C3%A9rigos_-_Porto.jpg" },
              e.currentTarget,
            )
          }
        >
          Try a save
        </button>
      </p>
    </ItineraryProvider>
  );
}

function Print({ subject }: { subject: string }) {
  const url = usePhotos([subject])[subject];
  const photo = url ? { url } : undefined;
  return (
    <div className="hj-img pl-sample-print">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt="" /> : null}
      {photo ? <SaveHeart item={{ subject, name: subject, photo: photo.url, kind: "place" }} /> : null}
    </div>
  );
}

export function HeartSample() {
  return (
    <ItineraryProvider trip={SAMPLE}>
      <div className="pl-sample-box pl-sample-row">
        <Print subject="Torre dos Clérigos" />
        <Print subject="Livraria Lello" />
        <SaveButton item={{ subject: "Ribeira, Porto", name: "Ribeira", place: "Porto's riverfront", kind: "place" }} />
      </div>
      <p className="pl-steps-sample__sent">Hover a photo for its heart; tap it to save. The sheet&rsquo;s own button reads &ldquo;Add to itinerary&rdquo;.</p>
    </ItineraryProvider>
  );
}

const items: ItineraryItem[] = [
  { id: "a", name: "São Bento railway station", subject: "São Bento railway station", place: "Porto", day: "Day 1 · Fri 6 Nov", time: "Morning", note: "go at 9am for the tiles", addedAt: 0 },
  { id: "b", name: "Ribeira", subject: "Ribeira, Porto", place: "Porto's riverfront", day: "Day 1 · Fri 6 Nov", time: "Afternoon", addedAt: 0 },
  { id: "c", name: "Francesinha", subject: "Francesinha", place: "Café Santiago", day: "Day 1 · Fri 6 Nov", time: "Evening", kind: "food", addedAt: 0 },
  { id: "d", name: "Torre dos Clérigos", subject: "Clérigos Church", place: "Baixa, Porto", day: "Day 2 · Sat 7 Nov", time: "Morning", addedAt: 0 },
  { id: "h1", name: "Torel Palace Porto", subject: "Porto", place: "Baixa, 0.4 mi from centre", price: "€185", url: "https://www.trivago.com", kind: "stay", addedAt: 0 },
  { id: "h2", name: "Campanha Boutique Station", subject: "Campanhã railway station", place: "Campanhã", price: "€52", url: "https://www.trivago.com", kind: "stay", recommended: true, note: "best value, by the station", addedAt: 0 },
  { id: "h3", name: "Jupiter Porto Hotel", subject: "Avenida dos Aliados", place: "Aliados, 0.2 mi from centre", price: "€95", url: "https://www.trivago.com", kind: "stay", addedAt: 0 },
  { id: "e", name: "Livraria Lello", subject: "Livraria Lello", place: "Baixa, Porto", day: "Day 2 · Sat 7 Nov", time: "Afternoon", note: "book a slot", addedAt: 0 },
];

/** The sample items with their photos, looked up the way the journal's are. */
function useItems() {
  const photos = usePhotos(items.map((i) => i.subject ?? i.name));
  return items.map((i) => ({ ...i, photo: photos[i.subject ?? i.name] }));
}

export function CardSample() {
  const withPhotos = useItems();
  return (
    <div className={`pl-sample-box pl-sample-row ${handFont.variable}`}>
      {withPhotos.slice(0, 3).map((item) => (
        <div key={item.id} style={{ width: 248 }}>
          <ItineraryCard item={item} />
        </div>
      ))}
    </div>
  );
}

export function BoardSample() {
  const withPhotos = useItems();
  // Drag cards to rearrange; the sample keeps the new order locally instead of saving it.
  const [arranged, setArranged] = useState<ItineraryItem[] | null>(null);
  const photo = (i: ItineraryItem) => withPhotos.find((p) => p.id === i.id)?.photo;
  const shown = arranged ? arranged.map((i) => ({ ...i, photo: photo(i) })) : withPhotos.map((i) => (i.id === "e" ? { ...i, day: undefined } : i));
  return (
    <div className={`pl-sample-board ${handFont.variable}`}>
      {/* Livraria Lello isn't on a day yet, so it sits in Favourites, with "Make a plan" beside it. */}
      <BoardCanvas
        items={shown}
        place="Porto"
        icon="lisbon"
        onArrange={setArranged}
        // In the sample, "Make a plan" puts the favourites on Day 2 rather than asking the agent.
        onPlan={() => setArranged(shown.map((i) => (i.day || i.kind === "stay" ? i : { ...i, day: "Day 2 · Sat 7 Nov" })))}
      />
    </div>
  );
}

/** The stickers the itinerary agent can press onto the board, large, then a few in place on
 *  cards; and the pencil marks it can draw. */
export function DoodlesSample() {
  const withPhotos = useItems();
  const placed: ItineraryItem[] = [
    { ...withPhotos[0], stickers: [{ doodle: "heart", at: "corner" }] },
    { ...withPhotos[4], stickers: [{ doodle: "star", at: "corner" }], note: "book a slot" },
    { ...withPhotos[1], stickers: [{ doodle: "sun", at: "corner" }] },
  ];
  const marks = doodleNames.filter((n) => !stickerNames.includes(n));
  return (
    <div className={`pl-steps-sample ${handFont.variable}`}>
      <div className="pl-sample-box pl-doodle-sheet pl-doodle-sheet--big">
        {stickerNames.map((name) => (
          <figure key={name}>
            <Doodle name={name} size={96} tilt={((name.length * 7) % 13) - 6} />
            <figcaption>{name}</figcaption>
          </figure>
        ))}
      </div>
      <div className="pl-sample-box pl-sample-row">
        {placed.map((item) => (
          <div key={item.id} style={{ width: 248 }}>
            <ItineraryCard item={item} />
          </div>
        ))}
      </div>
      <p className="pl-steps-sample__sent">Pencil marks, for annotating rather than decorating:</p>
      <div className="pl-sample-box pl-doodle-sheet">
        {marks.map((name) => (
          <figure key={name}>
            <Doodle name={name} size={56} />
            <figcaption>{name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** The mascot, large and at the size it sits in the planner's corner. */
export function MascotSample() {
  return (
    <div className="pl-sample-box pl-sample-row" style={{ alignItems: "flex-end", gap: 40 }}>
      <Mascot size={240} />
      <Mascot size={96} />
      <Mascot size={56} />
    </div>
  );
}

/** Explore's Itinerary spread: the board's plan in brief, with the card button that opens it. */
export function ItinerarySpreadSample() {
  const withPhotos = useItems();
  return (
    <div className={`pl-steps-sample ${handFont.variable}`}>
      <div className="pl-scroll-sample" style={{ aspectRatio: "auto" }}>
        <div className="pl-scroll-sample__strip" style={{ height: 560 }}>
          <div className="hj-frame pl-scroll-sample__panel" style={{ flexBasis: "100%" }}>
            <ItineraryPreview items={withPhotos} title="Porto, day by day" place="Porto" onOpen={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The Explore panel on the board: a short answer and prints to drag onto a day. */
export function AskPanelSample() {
  return (
    <ItineraryProvider trip="components-sample">
      <div className={`pl-sample-box ${handFont.variable}`} style={{ display: "flex", justifyContent: "flex-end", background: "#f8f9fa" }}>
        <AskPanel
          inline
          onClose={() => {}}
          ask={{
            question: "Where should we eat near Ribeira?",
            answer: "Stay by the river for lunch: grilled sardines at a tasca, then cross to Gaia for port in a cellar. Book Cantinho do Avillez for dinner.",
            places: [
              { name: "Francesinha", subject: "Francesinha", note: "the city's sandwich", kind: "food" },
              { name: "Port wine cellars", subject: "Port wine", note: "across the bridge", kind: "place" },
              { name: "Mercado do Bolhão", subject: "Mercado do Bolhão", note: "lunch at the stalls", kind: "food" },
              { name: "Dom Luís I Bridge", subject: "Dom Luís I Bridge", note: "walk the top deck", kind: "place" },
            ],
          }}
        />
      </div>
    </ItineraryProvider>
  );
}

/** The latest-page arrow: as it shows on the right edge, and while pages are still arriving. */
export function LatestArrowSample() {
  return (
    <div className="pl-sample-box pl-sample-row" style={{ alignItems: "center", gap: 40 }}>
      <LatestArrowButton shown arriving={false} inline />
      <LatestArrowButton shown arriving inline />
    </div>
  );
}

/** The loading state: your message written out, with trip sketches on the breeze around it. */
export function LoadingSample() {
  const [run, setRun] = useState(0);
  const text = "Somewhere to chill by the beach";
  return (
    <div className={`pl-steps-sample ${handFont.variable}`}>
      <div className="pl-sample-box pl-loading-sample" key={run}>
        <Breeze prompt={text} />
        <p className="pl-loading-sample__text">
          {[...text].map((ch, i) => (
            <span key={i} className="pl-loading-sample__letter" style={{ ["--i" as string]: i }}>
              {ch}
            </span>
          ))}
        </p>
      </div>
      <p className="pl-steps-sample__sent">
        <button type="button" className="pl-save" onClick={() => setRun((n) => n + 1)}>
          Replay
        </button>
      </p>
      <BreezeSheet />
    </div>
  );
}
