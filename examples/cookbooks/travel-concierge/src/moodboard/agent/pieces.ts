import type { PriceTrend } from "../../lib/trivago-trends";

// Pieces the agent route writes itself from trivago's data, in the planner's own header-and-
// program format. The model never copies prices, photos, or booking links; the route writes them
// from the tool result, so they can't be misquoted.

const lit = (value: unknown) => JSON.stringify(value ?? null);

export type Stay = {
  name: string;
  stars: number | null;
  guest_rating: string | null;
  reviews: string | null;
  price_per_night: string;
  total: string;
  location: string | null;
  photo: string | null;
  booking_site: string | null;
  url: string;
};

export function staysPiece(
  search: { destination: string; check_in: string; check_out: string; nights: number },
  stays: Stay[],
) {
  const when = `${short(search.check_in)} – ${short(search.check_out)} · ${search.nights} night${search.nights === 1 ? "" : "s"}`;
  const rows = stays.map(
    (stay, i) =>
      `h${i + 1} = Hotel(${[
        stay.name,
        stay.photo,
        stay.price_per_night,
        stay.total,
        stay.guest_rating,
        stay.reviews,
        stay.stars,
        stay.location,
        stay.booking_site,
        stay.url,
      ]
        .map(lit)
        .join(", ")})`,
  );
  return [
    `=== hotels | Stays in ${search.destination.replace(/\n/g, " ")}`,
    `root = Stack([hotels], "column")`,
    `hotels = Hotels([${stays.map((_, i) => `h${i + 1}`).join(", ")}], ${lit(when)}, "Live prices from trivago")`,
    ...rows,
  ].join("\n");
}

export function trendPiece(trend: PriceTrend) {
  const months = trend.months.map((month) => monthName(month.month));
  return [
    `=== when | When it's cheapest`,
    `root = Stack([trend], "column")`,
    `trend = PriceTrend(${lit(months)}, ${lit(trend.months.map((month) => month.average))}, ${lit(trend.currency)}, ${lit(`${trend.stars}-star hotels in ${trend.destination}, average per night · trivago forecast`)})`,
  ].join("\n");
}

const short = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const monthName = (yearMonth: string) =>
  new Date(`${yearMonth}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short" });
