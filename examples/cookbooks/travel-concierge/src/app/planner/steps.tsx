"use client";

import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { HandArrow, list, Marked, penOnCanvas, propsOf, usePhoto } from "./library";
import { SaveHeart } from "./itinerary";
import "./steps.css";

// The steps that steer a conversation instead of answering it all at once: a Question that
// narrows the search, Picks to explore, Dates, and Next. Each is a panel like any spread, and a
// tap sends the traveller's choice as their next message, in their own words, so the thread
// stays a conversation. Only the newest entry is live; earlier steps show what was chosen.

type Hue = Parameters<typeof penOnCanvas>[0];
type Option = { label: string; note?: string };
type Pick = { name: string; subject: string; note?: string };

/** How a step answers: `send` posts a message (absent once answered, and in /components);
 *  `answer` is the message that followed this entry, so a past step can show the choice. */
export const Reply = createContext<{ send?: (text: string) => void; answer?: string }>({});

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Answers as chips: white, soft-shadowed, the traveller's words with a pen note. The chosen one
 *  turns red; the rest fade. */
function Options({ options, pen }: { options: Option[]; pen: string }) {
  const { send, answer } = useContext(Reply);
  return (
    <ul className="hj-chips">
      {options.map((o, i) => {
        const chosen = same(answer, o.label);
        return (
          <li key={i}>
            <Chip label={o.label} note={o.note} pen={pen} chosen={chosen} faded={!!answer && !chosen} onClick={send ? () => send(o.label) : undefined} />
          </li>
        );
      })}
    </ul>
  );
}

/** One chip. Shared by a Question's answers and the follow-ups on the "Where next?" page. */
export function Chip({
  label,
  note,
  pen = "#ff5364",
  chosen,
  faded,
  onClick,
}: {
  label: string;
  note?: string;
  pen?: string;
  chosen?: boolean;
  faded?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`hj-chip${chosen ? " is-chosen" : ""}${faded ? " is-faded" : ""}`}
      disabled={!onClick}
      onClick={onClick}
      style={{ ["--pen" as string]: pen }}
    >
      <span className="hj-chip__label">{label}</span>
      {note ? <span className="hj-pen__text hj-chip__note">{note}</span> : null}
    </button>
  );
}

/** A handwritten way out, with its arrow. */
function Skip({ label, pen }: { label: string; pen: string }) {
  const { send, answer } = useContext(Reply);
  return (
    <button
      type="button"
      className={`hj-skip${same(answer, label) ? " is-chosen" : ""}`}
      disabled={!send}
      onClick={() => send?.(label)}
      style={{ color: pen }}
    >
      <span className="hj-pen__text">{label.toLowerCase()}</span>
      <HandArrow style="swoop" dir="right" size={2.4} color={pen} />
    </button>
  );
}

/** The words of a choice, with the red disc that sends it at their right. */
function Go({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="hj-go" onClick={onClick} disabled={disabled}>
      <span className="hj-go__label">{label}</span>
      {/* At the right end; a right arrow, since this carries on with your choice rather than
          sending typed text. It appears once there is something to carry on with. */}
      <span className="hj-go__disc">
        <ArrowRight aria-hidden strokeWidth={2} />
      </span>
    </button>
  );
}

export function Question({ props }: { props: { question?: string; options?: unknown[]; skip?: string; color?: Hue } }) {
  const pen = penOnCanvas(props.color);
  const options = list(props.options).map((n) => propsOf<Option>(n)).filter((o): o is Option => !!o.label);
  return (
    <section className="hj-page hj-spread hj-question">
      <h2>{props.question}</h2>
      <Options options={options} pen={pen} />
      {props.skip ? <Skip label={props.skip} pen={pen} /> : null}
    </section>
  );
}

/** Next is not a page of its own: its follow-ups become the chips on the "Where next?" page
 *  that closes the journal (see followUps). */
export function Next() {
  return null;
}

/** The follow-ups an entry's Next offers, read from its program: Next("title", [a, b]) where each
 *  item is an Option("label", "note", "icon", "kind") written inline or as its own statement. */
