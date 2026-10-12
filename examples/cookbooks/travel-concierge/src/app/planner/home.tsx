"use client";

import { ArrowUp } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState, useContext } from "react";
import type { Weather } from "../api/planner/weather/route";
import { SaveHeart, useItinerary } from "./itinerary";
import { Breeze } from "./breeze";
import { Price, saveTraveller } from "./money";
import { type HotelData, SheetOpener } from "./library";
import "./home.css";
import { fillLine, useWeatherLine } from "./weather-line";

// The planner's first page: today's weather where you are, the question and an input to answer
// it, with quick suggestions (places with their 3D icons) along the bottom.

export type Suggestion = { name: string; country: string; icon: string };

/** Every city with a 3D icon in public/icons-3d (the generic landscapes left out). Landmarks
 *  stand for the city you would stay in: Angkor Wat for Siem Reap, Machu Picchu for Cusco. */
export const destinations: Suggestion[] = [
  { name: "Agra", country: "India", icon: "agra" },
  { name: "Amsterdam", country: "Netherlands", icon: "amsterdam" },
  { name: "Siem Reap", country: "Cambodia", icon: "angkor-wat" },
  { name: "Athens", country: "Greece", icon: "athens" },
  { name: "Ubud", country: "Indonesia", icon: "bali" },
  { name: "Bangkok", country: "Thailand", icon: "bangkok" },
  { name: "Barcelona", country: "Spain", icon: "barcelona" },
  { name: "Beijing", country: "China", icon: "beijing" },
  { name: "Berlin", country: "Germany", icon: "berlin" },
  { name: "Cairo", country: "Egypt", icon: "cairo" },
  { name: "Cape Town", country: "South Africa", icon: "cape-town" },
  { name: "Delhi", country: "India", icon: "delhi" },
  { name: "Dubai", country: "UAE", icon: "dubai" },
  { name: "Hanga Roa", country: "Chile", icon: "easter-island" },
  { name: "Panaji", country: "India", icon: "goa" },
  { name: "Honolulu", country: "United States", icon: "hawaii" },
  { name: "Hong Kong", country: "China", icon: "hong-kong" },
  { name: "Reykjavík", country: "Iceland", icon: "iceland" },
  { name: "Istanbul", country: "Türkiye", icon: "istanbul" },
  { name: "Jaipur", country: "India", icon: "jaipur" },
  { name: "Kuala Lumpur", country: "Malaysia", icon: "kuala-lumpur" },
  { name: "Kyoto", country: "Japan", icon: "kyoto" },
  { name: "Las Vegas", country: "United States", icon: "las-vegas" },
  { name: "Lisbon", country: "Portugal", icon: "lisbon" },
  { name: "London", country: "United Kingdom", icon: "london" },
  { name: "Cusco", country: "Peru", icon: "machu-picchu" },
  { name: "Malé", country: "Maldives", icon: "maldives" },
  { name: "Marrakech", country: "Morocco", icon: "marrakech" },
  { name: "Mexico City", country: "Mexico", icon: "mexico-city" },
  { name: "Moscow", country: "Russia", icon: "moscow" },
  { name: "Hakone", country: "Japan", icon: "mount-fuji" },
  { name: "Mumbai", country: "India", icon: "mumbai" },
  { name: "New York", country: "United States", icon: "new-york" },
  { name: "Paris", country: "France", icon: "paris" },
  { name: "Wadi Musa", country: "Jordan", icon: "petra" },
  { name: "Pisa", country: "Italy", icon: "pisa" },
  { name: "Prague", country: "Czechia", icon: "prague" },
  { name: "Rio de Janeiro", country: "Brazil", icon: "rio" },
  { name: "Rome", country: "Italy", icon: "rome" },
  { name: "San Francisco", country: "United States", icon: "san-francisco" },
  { name: "Oia", country: "Greece", icon: "santorini" },
  { name: "Seattle", country: "United States", icon: "seattle" },
  { name: "Seoul", country: "South Korea", icon: "seoul" },
  { name: "Singapore", country: "Singapore", icon: "singapore" },
  { name: "Sydney", country: "Australia", icon: "sydney" },
  { name: "Tokyo", country: "Japan", icon: "tokyo" },
  { name: "Toronto", country: "Canada", icon: "toronto" },
  { name: "Varanasi", country: "India", icon: "varanasi" },
  { name: "Venice", country: "Italy", icon: "venice" },
];

