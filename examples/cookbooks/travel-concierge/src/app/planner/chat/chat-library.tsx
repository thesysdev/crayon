"use client";

import { ArrowRight, Footprints, MapPin, TramFront } from "lucide-react";
import { createContext, type CSSProperties, Fragment, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { FollowUpCards } from "../home";
import { type ItineraryItem, SaveHeart, useItinerary } from "../itinerary";
import { daysOf, placesIn, TripBridge } from "../itinerary-spread";
import { type HotelData, list, Marked, propsOf, SheetOpener, useHotels, usePhoto } from "../library";
import { MiniMap, type Point, TileMap, travel, useGeocode } from "../map";
import { Price, readTraveller, travellerLine } from "../money";
import { iconFor } from "../place-icon";
import { Chip } from "../steps";
import { ChatDates, windowsOf } from "./chat-dates";
import { type ChatDish, type ChatItem, ChatChecklist, ChatDishes, type ChatPick, ChatPicks, ChatPrice, ChatQuestion, ChatRoute, type ChatSide, ChatVersus, type RouteStop } from "./chat-pieces";
import { buildChatLibrary } from "./chat-schema";
import "./chat.css";

// The Chat tab's pieces: chat-sized variants of the journal's, composed from the same parts
// (usePhoto and the heart, Price in two currencies, the maps, the follow-up cards, the board's
// itinerary) without changing any of them. Every block sits in one centred column.

/** What a reply knows about its conversation: `send` posts a message (only on the newest reply,
 *  and absent in /components); `turn` names the reply, so an itinerary change runs once;
 *  `programs` are the chat's earlier replies, whose places can seed a first plan; and `answer` is
 *  the message that followed this reply, so a Question, Picks or Dates shows what was chosen. */
export const ChatTurn = createContext<{ send?: (text: string) => void; turn?: string; programs?: string[]; answer?: string }>({});

const coral = "#ff5364";

/* ---------- Type ---------- */

/** A photo set into a line of type like a word: the journal's inline photo, sized for chat. */
function InlinePhoto({ subject }: { subject: string }) {
  const photo = usePhoto(subject);
  const open = useContext(SheetOpener);
  return (
    <span
      className={`pl-chat-inline${photo === undefined ? " is-loading" : ""}`}
      role={open ? "button" : undefined}
      tabIndex={open ? 0 : undefined}
      aria-label={subject}
      onClick={open ? () => open({ subject }) : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt={subject} draggable={false} /> : null}
    </span>
  );
}

/** Words with [Subject] photos set into them and one hand mark. */
export function Line({ text }: { text?: string }) {
  return (
    <>
      {(text ?? "").split(/(\[[^\]]+\])/).map((part, i) =>
        /^\[.+\]$/.test(part) ? <InlinePhoto key={i} subject={part.slice(1, -1)} /> : <Marked key={i} text={part.replace(/\[[^\]]*$/, "")} stroke={coral} fill="#FFE3A1" />,
      )}
    </>
  );
}

/* ---------- Prints and places ---------- */

function useOpenPlace(subject?: string, name?: string) {
  const open = useContext(SheetOpener);
  if (!open || !subject) return {};
  const go = () => open({ subject, name });
  return {
    role: "button",
    tabIndex: 0,
    onClick: go,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    },
  };
}