export function followUps(program: string): { label: string; icon?: string; kind?: string }[] {
  const line = program.match(/^\s*\w+\s*=\s*Next\((.*)\)\s*$/m)?.[1];
  if (!line) return [];
  const items = line.slice(line.indexOf("[") + 1, line.lastIndexOf("]"));
  // An Option's arguments in order: string literals, with null for one left out.
  const args = (text: string) =>
    [...text.matchAll(/"((?:[^"\\]|\\.)*)"|\bnull\b/g)].map((m) => (m[1] === undefined ? undefined : m[1].replace(/\\"/g, '"')));
  const out: { label: string; icon?: string; kind?: string }[] = [];
  for (const [, inline, ref] of items.matchAll(/Option\(((?:[^)"]|"(?:[^"\\]|\\.)*")*)\)|\b([a-zA-Z_]\w*)\b/g)) {
    const text = inline ?? program.match(new RegExp(`^\\s*${ref}\\s*=\\s*Option\\((.*)\\)\\s*$`, "m"))?.[1];
    if (!text) continue;
    const [label, , icon, kind] = args(text);
    if (label) out.push({ label, icon: icon || undefined, kind: kind || undefined });
  }
  return out.slice(0, 4);
}

/** Book is not a page either: its hotels go on the closing page, above the follow-ups. */
export function Book() {
  return null;
}

export type Booking = { title: string; ids: string[]; checkIn: string; checkOut: string };

/** The stays an entry's Book offers, read from its program:
 *  Book("title", [Hotel("hotel1"), h2], "2026-11-06", "2026-11-10"), hotels inline or by name. */
export function bookingOf(program: string): Booking | null {
  const line = program.match(/^\s*\w+\s*=\s*Book\((.*)\)\s*$/m)?.[1];
  if (!line) return null;
  const open = line.indexOf("[");
  const close = line.lastIndexOf("]");
  if (open < 0 || close < open) return null;
  const strings = (text: string) => [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  const ids: string[] = [];
  for (const [, inline, ref] of line.slice(open + 1, close).matchAll(/Hotel\(\s*"([^"]+)"\s*\)|\b([a-zA-Z_]\w*)\b/g)) {
    const id = inline ?? program.match(new RegExp(`^\\s*${ref}\\s*=\\s*Hotel\\(\\s*"([^"]+)"`, "m"))?.[1];
    if (id) ids.push(id);
  }
  const [title = "Where to stay"] = strings(line.slice(0, open));
  const [checkIn = "", checkOut = ""] = strings(line.slice(close + 1));
  return ids.length ? { title, ids, checkIn, checkOut } : null;
}

/** One destination as a print you can pick up. */
function PickPrint({ pick, picked, onToggle, live, pen }: { pick: Pick; picked: boolean; onToggle: () => void; live: boolean; pen: string }) {
  const photo = usePhoto(pick.subject);
  return (
    <button type="button" className={`hj-pick${picked ? " is-picked" : ""}`} disabled={!live} onClick={onToggle} aria-pressed={picked}>
      <span className={`hj-pick__print${photo === undefined ? " is-loading" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo.url} alt={pick.name} draggable={false} /> : null}
        <span className="hj-pick__check" aria-hidden>
          <Check strokeWidth={3} />
        </span>
        {photo ? <SaveHeart item={{ subject: pick.subject, name: pick.name, photo: photo.url, description: pick.note, kind: "place" }} /> : null}
      </span>
      <span className="hj-pick__name">{pick.name}</span>
      {pick.note ? (
        <span className="hj-pen__text hj-pick__note" style={{ color: pen }}>
          {pick.note}
        </span>
      ) : null}
    </button>
  );
}

const joined = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

export function Picks({ props }: { props: { title?: string; picks?: unknown[]; color?: Hue } }) {
  const pen = penOnCanvas(props.color);
  const { send, answer } = useContext(Reply);
  const picks = list(props.picks)
    .map((n) => propsOf<Pick>(n))
    .filter((p): p is Pick => !!p.name)
    .slice(0, 5);
  // Once answered, the picks are the names the traveller's message mentions.
  const [chosen, setChosen] = useState<string[]>([]);
  const shown = answer ? picks.filter((p) => answer.toLowerCase().includes(p.name.toLowerCase())).map((p) => p.name) : chosen;
  const toggle = (name: string) => setChosen((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]));
  return (
    <section className="hj-page hj-spread hj-picks" style={{ ["--n" as string]: Math.max(picks.length, 3) }}>
      <header>
        <h2>
          <Marked text={props.title} stroke={pen} />
        </h2>
        <span className="hj-pen__text hj-picks__hint" style={{ color: pen }}>
          {answer ? "" : "pick one, or a few"}
        </span>
      </header>
      <div className="hj-picks__row">
        {picks.map((p) => (
          <PickPrint key={p.name} pick={p} picked={shown.includes(p.name)} onToggle={() => toggle(p.name)} live={!!send} pen={pen} />
        ))}
      </div>
      {send ? (
        <Go
          label={chosen.length ? `Plan ${joined(chosen)}` : "Pick a place to plan"}
          disabled={!chosen.length}
          onClick={() => send(`Plan ${joined(picks.filter((p) => chosen.includes(p.name)).map((p) => p.name))}`)}
        />
      ) : null}
    </section>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Dates: the agent's suggested windows as cards (label, dates, why), tapped to send, and a
 *  calendar pill at the end that opens the month calendar for a custom range. */
type When = { label: string; from: string; to: string; why?: string };
const dayOf = (iso: string) => new Date(`${iso}T12:00:00`);
const nightsOf = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);
const dayName = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const shortDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
const span = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth() ? `${a.getDate()} – ${shortDay(b)}` : `${shortDay(a)} – ${shortDay(b)}`;
const plan = (a: Date, b: Date) => {
  const n = nightsOf(a, b);
  return `Plan it for ${n} night${n === 1 ? "" : "s"}, ${dayName(a)} to ${dayName(b)} ${b.getFullYear()}`;
};

export function Dates({ props }: { props: { title?: string; suggestions?: unknown[]; nights?: number; from?: string; color?: Hue } }) {
  const { send, answer } = useContext(Reply);
  const suggestions = list(props.suggestions)
    .map((n) => propsOf<When>(n))
    .filter((w): w is When => !!w.label && /^\d{4}-\d{2}-\d{2}$/.test(w.from ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(w.to ?? "") && w.to! > w.from!)
    .slice(0, 4);
  const [custom, setCustom] = useState(false);
  const chosen = answer ? suggestions.find((w) => answer.includes(dayName(dayOf(w.from)))) : undefined;
  const calendar = custom || !suggestions.length || (!!answer && !chosen);
  return (
    <section className="hj-page hj-spread hj-dates">
      <h2>{props.title}</h2>
      {calendar ? (
        <DateCalendar props={props} onBack={suggestions.length && send ? () => setCustom(false) : undefined} />
      ) : (
        <div className="hj-when">
          {suggestions.map((w) => {
            const a = dayOf(w.from);
            const b = dayOf(w.to);
            const n = nightsOf(a, b);
            return (
              <button
                key={w.from + w.to}
                type="button"
                className={`hj-when__card${chosen === w ? " is-picked" : ""}`}
                disabled={!send}
                onClick={() => send?.(plan(a, b))}
              >
                <span className="hj-when__label">{w.label}</span>
                <span className="hj-when__dates">{span(a, b)}</span>
                <span className="hj-when__why">
                  {n} night{n === 1 ? "" : "s"}
                  {w.why ? `, ${w.why}` : ""}
                </span>
              </button>
            );
          })}
          {send ? (
            <button type="button" className="hj-when__custom" onClick={() => setCustom(true)}>
              <CalendarDays strokeWidth={1.75} aria-hidden />
              Pick your own dates
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** The month calendar: month pills, then the days. Tap the arrival day, then the day you leave;
 *  the button sends the range. */
function DateCalendar({ props, onBack }: { props: { nights?: number; from?: string }; onBack?: () => void }) {
  const { send, answer } = useContext(Reply);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    return { name: MONTHS[d.getMonth()], year: d.getFullYear(), index: d.getMonth() };
  });
  // Dates the traveller already gave (the agent passes them as `from`) pre-fill the calendar.
  const given = props.from ? dayOf(props.from) : null;
  const givenMonth = given ? months.findIndex((x) => x.index === given.getMonth() && x.year === given.getFullYear()) : -1;
  const [month, setMonth] = useState(Math.max(0, givenMonth));
  const [start, setStart] = useState<Date | null>(givenMonth >= 0 ? given : null);
  const [end, setEnd] = useState<Date | null>(
    givenMonth >= 0 && given && props.nights ? new Date(given.getFullYear(), given.getMonth(), given.getDate() + Math.round(props.nights)) : null,
  );
  const m = months[month];
  const first = new Date(m.year, m.index, 1);
  const picked = (name: string) => (answer ? answer.includes(name) : name === m.name);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  // First tap is the arrival; a later day is when you leave; an earlier one starts again.
  const tap = (d: Date) => {
    if (start && !end && d > start) setEnd(d);
    else {
      setStart(d);
      setEnd(null);
    }
  };
  const pickMonth = (i: number) => setMonth(i);
  // A month as weeks: always six rows, so the panel never changes height.
  const lead = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(m.year, m.index, i - lead + 1));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkOut = end;
  return (
    <>
      <div className="hj-dates__group">
        <div className="hj-dates__months" role="radiogroup" aria-label="Month">
          {months.map((x, i) => (
            <button
              key={x.name}
              type="button"
              role="radio"
              aria-checked={picked(x.name)}
              className={`hj-month${picked(x.name) ? " is-picked" : ""}`}
              disabled={!send}
              onClick={() => pickMonth(i)}
            >
              <span className="hj-month__name">{x.name.slice(0, 3)}</span>
              {x.index === 0 ? <span className="hj-month__year">{x.year}</span> : null}
            </button>
          ))}
        </div>
      </div>
      <div className="hj-cal" role="grid" aria-label={`${m.name} ${m.year}`}>
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
          <span key={i} className="hj-cal__weekday">
            {w}
          </span>
        ))}
        {days.map((d, i) => {
          const inMonth = d.getMonth() === m.index;
          const lastOfMonth = d.getDate() === new Date(m.year, m.index + 1, 0).getDate();
          const past = d < today;
          const isStart = !!start && sameDay(d, start);
          const isEnd = !!checkOut && sameDay(d, checkOut);
          const inRange = !!start && !!checkOut && d > start && d < checkOut;
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={`hj-cal__day${inMonth ? "" : " is-out"}${isStart || isEnd ? " is-picked" : ""}${inRange ? " is-range" : ""}${isStart && checkOut ? " is-start" : ""}${isEnd ? " is-end" : ""}${i % 7 === 0 || d.getDate() === 1 ? " is-row-start" : ""}${i % 7 === 6 || lastOfMonth ? " is-row-end" : ""}`}
              disabled={!send || !inMonth || past}
              onClick={() => tap(d)}
            >
              <span>{inMonth ? d.getDate() : ""}</span>
            </button>
          );
        })}
      </div>
      {send ? (
        <div className="hj-dates__actions">
          {onBack ? (
            <button type="button" className="hj-flex" onClick={onBack}>
              Back to suggestions
            </button>
          ) : null}
          <button type="button" className="hj-button" disabled={!start || !end} onClick={() => start && end && send(plan(start, end))}>
            {start && end
              ? `Plan ${nightsOf(start, end)} night${nightsOf(start, end) === 1 ? "" : "s"}, ${span(start, end)}`
              : start
                ? "Now tap the day you leave"
                : "Tap the day you arrive"}
          </button>
        </div>
      ) : answer ? (
        <p className="hj-dates__said">{answer}</p>
      ) : null}
    </>
  );
}