/** The default chips: a fixed five, so server and first client render agree. */
export const suggestions: Suggestion[] = ["lisbon", "kyoto", "santorini", "marrakech", "new-york"].map(
  (icon) => destinations.find((d) => d.icon === icon)!,
);

/** Five destinations picked at random, fresh on every visit. Null until picked after hydration,
 *  so the fixed five never flash first. */
function useRandomFive() {
  const [five, setFive] = useState<Suggestion[] | null>(null);
  useEffect(() => {
    const pool = [...destinations];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setFive(pool.slice(0, 5));
  }, []);
  return five;
}

// WMO weather codes, as Open-Meteo reports them: the words that follow "It's 28° and", and the
// closest of the four 3D weather icons in public/icons-3d (fog reads as cloudy; drizzle, snow and
// storms as rainy).
type Sky = "sunny" | "partly-cloudy" | "cloudy" | "rainy";
function condition(code: number): { words: string; sky: Sky } {
  if (code === 0) return { words: "clear", sky: "sunny" };
  if (code <= 2) return { words: "partly cloudy", sky: "partly-cloudy" };
  if (code === 3) return { words: "overcast", sky: "cloudy" };
  if (code <= 48) return { words: "foggy", sky: "cloudy" };
  if (code <= 57) return { words: "drizzling", sky: "rainy" };
  if (code <= 67 || (code >= 80 && code <= 82)) return { words: "raining", sky: "rainy" };
  if (code <= 77 || code === 85 || code === 86) return { words: "snowing", sky: "rainy" };
  return { words: "stormy", sky: "rainy" };
}

/** The flag emoji for a two-letter country code, e.g. "IN" → 🇮🇳. */
const flag = (code: string) =>
  /^[A-Za-z]{2}$/.test(code) ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "";

/** A temperature with a true minus sign. */
const deg = (n: number) => `${n < 0 ? "\u2212" : ""}${Math.abs(n)}°`;

