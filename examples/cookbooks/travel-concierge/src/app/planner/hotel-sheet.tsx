"use client";

import { Car, Coffee, Dumbbell, Flower2, PawPrint, Snowflake, UtensilsCrossed, Waves, Wifi, Check, CalendarCheck, MapPin, Star } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { SaveButton } from "./itinerary";
import type { HotelData } from "./library";
import { Price } from "./money";
import { SheetMiniMap } from "./map";
import "./hotel-sheet.css";

// A hotel's sheet, opened from any hotel card: everything trivago gave us about it. trivago's
// MCP only has a search (no details call), so this is what a search returns: one photo, the name,
// stars, guest rating and reviews, distance to the centre, top amenities, the price a night and
// for the stay, the booking site and its link. There's no description or photo gallery to show.

export type HotelOpened = HotelData & { amenities?: string; checkIn?: string; checkOut?: string };

const amenityIcon: [RegExp, ComponentType<SVGProps<SVGSVGElement>>][] = [
  [/wi-?fi|internet/i, Wifi],
  [/breakfast/i, Coffee],
  [/pool/i, Waves],
  [/parking|car/i, Car],
  [/air|a\/c|conditioning/i, Snowflake],
  [/gym|fitness/i, Dumbbell],
  [/spa|wellness|sauna/i, Flower2],
  [/kitchen|restaurant/i, UtensilsCrossed],
  [/pet/i, PawPrint],
  [/cancel/i, CalendarCheck],
];
const iconFor = (amenity: string) => amenityIcon.find(([re]) => re.test(amenity))?.[1] ?? Check;

const day = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export function HotelSheet({ hotel }: { hotel: HotelOpened }) {
  const amenities = (hotel.amenities ?? "")
    .split(/[,;|•]/)
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
  const dates = hotel.checkIn && hotel.checkOut ? `${day(hotel.checkIn)} – ${day(hotel.checkOut)}` : "";
  const site = hotel.site?.split(/[,;]/)[0]?.trim();
  return (
    <article className="pl-hotel">
      <div className="pl-hotel__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hotel.photo ? <img src={hotel.photo} alt={hotel.name} /> : null}
      </div>
      <div className="pl-hotel__body">
        <header className="pl-hotel__head">
          <h1>{hotel.name}</h1>
          <p className="pl-hotel__meta">
            {hotel.stars ? (
              <span className="pl-hotel__stars" aria-label={`${hotel.stars}-star hotel`}>
                {Array.from({ length: Math.round(hotel.stars) }, (_, i) => (
                  <Star key={i} aria-hidden />
                ))}
              </span>
            ) : null}
            {hotel.rating ? (
              <span>
                <strong>{hotel.rating}</strong>
                {hotel.reviews ? ` · ${hotel.reviews} reviews` : ""}
              </span>
            ) : null}
          </p>
          {hotel.location ? (
            <p className="pl-hotel__where">
              <MapPin aria-hidden /> {hotel.location}
            </p>
          ) : null}
        </header>
        {amenities.length ? (
          <section className="pl-hotel__amenities">
            <h2>What it has</h2>
            <ul>
              {amenities.map((a) => {
                const Icon = iconFor(a);
                return (
                  <li key={a}>
                    <Icon aria-hidden strokeWidth={1.6} />
                    {a}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <div className="pl-hotel__where-map">
          <SheetMiniMap name={hotel.name} heading="Where it is" />
        </div>
        {/* Read in order: the price, what it covers, then the actions, ending on Book. */}
        <aside className="pl-hotel__book">
          <div className="pl-hotel__price">
            <Price price={hotel.price} suffix="a night" />
            {hotel.total ? (
              <span className="pl-hotel__total">
                <Price price={hotel.total} suffix={dates ? `for ${dates}` : "for the stay"} />
              </span>
            ) : null}
          </div>
          <p className="pl-hotel__fine">Live price from trivago; it can change until you book.</p>
          <SaveButton
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
          <a className="pl-hotel__cta" href={hotel.url} target="_blank" rel="noopener noreferrer">
            Book on {site || "trivago"}
          </a>
        </aside>
      </div>
    </article>
  );
}
