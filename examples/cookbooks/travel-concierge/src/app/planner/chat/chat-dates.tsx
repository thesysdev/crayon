"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import { useState } from "react";
import { list, propsOf } from "../library";
import "./chat-dates.css";

// Dates for the Chat tab: the guided flow's Dates step (steps.tsx), redrawn for the centred
// column. The agent's suggested windows are white cards, read label, dates, why; a pill under
// them opens the month calendar for a range of your own. A pick is sent as the traveller's next
// message in the guided flow's words ("Plan it for 4 nights, 6 November to 10 November 2026"),
// so the trip, Explore, the Itinerary and the hotel searches all read the same dates.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type ChatWhen = { label: string; from: string; to: string; why?: string };

const iso = /^\d{4}-\d{2}-\d{2}$/;
const dayOf = (day: string) => new Date(`${day}T12:00:00`);
const nightsOf = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);
const dayName = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const shortDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
const span = (a: Date, b: Date) => (a.getMonth() === b.getMonth() ? `${a.getDate()} – ${shortDay(b)}` : `${shortDay(a)} – ${shortDay(b)}`);
const weekday = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short" });
/** The message a pick sends, the same words as the guided flow's. */
export const planMessage = (a: Date, b: Date) => {
  const n = nightsOf(a, b);
  return `Plan it for ${n} night${n === 1 ? "" : "s"}, ${dayName(a)} to ${dayName(b)} ${b.getFullYear()}`;
};

/** The agent's windows, kept only when both days are real and in order. */
export function windowsOf(suggestions: unknown) {
  return list(suggestions)
    .map((n) => propsOf<ChatWhen>(n))
    .filter((w): w is ChatWhen => !!w.label && iso.test(w.from ?? "") && iso.test(w.to ?? "") && w.to! > w.from!)
    .slice(0, 4);
}

/**
 * When are you going: the windows, then the calendar on request. `send` is there only on the
 * newest reply; `answer` is the message that followed it, so an earlier one shows what was picked.
 */
