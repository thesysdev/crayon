// GET /api/planner/fx?base=INR → { base, date, rates: { EUR: 0.0107, IDR: 189.4, … }, fallback? }
// Exchange rates for showing prices in the traveller's own currency. Live from open.er-api.com
// (free, no key), kept for the day per base currency; if that's down, rough fixed rates.

export const runtime = "nodejs";

// Units of each currency per US dollar, roughly (October 2026), for when the live rates fail.
const FALLBACK_USD: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.78, INR: 84, IDR: 15800, MYR: 4.4, THB: 34, VND: 25000, JPY: 148, KRW: 1360, CNY: 7.2,
  SGD: 1.33, HKD: 7.8, AUD: 1.5, NZD: 1.65, CAD: 1.37, CHF: 0.86, AED: 3.67, TRY: 34, BRL: 5.5, MXN: 19, ZAR: 18,
  EGP: 49, MAD: 9.9, CZK: 23, PLN: 3.9, HUF: 360, SEK: 10.5, NOK: 10.8, DKK: 6.9, ISK: 137, PHP: 57, LKR: 300,
  NPR: 134, PEN: 3.8, CLP: 940, ARS: 980, COP: 4100, KES: 129, TZS: 2700, JOD: 0.71, RUB: 95, ILS: 3.7, QAR: 3.64,
};

const cache = new Map<string, { date: string; rates: Record<string, number> }>();
const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const base = (new URL(request.url).searchParams.get("base") ?? "USD").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "USD";
  const hit = cache.get(base);
  if (hit?.date === today()) return Response.json({ base, ...hit });
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(5000) });
    const body = (await r.json()) as { result?: string; rates?: Record<string, number> };
    if (body.result !== "success" || !body.rates) throw new Error("No rates.");
    const entry = { date: today(), rates: body.rates };
    cache.set(base, entry);
    return Response.json({ base, ...entry });
  } catch {
    const per = FALLBACK_USD[base] ?? 1;
    const rates = Object.fromEntries(Object.entries(FALLBACK_USD).map(([code, usd]) => [code, usd / per]));
    return Response.json({ base, date: today(), rates, fallback: true });
  }
}
