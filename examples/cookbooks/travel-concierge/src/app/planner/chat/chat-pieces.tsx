"use client";

import { ArrowRight, Bus, Car, Check, Plane, Ship, TrainFront } from "lucide-react";
import { Fragment, useContext, useState } from "react";
import { DrawablyCircle, DrawablyHighlight } from "../../horizontal-journal/drawably/react.js";
import { SaveHeart } from "../itinerary";
import { type FollowUp, FollowUpCards } from "../home";
import { HandArrow, Marked, SheetOpener, usePhoto } from "../library";
import { ChatPrint } from "./chat-library";
import "./chat-pieces.css";

// The rest of Explore's spreads, redrawn for the Chat tab's column: a Question with options to
// tap, a Route from place to place, Picks to choose where to go, three Dishes, Versus, a Price
// and a Checklist. Each is made from
// the chat's own parts (portrait prints with their hearts, Timeless type, pencil notes), and
// none of the journal's spreads change.

const coral = "#ff5364";
const amber = "#FFE3A1";

/** A print opens its place's sheet, as everywhere in the chat. */
function useOpen(subject?: string, name?: string) {
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

/* ---------- Question ---------- */

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** For a traveller who isn't sure yet: one question, its answers as the follow-up cards with
 *  their 3D icons, and a way to skip in pencil. A tap sends the answer as their next message.
 *  Once answered, only the answer they gave stays, as a card. */
export function ChatQuestion({
  question,
  options,
  skip,
  send,
  answer,
}: {
  question?: string;
  options: FollowUp[];
  skip?: string;
  send?: (text: string) => void;
  answer?: string;
}) {
  const given = answer ? options.find((o) => same(o.label, answer)) : undefined;
  return (
    <section className={`pl-chat-question${send ? "" : " is-answered"}`}>
      {question ? <h3 className="pl-chat-heading">{question}</h3> : null}
      {send || !answer ? (
        <div className="pl-chat-followups">
          <FollowUpCards items={options} onPick={send} />
        </div>
      ) : given ? (
        <div className="pl-chat-followups">
          <FollowUpCards items={[given]} />
        </div>
      ) : (
        <p className="hj-pen__text pl-chat-question__said">{answer.toLowerCase()}</p>
      )}
      {skip && send ? (
        <button type="button" className="pl-chat-question__skip" onClick={() => send(skip)}>
          <span className="hj-pen__text">{skip.toLowerCase()}</span>
          <HandArrow style="swoop" dir="right" size={2.2} color={coral} />
        </button>
      ) : null}
    </section>
  );
}

/* ---------- Route ---------- */

export type RouteStop = { name: string; subject: string; leg?: string };

/** How a leg goes, from its words: a train, a flight, a ferry, a bus or a drive. */
function LegIcon({ leg }: { leg?: string }) {
  const t = (leg ?? "").toLowerCase();
  const Icon = /fl(y|ight)|plane/.test(t) ? Plane : /ferry|boat/.test(t) ? Ship : /bus|coach/.test(t) ? Bus : /driv|car\b|road/.test(t) ? Car : TrainFront;
  return <Icon aria-hidden strokeWidth={1.75} />;
}

function RouteStopPrint({ stop, i }: { stop: Partial<RouteStop>; i: number }) {
  const open = useOpen(stop.subject, stop.name);
  return (
    <figure className="pl-chat-route__stop" style={{ ["--tilt" as string]: `${[-1.2, 0.9, -0.5, 1.3][i % 4]}deg` }} {...open}>
      <ChatPrint subject={stop.subject} name={stop.name} />
      <figcaption>{stop.name}</figcaption>
    </figure>
  );
}

/** From place to place: the stops as prints in travel order, and between each the way there,
 *  with its icon, in pencil under a hand-drawn arrow. */
export function ChatRoute({ title, stops }: { title?: string; stops: Partial<RouteStop>[] }) {
  return (
    <section className="pl-chat-route">
      {title ? (
        <h3 className="pl-chat-heading">
          <Marked text={title} stroke={coral} />
        </h3>
      ) : null}
      <div className="pl-chat-route__row" style={{ ["--n" as string]: Math.max(stops.length, 2) }}>
        {stops.map((s, i) => (
          <Fragment key={`${s.name}-${i}`}>
            <RouteStopPrint stop={s} i={i} />
            {i < stops.length - 1 ? (
              <div className="pl-chat-route__leg">
                <LegIcon leg={s.leg} />
                {s.leg ? <span className="hj-pen__text">{s.leg}</span> : null}
                <span className="pl-chat-route__arrow">
                  <HandArrow style="dash" dir="right" size={3.2} color={coral} />
                </span>
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

/* ---------- Picks ---------- */

export type ChatPick = { name: string; subject: string; note?: string };

const joined = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

function PickPrint({ pick, picked, live, onToggle, i }: { pick: ChatPick; picked: boolean; live: boolean; onToggle: () => void; i: number }) {
  const photo = usePhoto(pick.subject);
  return (
    <button
      type="button"
      className={`pl-chat-pick${picked ? " is-picked" : ""}`}
      disabled={!live}
      aria-pressed={picked}
      onClick={onToggle}
      style={{ ["--tilt" as string]: `${[-1.2, 0.8, -0.4, 1.1, -0.8][i % 5]}deg` }}
    >
      <span className={`pl-chat-photo pl-chat-pick__photo${photo === undefined ? " is-loading" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo.url} alt={pick.name} draggable={false} /> : null}
        <span className="pl-chat-pick__check" aria-hidden>
          <Check strokeWidth={3} />
        </span>
        {photo ? <SaveHeart item={{ subject: pick.subject, name: pick.name, photo: photo.url, description: pick.note, kind: "place" }} /> : null}
      </span>
      <span className="pl-chat-pick__name">{pick.name}</span>
      {pick.note ? <span className="hj-pen__text pl-chat-pick__note">{pick.note}</span> : null}
    </button>
  );
}

/** Where to go: destinations as prints you tap to pick, one or a few, and the button that asks
 *  for the plan ("Plan Ubud and Goa"). Once answered, the places that were picked stay marked. */
export function ChatPicks({ title, picks, send, answer }: { title?: string; picks: ChatPick[]; send?: (text: string) => void; answer?: string }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const shown = answer ? picks.filter((p) => answer.toLowerCase().includes(p.name.toLowerCase())).map((p) => p.name) : chosen;
  const toggle = (name: string) => setChosen((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]));
  return (
    <section className="pl-chat-picks">
      <header className="pl-chat-picks__head">
        {title ? (
          <h3 className="pl-chat-heading">
            <Marked text={title} stroke={coral} />
          </h3>
        ) : null}
        {send ? <span className="hj-pen__text pl-chat-picks__hint">pick one, or a few</span> : null}
      </header>
      <div className="pl-chat-picks__row" style={{ ["--n" as string]: Math.max(picks.length, 3) }}>
        {picks.map((p, i) => (
          <PickPrint key={p.name} pick={p} i={i} picked={shown.includes(p.name)} live={!!send} onToggle={() => toggle(p.name)} />
        ))}
      </div>
      {send ? (
        <button
          type="button"
          className="pl-chat-picks__go"
          disabled={!chosen.length}
          onClick={() => send(`Plan ${joined(picks.filter((p) => chosen.includes(p.name)).map((p) => p.name))}`)}
        >
          <span>{chosen.length ? `Plan ${joined(chosen)}` : "Pick a place to plan"}</span>
          {chosen.length ? <ArrowRight strokeWidth={2} aria-hidden /> : null}
        </button>
      ) : null}
    </section>
  );
}

/* ---------- Dishes ---------- */

export type ChatDish = { name: string; subject: string; price?: string; circled?: boolean };

function DishPrint({ dish, i }: { dish: Partial<ChatDish>; i: number }) {
  const open = useOpen(dish.subject, dish.name);
  return (
    <figure className="pl-chat-dish" style={{ ["--tilt" as string]: `${[-1.2, 0.9, -0.5][i % 3]}deg` }} {...open}>
      <ChatPrint subject={dish.subject} name={dish.name} food />
      <figcaption>
        <span className="pl-chat-dish__name">{dish.name}</span>
        {dish.price ? (
          dish.circled ? (
            <DrawablyCircle stroke={coral} width={2.5}>
              <span className="pl-chat-dish__price">{dish.price}</span>
            </DrawablyCircle>
          ) : (
            <span className="pl-chat-dish__price">{dish.price}</span>
          )
        ) : null}
      </figcaption>
    </figure>
  );
}

/** Three dishes to try, as prints, with their local prices; the pick of them circled in pen. */
export function ChatDishes({ title, dishes, note }: { title?: string; dishes: Partial<ChatDish>[]; note?: string }) {
  return (
    <section className="pl-chat-dishes">
      {title || note ? (
        <header className="pl-chat-dishes__head">
          {title ? (
            <h3 className="pl-chat-heading">
              <Marked text={title} stroke={coral} />
            </h3>
          ) : null}
          {note ? <span className="hj-pen__text pl-chat-dishes__note">{note}</span> : null}
        </header>
      ) : null}
      <div className="pl-chat-dishes__row">
        {dishes.slice(0, 3).map((d, i) => (
          <DishPrint key={`${d.name}-${i}`} dish={d} i={i} />
        ))}
      </div>
    </section>
  );
}

/* ---------- Versus ---------- */

export type ChatSide = { label: string; subject: string };

function SidePrint({ side, i }: { side: Partial<ChatSide>; i: number }) {
  const open = useOpen(side.subject, side.label);
  return (
    <figure className="pl-chat-versus__side" style={{ ["--tilt" as string]: i ? "1.4deg" : "-1.6deg" }} {...open}>
      <ChatPrint subject={side.subject} name={side.label} />
      <figcaption>{side.label}</figcaption>
    </figure>
  );
}

/** Two places or things head to head, a word between them, and the verdict in pencil. */
export function ChatVersus({ word, a, b, verdict }: { word?: string; a: Partial<ChatSide>; b: Partial<ChatSide>; verdict?: string }) {
  return (
    <section className="pl-chat-versus">
      <div className="pl-chat-versus__pair">
        <SidePrint side={a} i={0} />
        <span className="pl-chat-versus__word">{word || "or"}</span>
        <SidePrint side={b} i={1} />
      </div>
      {verdict ? <p className="hj-pen__text pl-chat-versus__verdict">{verdict}</p> : null}
    </section>
  );
}

/* ---------- Price ---------- */

/** What one thing costs there: its print, the local price huge and circled, what it buys, and a
 *  verdict in pencil. */
export function ChatPrice({ price, item, subject, note }: { price?: string; item?: string; subject?: string; note?: string }) {
  const open = useOpen(subject, item);
  return (
    <section className="pl-chat-price">
      <figure className="pl-chat-price__print" {...open}>
        <ChatPrint subject={subject} name={item} food />
      </figure>
      <div className="pl-chat-price__words">
        {price ? (
          <DrawablyCircle stroke={coral} width={3}>
            <span className="pl-chat-price__amount">{price}</span>
          </DrawablyCircle>
        ) : null}
        {item ? <p className="pl-chat-price__item">{item}</p> : null}
        {note ? <span className="hj-pen__text pl-chat-price__note">{note}</span> : null}
      </div>
    </section>
  );
}

/* ---------- Checklist ---------- */

export type ChatItem = { text: string; subject: string; done?: boolean; aside?: string };

function ChecklistRow({ item }: { item: Partial<ChatItem> }) {
  const open = useOpen(item.subject, item.text);
  return (
    <li className="pl-chat-check__row" {...open}>
      <ChatPrint subject={item.subject} name={item.text} className="pl-chat-check__thumb" />
      <span className="pl-chat-check__text">{item.done && item.text ? <DrawablyHighlight fill={amber}>{item.text}</DrawablyHighlight> : item.text}</span>
      {item.aside ? <span className="hj-pen__text pl-chat-check__aside">{item.aside}</span> : null}
    </li>
  );
}

/** Things to do, in order, each beside a small print; the musts highlighted, asides in pencil. */
export function ChatChecklist({ title, items }: { title?: string; items: Partial<ChatItem>[] }) {
  return (
    <section className="pl-chat-check">
      {title ? (
        <h3 className="pl-chat-heading">
          <Marked text={title} stroke={coral} />
        </h3>
      ) : null}
      <ul className="pl-chat-check__list">
        {items.slice(0, 6).map((it, i) => (
          <ChecklistRow key={`${it.text}-${i}`} item={it} />
        ))}
      </ul>
    </section>
  );
}