/** A portrait print with its heart: the photo of a real place or dish. */
export function ChatPrint({ subject, name, food, className }: { subject?: string; name?: string; food?: boolean; className?: string }) {
  const photo = usePhoto(subject);
  return (
    <span className={`pl-chat-photo${photo === undefined ? " is-loading" : ""}${className ? ` ${className}` : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo.url} alt={name ?? subject ?? ""} draggable={false} /> : null}
      {subject && photo ? <SaveHeart item={{ subject, name: name ?? subject, photo: photo.url, kind: food ? "food" : "place" }} /> : null}
    </span>
  );
}

type PrintProps = { subject: string; caption?: string; note?: string };
type PlaceProps = { name: string; subject: string; about?: string; area?: string; kind?: "place" | "food" };

function PrintCard({ print, i }: { print: Partial<PrintProps>; i: number }) {
  const open = useOpenPlace(print.subject, print.caption);
  return (
    <figure className="pl-chat-print" style={{ ["--tilt" as string]: `${[-1.5, 1, -0.5, 1.5][i % 4]}deg` }} {...open}>
      <ChatPrint subject={print.subject} name={print.caption} />
      {print.caption ? <figcaption>{print.caption}</figcaption> : null}
      {print.note ? <span className="hj-pen__text pl-chat-print__note">{print.note}</span> : null}
    </figure>
  );
}

function PlaceCard({ place }: { place: Partial<PlaceProps> }) {
  const open = useOpenPlace(place.subject, place.name);
  return (
    <li className="pl-chat-place" {...open}>
      <ChatPrint subject={place.subject} name={place.name} food={place.kind === "food"} />
      <span className="pl-chat-place__words">
        <span className="pl-chat-place__name">{place.name}</span>
        {place.area ? (
          <span className="pl-chat-place__area">
            <MapPin aria-hidden />
            {place.area}
          </span>
        ) : null}
        {place.about ? <span className="pl-chat-place__about">{place.about}</span> : null}
      </span>
    </li>
  );
}

/* ---------- Hotels ---------- */

/** A trivago hotel as a chat card: the photo with its heart, the name, the rating and area, the
 *  price in the traveller's money and the local one, and the red Book pill. */
export function ChatHotel({ hotel, checkIn, checkOut }: { hotel: HotelData; checkIn?: string; checkOut?: string }) {
  const open = useContext(SheetOpener);
  const go = open ? () => open({ subject: `hotel:${hotel.name}`, name: hotel.name, hotel: { ...hotel, checkIn, checkOut } }) : undefined;
  return (
    <li
      className="pl-chat-hotel"
      role={go ? "button" : undefined}
      tabIndex={go ? 0 : undefined}
      onClick={go}
      onKeyDown={(e) => go && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go())}
    >
      <span className="pl-chat-photo pl-chat-hotel__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hotel.photo ? <img src={hotel.photo} alt="" draggable={false} /> : null}
        <SaveHeart
          item={{
            name: hotel.name,
            photo: hotel.photo,
            place: hotel.location,
            url: hotel.url,
            price: hotel.price,
            kind: "stay",
            rating: hotel.rating,
            reviews: hotel.reviews,
            stars: hotel.stars,
            amenities: hotel.amenities,
            site: hotel.site,
            total: hotel.total,
          }}
        />
      </span>
      <span className="pl-chat-hotel__name">{hotel.name}</span>
      {hotel.rating || hotel.location ? (
        <span className="pl-chat-hotel__where">{[hotel.rating && `Rated ${hotel.rating}`, hotel.location].filter(Boolean).join(" · ")}</span>
      ) : null}
      <span className="pl-chat-hotel__foot">
        <Price price={hotel.price} suffix="a night" />
        <a className="pl-chat-book" href={hotel.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          Book{hotel.site ? ` on ${hotel.site.split(/[,;]/)[0]}` : ""}
        </a>
      </span>
    </li>
  );
}

/* ---------- Maps ---------- */

const mins = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim());

/** A walk or a day's stops on the map, numbered, with the walk or ride between each beneath it. */
export function ChatMap({ title, places, near }: { title?: string; places: string[]; near?: string }) {
  const points = useGeocode(places, near);
  const shown = points ?? [];
  let n = 0;
  let last: Point | undefined;
  return (
    <section className="pl-chat-map">
      {title ? <h3 className="pl-chat-heading">{title}</h3> : null}
      <TileMap points={shown} finding={!points} route className="pl-chat-map__map" />
      <ol className="pl-chat-map__stops">
        {places.map((name, i) => {
          const p = shown.find((q) => q.name === name);
          const leg = p && last ? travel(last, p) : null;
          if (p) {
            n += 1;
            last = p;
          }
          return (
            <li key={`${name}-${i}`}>
              {leg ? (
                <span className="pl-chat-map__leg">
                  {leg.walk ? <Footprints aria-hidden /> : <TramFront aria-hidden />}
                  {mins(leg.minutes)}
                </span>
              ) : null}
              <span className="pl-chat-map__stop">
                <span className="pl-chat-map__num">{p ? n : ""}</span>
                {name}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Where one place is: the sheet's mini map, measured from the stay the traveller saved. */
function Spot({ props }: { props: { name?: string; near?: string } }) {
  const bridge = useContext(TripBridge);
  const stays = (useItinerary()?.items ?? []).filter((i) => i.kind === "stay").sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));
  if (!props.name) return null;
  const stay = stays.find((s) => s.name !== props.name)?.name;
  return (
    <div className="pl-chat-spot">
      <MiniMap name={props.name} near={props.near ?? bridge?.place} stay={stay} />
    </div>
  );
}

/* ---------- The itinerary, inline ---------- */

/** The board's days in order (stays apart), as the chat shows them. */
function daysIn(items: ItineraryItem[]) {
  const days = new Map<string, ItineraryItem[]>();
  for (const item of items) if (item.kind !== "stay" && item.day) days.set(item.day, [...(days.get(item.day) ?? []), item]);
  return [...days].map(([title, list]) => ({ title, items: list }));
}

/** The trip's itinerary in the conversation: each day with its small prints, the agent's note on
 *  what changed, and the stack card that opens the Itinerary tab. */
export function ChatItineraryCard({
  items,
  title,
  place,
  working,
  note,
  onOpen,
}: {
  items: ItineraryItem[];
  title?: string;
  place?: string;
  /** The itinerary agent is changing the plan. */
  working?: boolean;
  /** What changed, in the planner's words. */
  note?: string;
  onOpen?: () => void;
}) {
  const days = daysIn(items);
  const loose = items.filter((i) => !i.day && i.kind !== "stay");
  const stays = items.filter((i) => i.kind === "stay");
  return (
    <section className={`pl-chat-itin${working ? " is-working" : ""}`} aria-busy={working || undefined}>
      <header className="pl-chat-itin__head">
        <h3 className="pl-chat-heading">{title || "Your plan, day by day"}</h3>
        {working ? (
          <span className="hj-pen__text pl-chat-itin__note is-working">rearranging your days…</span>
        ) : note ? (
          <span className="hj-pen__text pl-chat-itin__note">{note}</span>
        ) : null}
      </header>
      {days.length ? (
        <ol className="pl-chat-itin__days">
          {days.slice(0, 6).map((day) => (
            <li key={day.title} className="pl-chat-itin__day">
              <h4>{day.title}</h4>
              <ul>
                {day.items.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <span className="pl-chat-itin__thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.photo ? <img src={item.photo} alt="" draggable={false} /> : null}
                    </span>
                    <span className="pl-chat-itin__name">{item.name}</span>
                    {item.time ? <span className="pl-chat-itin__time">{item.time}</span> : null}
                  </li>
                ))}
                {day.items.length > 5 ? <li className="pl-chat-itin__more">and {day.items.length - 5} more</li> : null}
              </ul>
            </li>
          ))}
          {days.length > 6 ? <li className="pl-chat-itin__more">and {days.length - 6} more days on the board</li> : null}
        </ol>
      ) : working ? (
        <ol className="pl-chat-itin__days" aria-hidden>
          {[0, 1, 2].map((d) => (
            <li key={d} className="pl-chat-itin__day is-waiting">
              <h4 />
              <ul>
                {[0, 1, 2].map((k) => (
                  <li key={k}>
                    <span className="pl-chat-itin__thumb" />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pl-chat-itin__empty">
          {loose.length ? `${loose.length} saved place${loose.length === 1 ? "" : "s"}, no days yet.` : "Nothing on the board yet. Tap a heart on any photo to start one."}
        </p>
      )}
      {days.length && (loose.length || stays.length) ? (
        <p className="pl-chat-itin__extra">
          {[stays.length && `${stays.length} planned hotel${stays.length === 1 ? "" : "s"}`, loose.length && `${loose.length} in Favourites`].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {/* The journal's Open itinerary card: the trip's prints fanned behind it. */}
      <button type="button" className="hj-itin__stack pl-chat-itin__stack" onClick={onOpen} disabled={!onOpen}>
        <span className="hj-itin__fan" aria-hidden>
          {items
            .filter((i) => i.photo)
            .slice(0, 3)
            .map((i, k) => (
              <span key={i.id} className="hj-itin__print" style={{ ["--k" as string]: k }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.photo} alt="" draggable={false} />
              </span>
            ))}
        </span>
        <span className="hj-itin__top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hj-itin__icon" src={`/icons-3d/${iconFor(place)}-pixar.webp`} alt="" draggable={false} />
          <span className="hj-itin__label">
            <span className="hj-itin__place">{place || "Your trip"}</span>
            <span className="hj-itin__action">{working ? "Arranging your days…" : "Open itinerary"}</span>
          </span>
          <span className="hj-itin__go" aria-hidden>
            <ArrowRight strokeWidth={2} />
          </span>
        </span>
      </button>
    </section>
  );
}

/** Plan: the board as it stands. */
function Plan({ props }: { props: { title?: string } }) {
  const itinerary = useItinerary();
  const bridge = useContext(TripBridge);
  return <ChatItineraryCard items={itinerary?.items ?? []} title={props.title} place={bridge?.place} onOpen={bridge?.openBoard} />;
}

/** The places a chat reply names (place cards and prints), for a first plan. */
function chatPlaces(programs: string[]) {
  const str = String.raw`"((?:[^"\\]|\\.)*)"`;
  const found: { name: string; subject: string; kind: "place" | "food" }[] = [];
  for (const program of programs) {
    for (const m of program.matchAll(new RegExp(String.raw`\bPlace\(\s*${str}\s*,\s*${str}`, "g")))
      found.push({ name: m[1], subject: m[2], kind: /"food"\s*\)\s*$/.test(m[0]) ? "food" : "place" });
    for (const m of program.matchAll(new RegExp(String.raw`\bPrint\(\s*${str}`, "g"))) found.push({ name: m[1], subject: m[1], kind: "place" });
  }
  return found;
}