/** Asks the browser for a position; if it is denied or slow, the weather route falls back to IP. */
function useWeather(skip: boolean) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (skip) return;
    let gone = false;
    const load = (query = "") =>
      fetch(`/api/planner/weather${query}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((w: Weather) => {
          // Where the traveller is goes to the agents and sets the currency prices are shown in.
          saveTraveller({ ...w, words: condition(w.code).words });
          if (!gone) setWeather(w);
        })
        .catch(() => !gone && setFailed(true));
    if (!("geolocation" in navigator)) {
      load();
    } else {
      navigator.geolocation.getCurrentPosition(
        (p) => load(`?lat=${p.coords.latitude.toFixed(3)}&lon=${p.coords.longitude.toFixed(3)}`),
        () => load(),
        { timeout: 6000, maximumAge: 30 * 60 * 1000 },
      );
    }
    return () => {
      gone = true;
    };
  }, [skip]);
  return { weather, failed };
}

/** Today's weather where you are, set as a line of type with its icons inline, above the
 *  headline. Pass `weather` to show a fixed reading (as /components does). */
export function WeatherLine({ weather: given }: { weather?: Weather }) {
  const live = useWeather(!!given);
  const weather = given ?? live.weather;
  const said = weather ? condition(weather.code).words : "";
  // The concierge's take on the same reading; the plain line shows until it arrives.
  const line = useWeatherLine(
    weather
      ? { temp: weather.temp, conditions: said, city: weather.place, country: weather.country, isDay: weather.isDay }
      : null,
  );
  if (!weather) {
    return (
      <p className="pl-weather is-loading" aria-live="polite">
        {live.failed ? "\u00a0" : "Checking the sky where you are…"}
      </p>
    );
  }
  const { words, sky } = condition(weather.code);
  // eslint-disable-next-line @next/next/no-img-element
  const icon = <img className="pl-weather__icon" src={`/icons-3d/weather-${sky}.webp`} alt="" />;
  const place = (
    <>
      <span className="pl-weather__flag" aria-hidden>
        {flag(weather.countryCode)}
      </span>
      {weather.place}
    </>
  );
  if (line) {
    return (
      <p className="pl-weather" aria-live="polite">
        <span key="line" className="pl-weather__line">
          {fillLine(line, { temp: deg(weather.temp), sky: icon, place })}
        </span>
      </p>
    );
  }
  return (
    <p className="pl-weather" aria-live="polite">
      It&rsquo;s {deg(weather.temp)} {icon} and {words} in {place}
      {weather.country && weather.country !== weather.place ? `, ${weather.country}` : ""}.
    </p>
  );
}

/** The Pixar-style render where one exists, else the original felt one. New renders show up
 *  as they land in public/icons-3d, with no list to keep in step. */
function Illustration({ icon, onMissing }: { icon: string; onMissing?: () => void }) {
  // An image that finished loading before hydration never fires onLoad, so check once mounted.
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) img.current.classList.add("is-loaded");
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={`/icons-3d/${icon}-pixar.webp`}
      alt=""
      onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
      onError={(e) => {
        const felt = `/icons-3d/${icon}.webp`;
        if (!e.currentTarget.src.endsWith(felt)) e.currentTarget.src = felt;
        else onMissing?.();
      }}
    />
  );
}

/** Suggested places as squircle cards: a large 3D illustration, the city, and its country below. */
export function PlaceChips({
  places = suggestions,
  onPick,
  hidden,
}: {
  places?: Suggestion[];
  onPick?: (place: Suggestion) => void;
  hidden?: boolean;
}) {
  return (
    <ul className={`pl-chips${hidden ? " is-loading" : ""}`} aria-busy={hidden || undefined}>
      {places.map((p, i) => (
        <li key={hidden ? i : p.name} style={{ "--i": i } as CSSProperties}>
          <button type="button" className="pl-chip" onClick={() => onPick?.(p)}>
            <Illustration icon={p.icon} />
            <span className="pl-chip__city">{p.name}</span>
            <span className="pl-chip__country">{p.country}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The home page of a new plan. */
/** The page's input: one line of type with the red send button beside it. The send animation
 *  plays before `onSend` fires. Shared by the home page and the "Where next?" page. */
export function PromptForm({ onSend, placeholder, label }: { onSend?: (prompt: string) => void; placeholder: string; label: string }) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (onSend) input.current?.focus({ preventScroll: true });
  }, [onSend]);
  const [sending, setSending] = useState(false);
  // Let the send animation play before the page turns to your message.
  const submit = () => {
    const prompt = value.trim();
    if (!prompt || sending) return;
    setSending(true);
    setTimeout(() => onSend?.(prompt), 360);
  };
  return (
    <form
      className="pl-home__form"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={input}
        className="pl-home__input"
        value={value}
        rows={1}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
      />
      <button type="submit" className={`pl-home__send${sending ? " is-sending" : ""}`} disabled={!value.trim()} aria-label="Send">
        <ArrowUp size={36} strokeWidth={1.5} />
      </button>
    </form>
  );
}

export function PlannerHome({ onSend, weather }: { onSend?: (prompt: string) => void; weather?: Weather }) {
  const places = useRandomFive();
  return (
    <section className="hj-page pl-home">
      {/* Ambient pencil sketches drifting along the foot of the page. */}
      <Breeze />
      <div className="pl-home__body">
        <WeatherLine weather={weather} />
        <h1 className="pl-home__title">Where do you want to plan a trip to?</h1>
        <PromptForm onSend={onSend} placeholder="Write a place, a mood, a month…" label="Write a destination or ask about a place" />
      </div>
      {/* Quick suggestions, along the bottom of the page. */}
      <PlaceChips places={places ?? suggestions} hidden={!places} onPick={(p) => onSend?.(`Plan a trip to ${p.name}, ${p.country}`)} />
    </section>
  );
}

export type FollowUp = { label: string; icon?: string; kind?: string };

const placeKinds = new Set(["place", "landscape"]);
/** A follow-up's icon: its place or landscape, else its kind's own icon (followup-stay…). */
const iconFor = (f: FollowUp) => (f.icon && (!f.kind || placeKinds.has(f.kind)) ? f.icon : f.kind && !placeKinds.has(f.kind) ? `followup-${f.kind}` : f.icon);

/** One follow-up card. If its icon hasn't been drawn yet, it shows its words alone. */
function FollowUpCard({ item, onPick }: { item: FollowUp; onPick?: (label: string) => void }) {
  const icon = iconFor(item);
  const [missing, setMissing] = useState(false);
  const words = !icon || missing;
  return (
    <button type="button" className={`pl-chip${words ? " is-words" : ""}`} onClick={() => onPick?.(item.label)}>
      {icon && !missing ? <Illustration icon={icon} onMissing={() => setMissing(true)} /> : null}
      <span className="pl-chip__city">{item.label}</span>
    </button>
  );
}

/** The agent's suggested follow-ups as the home page's cards: each with the 3D icon of its kind
 *  (a place, a landscape, a stay, food…) and the words below it. */
export function FollowUpCards({ items, onPick }: { items: FollowUp[]; onPick?: (label: string) => void }) {
  return (
    <ul className="pl-chips pl-followups">
      {items.map((f, i) => (
        <li key={f.label} style={{ "--i": i } as CSSProperties}>
          <FollowUpCard item={f} onPick={onPick} />
        </li>
      ))}
    </ul>
  );
}

export type Stays = { title: string; checkIn: string; checkOut: string; hotels: HotelData[] };

const shortDay = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** Real trivago hotels for the trip's dates: small prints with the price a night, the rating and
 *  a link to book, in a row under the input. */
export function StaysRow({ stays }: { stays: Stays }) {
  const openSheet = useContext(SheetOpener);
  const range = [shortDay(stays.checkIn), shortDay(stays.checkOut)].filter(Boolean).join(" – ");
  return (
    <div className="pl-stays">
      <p className="pl-stays__title">
        {stays.title.replace(/_|==|\(\(|\)\)/g, "")}
        {/* The dates once: only when the agent's title doesn't already give them. */}
        {range && !/\d/.test(stays.title) ? <span className="pl-stays__dates">{range}</span> : null}
      </p>
      <ul className="pl-stays__row">
        {stays.hotels.slice(0, 4).map((h) => (
          <li key={h.url}>
            {/* The card opens the hotel's sheet; its Book line still goes straight to the site. */}
            <div
              className="pl-stay pl-hotel-open"
              role="button"
              tabIndex={0}
              onClick={() => openSheet?.({ subject: `hotel:${h.name}`, name: h.name, hotel: { ...h, checkIn: stays.checkIn, checkOut: stays.checkOut } })}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                openSheet?.({ subject: `hotel:${h.name}`, name: h.name, hotel: { ...h, checkIn: stays.checkIn, checkOut: stays.checkOut } });
              }}
            >
              <span className="pl-stay__print">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {h.photo ? <img src={h.photo} alt="" /> : null}
                <SaveHeart
                  item={{
                    name: h.name,
                    photo: h.photo,
                    place: h.location,
                    url: h.url,
                    price: h.price,
                    kind: "stay",
                    rating: h.rating,
                    reviews: h.reviews,
                    stars: h.stars,
                    amenities: h.amenities,
                    site: h.site,
                    total: h.total,
                  }}
                  label={false}
                />
              </span>
              <span className="pl-stay__text">
                {/* Name, then what it's like (rating), then the price with its action, on one edge. */}
                <span className="pl-stay__name">{h.name}</span>
                {h.rating ? <span className="pl-stay__rating">Rated {h.rating}</span> : null}
                <span className="pl-stay__line">
                  <Price price={h.price} suffix="a night" />
                </span>
                <a className="pl-stay__book" href={h.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  Book{h.site ? ` on ${h.site.split(/[,;]/)[0]}` : ""}
                </a>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The page that closes the journal, built like the home page: the question, the input, and the
 *  agent's follow-ups along the bottom. */
const createsItinerary = (label: string) => /^(create|make|build|update)( an?| the| my)? itinerary\b/i.test(label.trim());

export function PlannerNext({ onSend, suggestions: offered, stays }: { onSend?: (prompt: string) => void; suggestions: FollowUp[]; stays?: Stays | null }) {
  // "Create itinerary" (offered once the agent judges the trip ready) leads the follow-ups, and
  // reads "Update itinerary" once the trip's board already has days.
  const planned = (useItinerary()?.items ?? []).some((i) => i.day);
  const suggestions = [
    ...offered.filter((f) => createsItinerary(f.label)).map((f) => ({ ...f, label: planned ? "Update itinerary" : "Create itinerary", kind: "schedule" })),
    ...offered.filter((f) => !createsItinerary(f.label)),
  ];
  return (
    <section className="hj-page pl-home pl-next">
      <div className="pl-home__body">
        <h1 className="pl-home__title">Where next?</h1>
        <PromptForm onSend={onSend} placeholder="Ask anything about this trip…" label="Ask a follow-up about this trip" />
        {stays?.hotels.length ? <StaysRow stays={stays} /> : null}
      </div>
      {suggestions.length ? <FollowUpCards items={suggestions} onPick={onSend} /> : null}
    </section>
  );
}
