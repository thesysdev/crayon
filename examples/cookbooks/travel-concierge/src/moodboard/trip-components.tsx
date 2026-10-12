"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

// Pieces the agent route writes from trivago's live data: hotel listings and a monthly price
// forecast. The model never writes these; see src/moodboard/agent/pieces.ts.

const text = z.string().nullable().optional();

export const Hotel = defineComponent({
  name: "Hotel",
  props: z.object({
    name: z.string(),
    photo: text,
    price: z.string().describe("Per night, formatted"),
    total: text,
    rating: text.describe("Guest rating out of 10"),
    reviews: text,
    stars: z.number().nullable().optional(),
    area: text,
    site: text.describe("The booking site with this price"),
    url: z.string(),
  }),
  description: "One hotel from trivago as an Airbnb-style listing. Written by the app only.",
  component: ({ props }) => (
    <a className="mb-hotel" href={props.url} target="_blank" rel="noreferrer">
      <span className="mb-hotel__frame">
        {props.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.photo} alt={props.name} draggable={false} />
        ) : null}
        {props.site ? <span className="mb-photo__badge">{props.site}</span> : null}
      </span>
      <span className="mb-hotel__row">
        <strong>{props.name}</strong>
        {props.rating ? (
          <span className="mb-hotel__rating">
            ★ {props.rating}
            {props.reviews ? <em> ({props.reviews})</em> : null}
          </span>
        ) : null}
      </span>
      <span className="mb-hotel__meta">
        {[props.stars ? `${props.stars}-star` : null, props.area].filter(Boolean).join(" · ")}
      </span>
      <span className="mb-hotel__price">
        <b>{props.price}</b> night
        {props.total ? <u> · {props.total} total</u> : null}
      </span>
    </a>
  ),
});

export const Hotels = defineComponent({
  name: "Hotels",
  props: z.object({
    stays: z.array(Hotel.ref),
    when: text.describe("The dates searched, e.g. '12 Nov – 17 Nov · 5 nights'"),
    source: text,
  }),
  description: "A grid of trivago hotel listings with live prices. Written by the app only.",
  component: ({ props, renderNode }) => (
    <div className="mb-hotels">
      {props.when ? (
        <p className="mb-hotels__when">
          <span>{props.when}</span>
          {props.source ? <span>{props.source}</span> : null}
        </p>
      ) : null}
      <div className="mb-hotels__grid">
        {(props.stays as unknown[]).map((stay, i) => (
          <div key={i}>{renderNode(stay)}</div>
        ))}
      </div>
    </div>
  ),
});

export const PriceTrend = defineComponent({
  name: "PriceTrend",
  props: z.object({
    months: z.array(z.string()),
    prices: z.array(z.number()),
    currency: z.string(),
    note: text,
  }),
  description:
    "Average nightly hotel price by month from trivago's forecast, cheapest month highlighted. Written by the app only.",
  component: ({ props }) => {
    const prices = props.prices.slice(0, props.months.length);
    const max = Math.max(...prices, 1);
    const cheapest = prices.indexOf(Math.min(...prices.filter((price) => price > 0)));
    const money = (value: number) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: props.currency,
        maximumFractionDigits: 0,
      }).format(value);
    return (
      <figure className="mb-trend">
        {cheapest >= 0 ? (
          <p className="mb-trend__lede">
            Cheapest in <em>{props.months[cheapest]}</em>, about {money(prices[cheapest])} a night.
          </p>
        ) : null}
        <div className="mb-trend__bars">
          {prices.map((price, i) => (
            <div key={i} className={`mb-trend__bar${i === cheapest ? " is-cheapest" : ""}`}>
              <span className="mb-trend__value">{price ? money(price) : "–"}</span>
              <span className="mb-trend__track">
                <span className="mb-trend__fill" style={{ height: `${(price / max) * 100}%` }} />
              </span>
              <span className="mb-trend__month">{props.months[i]}</span>
            </div>
          ))}
        </div>
        {props.note ? <figcaption>{props.note}</figcaption> : null}
      </figure>
    );
  },
});

export const tripComponents = [Hotel, Hotels, PriceTrend];