const changeKey = (trip: string, turn: string) => `planner:chat-itin:${trip}:${turn}`;

/** Replan: hands the change to the itinerary agent once (the board comes from the browser, as
 *  everywhere), puts the new plan on the board, and shows it here with what changed. */
function Replan({ props }: { props: { request?: string; title?: string } }) {
  const itinerary = useItinerary();
  const bridge = useContext(TripBridge);
  const { send, turn, programs } = useContext(ChatTurn);
  const key = itinerary && turn ? changeKey(itinerary.trip, turn) : "";
  const [note, setNote] = useState<string | undefined>(() => {
    try {
      return (key && localStorage.getItem(key)) || undefined;
    } catch {
      return undefined;
    }
  });
  const [working, setWorking] = useState(false);
  const started = useRef(false);
  const live = !!send && !!itinerary && !!props.request && !!key;
  useEffect(() => {
    if (!live || started.current || !itinerary || !props.request) return;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, " ");
    } catch {}
    started.current = true;
    setWorking(true);
    const prompts = bridge?.prompts ?? [];
    // A first plan gathers the trip's places from Explore and from this chat; a change to an
    // existing plan works on the board as it is.
    const planned = itinerary.items.some((i) => i.day);
    const seed = planned ? [] : [...placesIn(bridge?.programs ?? []), ...chatPlaces(programs ?? [])];
    fetch(`/api/planner/itinerary/agent?trip=${encodeURIComponent(itinerary.trip)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: props.request,
        dates: bridge?.dates,
        days: daysOf([...prompts, props.request], bridge?.dates),
        context: prompts.join(" / "),
        seed: seed.slice(0, 16),
        items: itinerary.items,
        traveller: travellerLine(readTraveller()),
      }),
    })
      .then((r) => r.text())
      .then((text) => {
        const body = JSON.parse(text) as { items?: ItineraryItem[]; message?: string; error?: string };
        if (!body.items) throw new Error(body.error);
        itinerary.set(body.items);
        const said = (body.message || "done. it's on your board.").replace(/\.$/, "").toLowerCase();
        setNote(said);
        try {
          localStorage.setItem(key, said);
        } catch {}
      })
      .catch(() => {
        setNote("that change didn't go through. ask me again?");
        try {
          localStorage.removeItem(key);
        } catch {}
      })
      .finally(() => setWorking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);
  return (
    <ChatItineraryCard
      items={itinerary?.items ?? []}
      title={props.title}
      place={bridge?.place}
      working={working}
      note={note?.trim() || undefined}
      onOpen={bridge?.openBoard}
    />
  );
}

/* ---------- The library ---------- */

type OptionProps = { label: string; icon?: string; kind?: string };

export const chatLibrary = buildChatLibrary({
  Print: () => null,
  Place: () => null,
  Hotel: () => null,
  Option: () => null,
  When: () => null,
  Pick: () => null,
  Stop: () => null,
  Dish: () => null,
  Side: () => null,
  Item: () => null,

  Headline: ({ props }: { props: { text?: string } }) => (
    <h2 className="pl-chat-headline">
      <Line text={props.text} />
    </h2>
  ),
  Pull: ({ props }: { props: { text?: string; note?: string } }) => (
    <div className="pl-chat-pull">
      <p>
        <Line text={props.text} />
      </p>
      {props.note ? <span className="hj-pen__text pl-chat-pull__note">{props.note}</span> : null}
    </div>
  ),
  Heading: ({ props }: { props: { text?: string } }) => <h3 className="pl-chat-heading">{props.text}</h3>,
  Text: ({ props }: { props: { text?: string } }) => <p className="pl-chat-text">{props.text}</p>,

  Prints: ({ props }: { props: { prints?: unknown[] } }) => {
    const prints = list(props.prints).slice(0, 4).map((n) => propsOf<PrintProps>(n));
    return (
      <div className="pl-chat-prints" style={{ ["--n" as string]: Math.max(prints.length, 2) } as CSSProperties}>
        {prints.map((p, i) => (
          <PrintCard key={i} print={p} i={i} />
        ))}
      </div>
    );
  },
  Places: ({ props }: { props: { places?: unknown[] } }) => (
    <ul className="pl-chat-places">
      {list(props.places)
        .slice(0, 4)
        .map((n, i) => (
          <PlaceCard key={i} place={propsOf<PlaceProps>(n)} />
        ))}
    </ul>
  ),
  Hotels: function Hotels({ props }: { props: { hotels?: unknown[]; checkIn?: string; checkOut?: string } }) {
    const hotels = useHotels(props.hotels).slice(0, 4);
    if (!hotels.length) return null;
    return (
      <ul className="pl-chat-hotels">
        {hotels.map((h) => (
          <ChatHotel key={h.url} hotel={h} checkIn={props.checkIn} checkOut={props.checkOut} />
        ))}
      </ul>
    );
  },
  Map: function MapBlock({ props }: { props: { title?: string; places?: string[]; near?: string } }) {
    const bridge = useContext(TripBridge);
    const places = (props.places ?? []).filter((p): p is string => typeof p === "string" && !!p.trim()).slice(0, 7);
    return <ChatMap title={props.title} places={places} near={props.near ?? bridge?.place} />;
  },
  Spot,
  Choices: function Choices({ props }: { props: { question?: string; options?: unknown[] } }) {
    const { send } = useContext(ChatTurn);
    const options = list(props.options)
      .map((n) => propsOf<OptionProps>(n))
      .filter((o) => o.label);
    return (
      <div className="pl-chat-choices">
        <h3 className="pl-chat-heading">{props.question}</h3>
        <ul className="hj-chips">
          {options.map((o, i) => (
            <li key={i}>
              <Chip label={o.label!} onClick={send ? () => send(o.label!) : undefined} />
            </li>
          ))}
        </ul>
      </div>
    );
  },
  Question: function Question({ props }: { props: { question?: string; options?: unknown[]; skip?: string } }) {
    const { send, answer } = useContext(ChatTurn);
    const options = list(props.options)
      .map((n) => propsOf<OptionProps>(n))
      .filter((o): o is OptionProps => !!o.label)
      .slice(0, 5);
    return <ChatQuestion question={props.question} options={options} skip={props.skip} send={send} answer={answer} />;
  },
  Picks: function Picks({ props }: { props: { title?: string; picks?: unknown[] } }) {
    const { send, answer } = useContext(ChatTurn);
    const picks = list(props.picks)
      .map((n) => propsOf<ChatPick>(n))
      .filter((p): p is ChatPick => !!p.name && !!p.subject)
      .slice(0, 5);
    return <ChatPicks title={props.title} picks={picks} send={send} answer={answer} />;
  },
  Dates: function Dates({ props }: { props: { title?: string; suggestions?: unknown[]; nights?: number; from?: string } }) {
    const { send, answer } = useContext(ChatTurn);
    return <ChatDates title={props.title} suggestions={windowsOf(props.suggestions)} nights={props.nights} from={props.from} send={send} answer={answer} />;
  },
  Route: ({ props }: { props: { title?: string; stops?: unknown[] } }) => (
    <ChatRoute title={props.title} stops={list(props.stops).slice(0, 4).map((n) => propsOf<RouteStop>(n))} />
  ),
  Dishes: ({ props }: { props: { title?: string; dishes?: unknown[]; note?: string } }) => (
    <ChatDishes title={props.title} note={props.note} dishes={list(props.dishes).map((n) => propsOf<ChatDish>(n))} />
  ),
  Versus: ({ props }: { props: { a?: unknown; b?: unknown; verdict?: string } }) => (
    <ChatVersus a={propsOf<ChatSide>(props.a)} b={propsOf<ChatSide>(props.b)} verdict={props.verdict} />
  ),
  Price: ({ props }: { props: { price?: string; item?: string; subject?: string; note?: string } }) => (
    <ChatPrice price={props.price} item={props.item} subject={props.subject} note={props.note} />
  ),
  Checklist: ({ props }: { props: { title?: string; items?: unknown[] } }) => (
    <ChatChecklist title={props.title} items={list(props.items).map((n) => propsOf<ChatItem>(n))} />
  ),
  Plan,
  Replan,
  FollowUps: function FollowUps({ props }: { props: { options?: unknown[] } }) {
    const { send } = useContext(ChatTurn);
    // Only the newest reply offers its follow-ups; older ones have been answered.
    if (!send) return null;
    const items = list(props.options)
      .map((n) => propsOf<OptionProps>(n))
      .filter((o): o is OptionProps => !!o.label)
      .slice(0, 4);
    return (
      <div className="pl-chat-followups">
        <FollowUpCards items={items} onPick={send} />
      </div>
    );
  },

  Chat: ({ props, renderNode }: { props: { blocks?: unknown[] }; renderNode: (node: unknown) => ReactNode }) => (
    <div className="pl-chat-reply__blocks">
      {list(props.blocks).map((node, i) => (
        <Fragment key={i}>{renderNode(node)}</Fragment>
      ))}
    </div>
  ),
} as never);

/** The place a reply sets on its root, if any: Chat([…], "Kyoto"). */
export const placeOf = (program: string) => program.match(/^\s*root\s*=\s*Chat\(\s*\[[^\]]*\]\s*,\s*"([^"]+)"/m)?.[1];
