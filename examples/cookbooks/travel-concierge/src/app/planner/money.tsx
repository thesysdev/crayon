"use client";

import { useEffect, useState } from "react";
import "./money.css";

// Where the traveller is, and prices in their own money. The home page's weather finds the
// traveller (city, country, local weather); that's kept here, sent to the agents with each
// request, and used to show every hotel price in the traveller's currency beside the local one.

export type Traveller = { place: string; country: string; countryCode: string; currency: string; weather?: string };

const KEY = "planner:traveller";

// A country's currency, for the countries travellers most often start from; others fall back to USD.
const CURRENCY: Record<string, string> = {
  IN: "INR", US: "USD", GB: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", FI: "EUR", GR: "EUR", ID: "IDR", MY: "MYR", TH: "THB", VN: "VND", JP: "JPY", KR: "KRW", CN: "CNY", SG: "SGD",
  HK: "HKD", AU: "AUD", NZ: "NZD", CA: "CAD", CH: "CHF", AE: "AED", TR: "TRY", BR: "BRL", MX: "MXN", ZA: "ZAR", EG: "EGP",
  MA: "MAD", CZ: "CZK", PL: "PLN", HU: "HUF", SE: "SEK", NO: "NOK", DK: "DKK", IS: "ISK", PH: "PHP", LK: "LKR", NP: "NPR",
  PE: "PEN", CL: "CLP", AR: "ARS", CO: "COP", KE: "KES", TZ: "TZS", JO: "JOD", RU: "RUB", IL: "ILS", QA: "QAR",
};

/** Saves where the traveller is, from the home page's weather reading. */
export function saveTraveller(reading: { place: string; country: string; countryCode: string; temp?: number; words?: string }) {
  const traveller: Traveller = {
    place: reading.place,
    country: reading.country,
    countryCode: reading.countryCode,
    currency: CURRENCY[reading.countryCode?.toUpperCase()] ?? "USD",
    weather: reading.temp !== undefined ? `${reading.temp}°C${reading.words ? `, ${reading.words}` : ""}` : undefined,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(traveller));
  } catch {}
  window.dispatchEvent(new Event(KEY));
}

export function readTraveller(): Traveller | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function useTraveller() {
  const [traveller, setTraveller] = useState<Traveller | null>(null);
  useEffect(() => {
    const read = () => setTraveller(readTraveller());
    read();
    window.addEventListener(KEY, read);
    return () => window.removeEventListener(KEY, read);
  }, []);
  return traveller;
}

/** One line for the agents: where the trip starts from. */
export const travellerLine = (t: Traveller | null) =>
  t ? `The traveller is in ${t.place}, ${t.country}${t.weather ? ` (${t.weather} there now)` : ""}; their money is ${t.currency}.` : "";

// trivago writes prices with the local symbol; these say which currency a symbol means.
const SYMBOLS: [RegExp, string][] = [
  [/^Rp/i, "IDR"], [/^RM/i, "MYR"], [/^₹|^Rs\.?/i, "INR"], [/^€/, "EUR"], [/^£/, "GBP"], [/^¥|^JP¥/, "JPY"], [/^CN¥|^RMB/i, "CNY"],
  [/^₩/, "KRW"], [/^฿/, "THB"], [/^₫/, "VND"], [/^S\$|^SGD/i, "SGD"], [/^HK\$/i, "HKD"], [/^A\$|^AU\$/i, "AUD"], [/^NZ\$/i, "NZD"],
  [/^C\$|^CA\$/i, "CAD"], [/^R\$/, "BRL"], [/^MX\$/i, "MXN"], [/^US\$|^\$/, "USD"], [/^CHF/i, "CHF"], [/^AED|^د\.إ/i, "AED"],
  [/^₺|^TL/i, "TRY"], [/^₱/, "PHP"], [/^Kč/i, "CZK"], [/^zł/i, "PLN"], [/^E£|^EGP/i, "EGP"], [/^MAD|^DH/i, "MAD"], [/^R(?=\s?\d)/, "ZAR"],
  [/^₪/, "ILS"], [/^₽/, "RUB"], [/^Ft/i, "HUF"], [/^JOD/i, "JOD"], [/^QAR/i, "QAR"],
];

/** "Rp 1,234,567" → { code: "IDR", amount: 1234567 }; null if the currency can't be told. */
export function parsePrice(price?: string) {
  if (!price) return null;
  const text = price.trim();
  const code = SYMBOLS.find(([re]) => re.test(text))?.[1] ?? text.match(/\b([A-Z]{3})\b/)?.[1];
  const digits = text.replace(/[^\d.,]/g, "");
  // "1.234.567" and "1,234,567" are thousands; a trailing ",50" or ".50" is cents.
  const amount = Number(digits.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", "."));
  return code && Number.isFinite(amount) && amount > 0 ? { code, amount } : null;
}

const rates = new Map<string, Promise<Record<string, number>>>();
function ratesFor(base: string) {
  if (!rates.has(base))
    rates.set(
      base,
      fetch(`/api/planner/fx?base=${base}`)
        .then((r) => r.json())
        .then((b: { rates?: Record<string, number> }) => b.rates ?? {})
        .catch(() => ({})),
    );
  return rates.get(base)!;
}

/** A local price in the traveller's money, or null when it's already theirs or can't be converted. */
export function useConverted(price?: string) {
  const traveller = useTraveller();
  const [converted, setConverted] = useState<string | null>(null);
  useEffect(() => {
    const local = parsePrice(price);
    const home = traveller?.currency;
    if (!local || !home || local.code === home) return setConverted(null);
    let gone = false;
    ratesFor(home).then((r) => {
      const per = r[local.code];
      if (gone || !per) return;
      const value = local.amount / per;
      setConverted(new Intl.NumberFormat(undefined, { style: "currency", currency: home, maximumFractionDigits: value < 100 ? 2 : 0 }).format(value));
    });
    return () => {
      gone = true;
    };
  }, [price, traveller?.currency]);
  return converted;
}

/** A price in both currencies: the traveller's own, highlighted, with the local price beside it. */
export function Price({ price, suffix, className }: { price?: string; suffix?: string; className?: string }) {
  const home = useConverted(price);
  if (!price) return null;
  return (
    <span className={`pl-price${className ? ` ${className}` : ""}`}>
      <span className="pl-price__main">
        {home ?? price}
        {suffix ? <span className="pl-price__suffix">{suffix}</span> : null}
      </span>
      {home ? <span className="pl-price__local">{price}</span> : null}
    </span>
  );
}