export function ChatDates({
  title,
  suggestions,
  nights,
  from,
  send,
  answer,
}: {
  title?: string;
  suggestions: ChatWhen[];
  nights?: number;
  from?: string;
  send?: (text: string) => void;
  answer?: string;
}) {
  const [custom, setCustom] = useState(false);
  const chosen = answer ? suggestions.find((w) => answer.includes(dayName(dayOf(w.from)))) : undefined;
  const calendar = custom || !suggestions.length || (!!answer && !chosen);
  return (
    <section className="pl-chat-dates">
      {title ? <h3 className="pl-chat-heading">{title}</h3> : null}
      {calendar ? (
        <ChatCalendar nights={nights} from={from} send={send} answer={answer} onBack={suggestions.length && send ? () => setCustom(false) : undefined} />
      ) : (
        <>
          <ul className="pl-chat-when">
            {suggestions.map((w) => {
              const a = dayOf(w.from);
              const b = dayOf(w.to);
              return (
                <li key={w.from + w.to}>
                  <button
                    type="button"
                    className={`pl-chat-when__card${chosen === w ? " is-picked" : ""}${answer && chosen !== w ? " is-faded" : ""}`}
                    disabled={!send}
                    onClick={() => send?.(planMessage(a, b))}
                  >
                    <span className="pl-chat-when__label">{w.label}</span>
                    <span className="pl-chat-when__dates">
                      {weekday(a)} {span(a, b)}
                    </span>
                    {w.why ? <span className="pl-chat-when__why">{w.why}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {send ? (
            <button type="button" className="pl-chat-dates__pill" onClick={() => setCustom(true)}>
              <CalendarDays strokeWidth={1.75} aria-hidden />
              Pick your own dates
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

/** The month calendar: month pills, then the days. Tap the day you arrive, then the day you
 *  leave; the button sends the range. */
export function ChatCalendar({
  nights,
  from,
  send,
  answer,
  onBack,
}: {
  nights?: number;
  from?: string;
  send?: (text: string) => void;
  answer?: string;
  onBack?: () => void;
}) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { name: MONTHS[d.getMonth()], year: d.getFullYear(), index: d.getMonth() };
  });
  // An arrival day the traveller already named (the agent passes it as `from`) pre-fills it.
  const given = from && iso.test(from) ? dayOf(from) : null;
  const givenMonth = given ? months.findIndex((x) => x.index === given.getMonth() && x.year === given.getFullYear()) : -1;
  // Once answered, the calendar shows the range that was sent.
  const said = answer?.match(/(\d{1,2}) (\w+) to (\d{1,2}) (\w+) (\d{4})/);
  const saidRange = said
    ? (() => {
        const end = new Date(Number(said[5]), MONTHS.indexOf(said[4]), Number(said[3]));
        const start = new Date(Number(said[5]) - (MONTHS.indexOf(said[2]) > MONTHS.indexOf(said[4]) ? 1 : 0), MONTHS.indexOf(said[2]), Number(said[1]));
        return MONTHS.includes(said[2]) && MONTHS.includes(said[4]) ? { start, end } : null;
      })()
    : null;
  const opening = saidRange ? saidRange.start : givenMonth >= 0 ? given : null;
  const openMonth = opening ? months.findIndex((x) => x.index === opening.getMonth() && x.year === opening.getFullYear()) : -1;
  const [month, setMonth] = useState(Math.max(0, openMonth));
  const [start, setStart] = useState<Date | null>(saidRange?.start ?? (givenMonth >= 0 ? given : null));
  const [end, setEnd] = useState<Date | null>(
    saidRange?.end ?? (givenMonth >= 0 && given && nights ? new Date(given.getFullYear(), given.getMonth(), given.getDate() + Math.round(nights)) : null),
  );
  const m = months[month];
  const first = new Date(m.year, m.index, 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  // First tap is the arrival; a later day is when you leave; an earlier one starts again.
  const tap = (d: Date) => {
    if (start && !end && d > start) setEnd(d);
    else {
      setStart(d);
      setEnd(null);
    }
  };
  // Always six rows of weeks, so the calendar never changes height.
  const lead = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(m.year, m.index, i - lead + 1));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(m.year, m.index + 1, 0).getDate();
  return (
    <div className="pl-chat-cal">
      <div className="pl-chat-cal__months" role="radiogroup" aria-label="Month">
        {months.map((x, i) => (
          <button
            key={x.name + x.year}
            type="button"
            role="radio"
            aria-checked={i === month}
            className={`pl-chat-cal__month${i === month ? " is-picked" : ""}`}
            disabled={!send}
            onClick={() => setMonth(i)}
          >
            {x.name.slice(0, 3)}
            {x.index === 0 || i === 0 ? <span className="pl-chat-cal__year">{x.year}</span> : null}
          </button>
        ))}
      </div>
      <div className="pl-chat-cal__grid" role="grid" aria-label={`${m.name} ${m.year}`}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
          <span key={w} className="pl-chat-cal__weekday">
            {w}
          </span>
        ))}
        {days.map((d, i) => {
          const inMonth = d.getMonth() === m.index;
          const isStart = !!start && sameDay(d, start);
          const isEnd = !!end && sameDay(d, end);
          const inRange = !!start && !!end && d > start && d < end;
          const cls = [
            "pl-chat-cal__day",
            inMonth ? "" : "is-out",
            isStart || isEnd ? "is-picked" : "",
            inRange ? "is-range" : "",
            isStart && end ? "is-start" : "",
            isEnd ? "is-end" : "",
            i % 7 === 0 || d.getDate() === 1 ? "is-row-start" : "",
            i % 7 === 6 || (inMonth && d.getDate() === last) ? "is-row-end" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={d.toISOString()} type="button" className={cls} disabled={!send || !inMonth || d < today} onClick={() => tap(d)}>
              <span>{inMonth ? d.getDate() : ""}</span>
            </button>
          );
        })}
      </div>
      {send ? (
        <div className="pl-chat-cal__actions">
          {onBack ? (
            <button type="button" className="pl-chat-dates__pill" onClick={onBack}>
              Back to suggestions
            </button>
          ) : null}
          <button type="button" className="pl-chat-dates__go" disabled={!start || !end} onClick={() => start && end && send(planMessage(start, end))}>
            <span>{start && end ? `Plan ${span(start, end)}` : start ? "Now tap the day you leave" : "Tap the day you arrive"}</span>
            {start && end ? <ArrowRight strokeWidth={2} aria-hidden /> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
