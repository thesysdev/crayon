"use client";

import { ChevronLeft, ChevronRight, Minus, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useEditor, useValue } from "tldraw";
import type { Option, Question } from "./questions";

// The answer controls for each kind of question, styled after Airbnb's search panels: a
// two-month range calendar, a "Where" search with place photos, guest steppers, photo-tile
// choices, a free-text field, and a pick-on-the-board prompt.

type Answer = (value: unknown, summary: string) => void;

export function QuestionCard({
  question,
  answer,
  disabled,
}: {
  question: Question;
  answer: Answer;
  disabled: boolean;
}) {
  switch (question.type) {
    case "dates":
      return <Dates question={question} answer={answer} disabled={disabled} />;
    case "destination":
      return <Where question={question} answer={answer} disabled={disabled} />;
    case "guests":
      return <Guests question={question} answer={answer} disabled={disabled} />;
    case "choice":
      return <Choice question={question} answer={answer} disabled={disabled} />;
    case "canvas":
      return <CanvasPick question={question} answer={answer} disabled={disabled} />;
    default:
      return <FreeText question={question} answer={answer} disabled={disabled} />;
  }
}

/* ── Dates ─────────────────────────────────────────────────────── */

const iso = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);
const nice = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const nightsBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

function Month({
  month,
  start,
  end,
  hover,
  onPick,
  onHover,
}: {
  month: Date;
  start: Date | null;
  end: Date | null;
  hover: Date | null;
  onPick: (day: Date) => void;
  onHover: (day: Date | null) => void;
}) {
  const today = startOfDay(new Date());
  const first = (month.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const until = end ?? (start && hover && hover > start ? hover : null);
  return (
    <div className="mb-cal__month">
      <p className="mb-cal__title">
        {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>
      <div className="mb-cal__grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <span key={i} className="mb-cal__dow">
            {day}
          </span>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <span key={`gap${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const past = day < today;
          const isStart = !!start && day.getTime() === start.getTime();
          const isEnd = !!until && day.getTime() === until.getTime();
          const inRange = !!start && !!until && day > start && day < until;
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              className={[
                "mb-cal__day",
                isStart || isEnd ? "is-edge" : "",
                inRange ? "is-range" : "",
                isStart && until ? "is-from" : "",
                isEnd ? "is-to" : "",
              ].join(" ")}
              onClick={() => onPick(day)}
              onMouseEnter={() => onHover(day)}
              onMouseLeave={() => onHover(null)}
            >
              <span>{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const lengths = [
  { value: "weekend", label: "Weekend" },
  { value: "week", label: "Week" },
  { value: "two weeks", label: "Two weeks" },
  { value: "month", label: "Month" },
];

function Dates({
  question,
  answer,
  disabled,
}: {
  question: Extract<Question, { type: "dates" }>;
  answer: Answer;
  disabled: boolean;
}) {
  const now = new Date();
  const hinted = question.month_hint?.match(/^(\d{4})-(\d{2})$/);
  const opening = hinted
    ? new Date(Number(hinted[1]), Number(hinted[2]) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const [mode, setMode] = useState<"dates" | "flexible">("dates");
  const [month, setMonth] = useState(opening < now ? addMonths(now, 0) : opening);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const [length, setLength] = useState(
    question.nights && question.nights <= 3
      ? "weekend"
      : question.nights && question.nights > 10
        ? "two weeks"
        : "week",
  );
  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => addMonths(new Date(), i)), []);
  const [picked, setPicked] = useState<string[]>([iso(opening).slice(0, 7)]);

  const pick = (day: Date) => {
    if (!start || end || day <= start) {
      setStart(day);
      setEnd(null);
      // A suggested length fills in check-out, which a second click can still change.
    } else setEnd(day);
  };
  const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return (
    <div className="mb-ask__body">
      <div className="mb-segment" role="tablist">
        {(["dates", "flexible"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? "is-on" : ""}
            onClick={() => setMode(value)}
          >
            {value === "dates" ? "Dates" : "Flexible"}
          </button>
        ))}
      </div>
      {mode === "dates" ? (
        <div className="mb-cal">
          <button
            type="button"
            className="mb-cal__nav is-prev"
            aria-label="Previous month"
            disabled={month <= minMonth}
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft size={16} />
          </button>
          <Month
            month={month}
            start={start}
            end={end}
            hover={hover}
            onPick={pick}
            onHover={setHover}
          />
          <Month
            month={addMonths(month, 1)}
            start={start}
            end={end}
            hover={hover}
            onPick={pick}
            onHover={setHover}
          />
          <button
            type="button"
            className="mb-cal__nav is-next"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="mb-flex">
          <p className="mb-flex__label">Stay for a</p>
          <div className="mb-pills">
            {lengths.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`mb-pill${length === item.value ? " is-on" : ""}`}
                onClick={() => setLength(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mb-flex__label">Go anytime in</p>
          <div className="mb-months">
            {months.map((date) => {
              const key = iso(date).slice(0, 7);
              const on = picked.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`mb-monthtile${on ? " is-on" : ""}`}
                  onClick={() =>
                    setPicked(on ? picked.filter((item) => item !== key) : [...picked, key])
                  }
                >
                  <strong>{date.toLocaleDateString("en-GB", { month: "long" })}</strong>
                  <span>{date.getFullYear()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mb-ask__footer">
        <span className="mb-ask__summary">
          {mode === "dates"
            ? start && end
              ? `${nice(start)} – ${nice(end)} · ${nightsBetween(start, end)} nights`
              : start
                ? `${nice(start)} – pick check-out`
                : "Pick check-in"
            : `A ${length}, ${picked.length ? picked.map((key) => new Date(`${key}-01T00:00`).toLocaleDateString("en-GB", { month: "short" })).join(", ") : "any month"}`}
        </span>
        {mode === "dates" && start ? (
          <button
            type="button"
            className="mb-link"
            onClick={() => {
              setStart(null);
              setEnd(null);
            }}
          >
            Clear dates
          </button>
        ) : null}
        <button
          type="button"
          className="mb-cta"
          disabled={disabled || (mode === "dates" ? !(start && end) : !picked.length)}
          onClick={() =>
            mode === "dates" && start && end
              ? answer(
                  { check_in: iso(start), check_out: iso(end), nights: nightsBetween(start, end) },
                  `${nice(start)} – ${nice(end)}`,
                )
              : answer(
                  { flexible: true, length, months: picked.sort() },
                  `A ${length} in ${picked.sort().join(", ")}`,
                )
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ── Where ─────────────────────────────────────────────────────── */

type Place = { label: string; detail?: string | null; thumbnail?: string | null };

// The photo for a suggested place, from the moodboard's own image search.
function usePhoto(subject?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!subject) return;
    const controller = new AbortController();
    fetch(`/api/moodboard/images?kind=named&q=${encodeURIComponent(subject)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((photo: { url?: string } | null) => setUrl(photo?.url ?? null))
      .catch(() => {});
    return () => controller.abort();
  }, [subject]);
  return url;
}

function Tile({ option, on, onClick }: { option: Option; on?: boolean; onClick: () => void }) {
  const photo = usePhoto(option.photo);
  return (
    <button type="button" className={`mb-tile${on ? " is-on" : ""}`} onClick={onClick}>
      <span className="mb-tile__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt="" draggable={false} /> : null}
      </span>
      <strong>{option.label}</strong>
      {option.detail ? <span>{option.detail}</span> : null}
    </button>
  );
}

function Where({
  question,
  answer,
  disabled,
}: {
  question: Extract<Question, { type: "destination" }>;
  answer: Answer;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  useEffect(() => {
    if (query.trim().length < 2) return setPlaces([]);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/moodboard/places?q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { places: [] }))
        .then((result: { places: Place[] }) => setPlaces(result.places))
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const choose = (place: string, detail?: string | null) =>
    !disabled && answer({ place, detail: detail ?? null }, place);

  return (
    <div className="mb-ask__body">
      <form
        className="mb-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim()) choose(query.trim());
        }}
      >
        <Search size={16} />
        <input
          autoFocus
          value={query}
          placeholder="Search destinations"
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="mb-cta" disabled={disabled || !query.trim()}>
          Go
        </button>
      </form>
      {places.length ? (
        <ul className="mb-places">
          {places.map((place) => (
            <li key={place.label}>
              <button type="button" onClick={() => choose(place.label, place.detail)}>
                <span className="mb-places__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {place.thumbnail ? <img src={place.thumbnail} alt="" /> : null}
                </span>
                <span>
                  <strong>{place.label}</strong>
                  {place.detail ? <em>{place.detail}</em> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : question.suggestions.length ? (
        <>
          <p className="mb-flex__label">Or try</p>
          <div className="mb-tiles">
            {question.suggestions.map((option) => (
              <Tile
                key={option.label}
                option={option}
                onClick={() => choose(option.label, option.detail)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ── Guests ────────────────────────────────────────────────────── */

function Stepper({
  label,
  detail,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  detail: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-stepper">
      <span>
        <strong>{label}</strong>
        <em>{detail}</em>
      </span>
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <b>{value}</b>
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function Guests({
  question,
  answer,
  disabled,
}: {
  question: Extract<Question, { type: "guests" }>;
  answer: Answer;
  disabled: boolean;
}) {
  const [adults, setAdults] = useState(question.adults);
  const [ages, setAges] = useState<number[]>(Array.from({ length: question.children }, () => 8));
  const [rooms, setRooms] = useState(question.rooms);
  const summary = [
    `${adults} adult${adults === 1 ? "" : "s"}`,
    ages.length ? `${ages.length} child${ages.length === 1 ? "" : "ren"}` : null,
    `${rooms} room${rooms === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="mb-ask__body">
      <Stepper
        label="Adults"
        detail="Ages 18 or above"
        value={adults}
        min={1}
        max={16}
        onChange={setAdults}
      />
      <Stepper
        label="Children"
        detail="Ages 0–17"
        value={ages.length}
        min={0}
        max={8}
        onChange={(count) => setAges(count > ages.length ? [...ages, 8] : ages.slice(0, count))}
      />
      {ages.length ? (
        <div className="mb-ages">
          {ages.map((age, i) => (
            <label key={i}>
              Child {i + 1}
              <select
                value={age}
                onChange={(event) =>
                  setAges(ages.map((item, j) => (j === i ? Number(event.target.value) : item)))
                }
              >
                {Array.from({ length: 18 }, (_, n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Under 1" : `${n} years`}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      <Stepper
        label="Rooms"
        detail="One adult or more in each"
        value={rooms}
        min={1}
        max={Math.min(8, adults)}
        onChange={setRooms}
      />
      <div className="mb-ask__footer">
        <span className="mb-ask__summary">{summary}</span>
        <button
          type="button"
          className="mb-cta"
          disabled={disabled}
          onClick={() => answer({ adults, children_ages: ages, rooms }, summary)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ── Choice ────────────────────────────────────────────────────── */

function Choice({
  question,
  answer,
  disabled,
}: {
  question: Extract<Question, { type: "choice" }>;
  answer: Answer;
  disabled: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const photos = question.options.some((option) => option.photo);
  const toggle = (label: string) => {
    if (disabled) return;
    if (!question.multiple) return answer({ choice: label }, label);
    setPicked(
      picked.includes(label) ? picked.filter((item) => item !== label) : [...picked, label],
    );
  };
  return (
    <div className="mb-ask__body">
      {photos ? (
        <div className="mb-tiles">
          {question.options.map((option) => (
            <Tile
              key={option.label}
              option={option}
              on={picked.includes(option.label)}
              onClick={() => toggle(option.label)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-options">
          {question.options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`mb-option${picked.includes(option.label) ? " is-on" : ""}`}
              onClick={() => toggle(option.label)}
            >
              <strong>{option.label}</strong>
              {option.detail ? <span>{option.detail}</span> : null}
            </button>
          ))}
        </div>
      )}
      {question.multiple ? (
        <div className="mb-ask__footer">
          <span className="mb-ask__summary">
            {picked.length ? picked.join(", ") : "Pick as many as you like"}
          </span>
          <button
            type="button"
            className="mb-cta"
            disabled={disabled || !picked.length}
            onClick={() => answer({ choices: picked }, picked.join(", "))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── Free text ─────────────────────────────────────────────────── */

function FreeText({
  question,
  answer,
  disabled,
}: {
  question: Extract<Question, { type: "text" }>;
  answer: Answer;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const send = () => value.trim() && !disabled && answer({ text: value.trim() }, value.trim());
  return (
    <div className="mb-ask__body">
      <textarea
        className="mb-textarea"
        autoFocus
        rows={3}
        value={value}
        placeholder={question.placeholder ?? "Type your answer"}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />
      <div className="mb-ask__footer">
        <span className="mb-ask__summary">Or type it in the bar below</span>
        <button
          type="button"
          className="mb-cta"
          disabled={disabled || !value.trim()}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ── Pick on the board ─────────────────────────────────────────── */

type Picked = { kind: string; title: string; code: string };

function CanvasPick({
  question,
  answer,
  disabled,
}: {
  question: Extract<Question, { type: "canvas" }>;
  answer: Answer;
  disabled: boolean;
}) {
  const editor = useEditor();
  const selected = useValue(
    "picked pieces",
    () =>
      editor
        .getSelectedShapes()
        .filter((shape) => shape.type === "piece")
        .map((shape) => (shape as unknown as { props: Picked }).props),
    [editor],
  );
  return (
    <div className="mb-ask__body">
      <p className="mb-canvaspick">
        {question.hint ?? "Select pieces on the board"}. Click a piece, shift-click to add more.
      </p>
      {selected.length ? (
        <div className="mb-pills">
          {selected.map((piece, i) => (
            <span key={i} className="mb-pill is-on">
              {piece.title}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mb-ask__footer">
        <span className="mb-ask__summary">
          {selected.length ? `${selected.length} selected` : "Nothing selected yet"}
        </span>
        <button
          type="button"
          className="mb-cta"
          disabled={disabled || !selected.length}
          onClick={() =>
            answer(
              {
                selected: selected.map((piece) => ({
                  kind: piece.kind,
                  title: piece.title,
                  content: piece.code.slice(0, 600),
                })),
              },
              selected.map((piece) => piece.title).join(", "),
            )
          }
        >
          Use these
        </button>
      </div>
    </div>
  );
}
