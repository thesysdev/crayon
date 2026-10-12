import type { z } from "zod/v4";
import { formatCurrency, formatNumber } from "../core/format";
import {
  AS_OF,
  RANGE_DAYS,
  between,
  bucket,
  changeText,
  dailySeries,
  dateLabel,
  dayLabels,
  dayOfWeek,
  downsample,
  eventSpan,
  kpi,
  mean,
  periodLabel,
  random,
  round,
  sum,
} from "../core/sample-data";
import type { ChartEvent, Insight, Item, Kpi, Range, ValueFormat } from "../core/schemas";
import { ecommerceTools } from "./tools";

// Sundial Goods: a demo direct-to-consumer brand. Everything derives from one
// daily history per sales channel, so the tools agree with each other: the
// sales breakdown's total equals the KPI strip's total sales, blended ROAS uses
// the same spend as the channel table, and so on.

type Tools = typeof ecommerceTools;
type Input<N extends Tools[number]["name"]> = z.output<
  Extract<Tools[number], { name: N }>["input"]
>;
type Channel = "online" | "app" | "amazon";

const HISTORY = 200;
/** The Fall sale ran 12–14 days ago (Sep 26–28): more orders at deeper discounts. */
const SALE_DAYS_AGO = new Set([12, 13, 14]);

const CHANNELS: Record<
  Channel,
  {
    label: string;
    orders: number;
    aov: number;
    newShare: number;
    conversion: number;
    returnRate: number;
  }
> = {
  online: {
    label: "Online store",
    orders: 230,
    aov: 86,
    newShare: 0.68,
    conversion: 0.025,
    returnRate: 0.068,
  },
  app: {
    label: "Mobile app",
    orders: 125,
    aov: 74,
    newShare: 0.45,
    conversion: 0.038,
    returnRate: 0.058,
  },
  amazon: {
    label: "Amazon",
    orders: 92,
    aov: 61,
    newShare: 0.74,
    conversion: 0,
    returnRate: 0.047,
  },
};
const STOREFRONT: Channel[] = ["online", "app"];

type Field =
  | "orders"
  | "gross"
  | "discounts"
  | "returns"
  | "net"
  | "shipping"
  | "taxes"
  | "total"
  | "newOrders"
  | "sessions"
  | "cogs"
  | "fulfillment"
  | "fees";
type Daily = Record<Field, number[]>;

const histories = new Map<Channel, Daily>();

function history(channel: Channel): Daily {
  const cached = histories.get(channel);
  if (cached) return cached;
  const c = CHANNELS[channel];
  const base = dailySeries(`orders:${channel}`, HISTORY, c.orders, {
    weekend: 0.93,
    growth: 0.16,
    noise: 0.22,
  });
  const next = random(`daily:${channel}`);
  const daily = {} as Daily;
  const push = (field: Field, value: number) => (daily[field] ??= []).push(value);
  for (let i = 0; i < HISTORY; i++) {
    const sale = SALE_DAYS_AGO.has(HISTORY - 1 - i);
    const orders = Math.round(base[i] * (sale ? 1.65 : 1));
    const gross = orders * c.aov * 1.08 * (0.95 + next() * 0.1);
    const discounts = gross * (sale ? 0.21 : 0.066 + next() * 0.012);
    const returns = gross * c.returnRate * (0.85 + next() * 0.3);
    const net = gross - discounts - returns;
    const shipping = orders * 0.52 * 6.9;
    const taxes = (net + shipping) * 0.068;
    const total = net + shipping + taxes;
    push("orders", orders);
    push("gross", gross);
    push("discounts", discounts);
    push("returns", returns);
    push("net", net);
    push("shipping", shipping);
    push("taxes", taxes);
    push("total", total);
    push("newOrders", orders * c.newShare * (0.92 + next() * 0.16) * (sale ? 1.12 : 1));
    push(
      "sessions",
      c.conversion
        ? orders /
            (c.conversion * (1 + (0.05 * i) / HISTORY) * (sale ? 1.18 : 1) * (0.93 + next() * 0.14))
        : 0,
    );
    push("cogs", net * 0.41);
    push("fulfillment", orders * 7.2);
    push("fees", channel === "amazon" ? total * 0.15 : total * 0.029 + orders * 0.3);
  }
  histories.set(channel, daily);
  return daily;
}

function channelsFor(channel: string): Channel[] {
  return channel === "all" ? (Object.keys(CHANNELS) as Channel[]) : [channel as Channel];
}

/** Daily values summed across channels, for the `days` days ending `offset` days ago. */
function series(channels: Channel[], field: Field, days: number, offset = 0): number[] {
  const out = new Array(days).fill(0);
  for (const ch of channels) {
    const values = history(ch)[field];
    for (let i = 0; i < days; i++) out[i] += values[HISTORY - offset - days + i];
  }
  return out;
}
const current = (chs: Channel[], field: Field, range: Range) =>
  series(chs, field, RANGE_DAYS[range]);
const previous = (chs: Channel[], field: Field, range: Range) =>
  series(chs, field, RANGE_DAYS[range], RANGE_DAYS[range]);
const ratio = (a: number[], b: number[]) => a.map((v, i) => (b[i] ? v / b[i] : 0));

// ── Marketing ──────────────────────────────────────────────────────────────

const MARKETING = [
  {
    key: "meta",
    label: "Meta Ads",
    type: "paid",
    spend: 3900,
    share: 0.28,
    newShare: 0.33,
    growth: 0.25,
  },
  {
    key: "google",
    label: "Google Ads",
    type: "paid",
    spend: 2500,
    share: 0.24,
    newShare: 0.24,
    growth: 0.12,
  },
  {
    key: "tiktok",
    label: "TikTok Ads",
    type: "paid",
    spend: 850,
    share: 0.09,
    newShare: 0.11,
    growth: 0.9,
  },
  {
    key: "email",
    label: "Email & SMS",
    type: "owned",
    spend: 160,
    share: 0.15,
    newShare: 0.04,
    growth: 0,
  },
  {
    key: "organic",
    label: "Organic search",
    type: "organic",
    spend: 0,
    share: 0.1,
    newShare: 0.12,
    growth: 0,
  },
  {
    key: "direct",
    label: "Direct",
    type: "organic",
    spend: 0,
    share: 0.09,
    newShare: 0.08,
    growth: 0,
  },
  {
    key: "affiliates",
    label: "Affiliates",
    type: "partner",
    spend: 0,
    share: 0.05,
    newShare: 0.08,
    growth: 0,
  },
] as const;
const PAID = new Set(["meta", "google", "tiktok"]);
const TARGET_ROAS = 2;

function marketingChannel(m: (typeof MARKETING)[number], days: number, offset: number) {
  const next = random(`mkt:${m.key}:${days}:${offset}`);
  const sales = series(STOREFRONT, "total", days, offset);
  const orders = series(STOREFRONT, "orders", days, offset);
  const newOrders = series(STOREFRONT, "newOrders", days, offset);
  // TikTok's spend has ramped up faster than the revenue it brings in.
  const decay = m.key === "tiktok" ? 1 - 0.28 * ((HISTORY - offset) / HISTORY) ** 3 : 1;
  const tilt = (i: number) => 1 + (m.growth - 0.3) * 0.6 * (i / days - 0.5);
  const cadence = (i: number) =>
    m.key === "email" ? ([2, 4].includes(dayOfWeek(offset + days - 1 - i)) ? 1.45 : 0.82) : 1;
  const revenueDaily = sales.map(
    (v, i) => v * m.share * decay * tilt(i) * cadence(i) * (0.78 + next() * 0.44),
  );
  const revenue = sum(revenueDaily);
  const spendDaily = sales.map((v, i) =>
    m.key === "affiliates"
      ? v * m.share * (0.074 + next() * 0.014)
      : m.spend * (1 + m.growth * ((HISTORY - offset - days + i) / HISTORY)) * (0.9 + next() * 0.2),
  );
  return {
    revenue,
    revenueDaily,
    spend: sum(spendDaily),
    spendDaily,
    orders: sum(orders) * m.share * decay * (0.9 + next() * 0.2),
    newCustomers: sum(newOrders) * m.newShare * (0.9 + next() * 0.2),
  };
}

function marketing(range: Range, offset = 0) {
  const days = RANGE_DAYS[range];
  const raw = MARKETING.map((m) => ({ m, ...marketingChannel(m, days, offset) }));
  // Attribution reconciles to the store: channel revenue, orders, and new
  // customers add up to the storefront totals for the period.
  const scale = (key: "revenue" | "orders" | "newCustomers", field: Field) =>
    sum(series(STOREFRONT, field, days, offset)) / sum(raw.map((c) => c[key]));
  const revenueScale = scale("revenue", "total");
  const orderScale = scale("orders", "orders");
  const newScale = scale("newCustomers", "newOrders");
  const channels = raw.map((c) => ({
    ...c,
    revenue: c.revenue * revenueScale,
    revenueDaily: c.revenueDaily.map((v) => v * revenueScale),
    orders: c.orders * orderScale,
    newCustomers: c.newCustomers * newScale,
  }));
  const adSpend = sum(channels.filter((c) => PAID.has(c.m.key)).map((c) => c.spend));
  const otherMarketing = sum(channels.filter((c) => !PAID.has(c.m.key)).map((c) => c.spend));
  return { channels, adSpend, otherMarketing };
}

// ── Products and inventory ─────────────────────────────────────────────────

const PRODUCTS = [
  {
    sku: "APP-TEE-01",
    name: "Everyday Crew Tee",
    category: "apparel",
    price: 32,
    weight: 1.6,
    cart: 0.16,
    ret: 0.09,
    margin: 0.62,
  },
  {
    sku: "APP-SWT-02",
    name: "Merino Crew Sweater",
    category: "apparel",
    price: 98,
    weight: 0.9,
    cart: 0.11,
    ret: 0.12,
    margin: 0.57,
  },
  {
    sku: "APP-OVS-03",
    name: "Linen Overshirt",
    category: "apparel",
    price: 78,
    weight: 0.7,
    cart: 0.1,
    ret: 0.13,
    margin: 0.56,
  },
  {
    sku: "APP-HOO-04",
    name: "Organic Cotton Hoodie",
    category: "apparel",
    price: 88,
    weight: 1.0,
    cart: 0.12,
    ret: 0.1,
    margin: 0.58,
  },
  {
    sku: "APP-CHN-05",
    name: "Relaxed Chino",
    category: "apparel",
    price: 84,
    weight: 0.6,
    cart: 0.09,
    ret: 0.16,
    margin: 0.55,
  },
  {
    sku: "FTW-TRL-01",
    name: "Trail Runner 2",
    category: "footwear",
    price: 138,
    weight: 1.1,
    cart: 0.13,
    ret: 0.12,
    margin: 0.47,
  },
  {
    sku: "FTW-CNV-02",
    name: "Canvas Low",
    category: "footwear",
    price: 68,
    weight: 1.2,
    cart: 0.14,
    ret: 0.11,
    margin: 0.49,
  },
  {
    sku: "FTW-DBT-03",
    name: "Suede Desert Boot",
    category: "footwear",
    price: 168,
    weight: 0.45,
    cart: 0.08,
    ret: 0.19,
    margin: 0.45,
  },
  {
    sku: "FTW-SLD-04",
    name: "Weekend Slide",
    category: "footwear",
    price: 42,
    weight: 0.7,
    cart: 0.12,
    ret: 0.07,
    margin: 0.51,
  },
  {
    sku: "ACC-TOT-01",
    name: "Canvas Tote",
    category: "accessories",
    price: 38,
    weight: 1.0,
    cart: 0.17,
    ret: 0.02,
    margin: 0.67,
  },
  {
    sku: "ACC-WAL-02",
    name: "Leather Card Wallet",
    category: "accessories",
    price: 52,
    weight: 0.8,
    cart: 0.14,
    ret: 0.03,
    margin: 0.66,
  },
  {
    sku: "ACC-BEA-03",
    name: "Wool Beanie",
    category: "accessories",
    price: 28,
    weight: 0.9,
    cart: 0.18,
    ret: 0.02,
    margin: 0.64,
  },
  {
    sku: "ACC-CAP-04",
    name: "Sunday Cap",
    category: "accessories",
    price: 34,
    weight: 0.7,
    cart: 0.15,
    ret: 0.04,
    margin: 0.65,
  },
  {
    sku: "HOM-MUG-01",
    name: "Stoneware Mug Set",
    category: "home",
    price: 46,
    weight: 0.8,
    cart: 0.13,
    ret: 0.05,
    margin: 0.6,
  },
  {
    sku: "HOM-THR-02",
    name: "Linen Throw",
    category: "home",
    price: 112,
    weight: 0.55,
    cart: 0.09,
    ret: 0.04,
    margin: 0.61,
  },
  {
    sku: "HOM-CDL-03",
    name: "Soy Candle Trio",
    category: "home",
    price: 36,
    weight: 0.9,
    cart: 0.16,
    ret: 0.03,
    margin: 0.63,
  },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Apparel",
  footwear: "Footwear",
  accessories: "Accessories",
  home: "Home",
};

function productSales(range: Range, channel: string) {
  const chs = channelsFor(channel);
  const storefront = chs.filter((c) => STOREFRONT.includes(c));
  const weights = PRODUCTS.map((p) => p.weight * between(`w:${p.sku}:${channel}`, 0.85, 1.15));
  const totalWeight = sum(weights);
  const units = sum(current(chs, "orders", range)) * 1.62;
  const prevUnits = sum(previous(chs, "orders", range)) * 1.62;
  const discountRate = sum(current(chs, "discounts", range)) / sum(current(chs, "gross", range));
  const prevDiscountRate =
    sum(previous(chs, "discounts", range)) / sum(previous(chs, "gross", range));
  const storefrontShare = storefront.length
    ? sum(current(storefront, "orders", range)) / sum(current(chs, "orders", range))
    : 0;
  const views = storefront.length ? sum(current(storefront, "sessions", range)) * 0.565 : 0;
  return PRODUCTS.map((p, i) => {
    const u = Math.round(
      (units * weights[i] * between(`s:${p.sku}:${range}:${channel}`, 0.88, 1.18)) / totalWeight,
    );
    const pu = Math.round(
      (prevUnits * weights[i] * between(`p:${p.sku}:${range}:${channel}`, 0.9, 1.1)) / totalWeight,
    );
    const revenue = u * p.price * (1 - discountRate);
    const prevRevenue = pu * p.price * (1 - prevDiscountRate);
    const v = Math.round((views * weights[i] * between(`v:${p.sku}`, 0.85, 1.15)) / totalWeight);
    const addToCartRate = p.cart * between(`c:${p.sku}:${range}`, 0.9, 1.1);
    const purchases = (u * storefrontShare) / 1.15;
    const unitsDaily = current(chs, "orders", range).map(
      (o, d) => ((o * 1.62 * weights[i]) / totalWeight) * between(`d:${p.sku}:${d}`, 0.75, 1.25),
    );
    return {
      ...p,
      units: u,
      trend: downsample(unitsDaily, 14).map((v) => round(v)),
      revenue: round(revenue, 2),
      change: round(((revenue - prevRevenue) / prevRevenue) * 100),
      ...(v > 0
        ? {
            views: v,
            addToCartRate: round(addToCartRate, 4),
            conversionRate: round(Math.min(purchases / v, addToCartRate * 0.55), 4),
          }
        : {}),
      returnRate: round(p.ret * between(`r:${p.sku}:${range}`, 0.9, 1.1), 4),
    };
  });
}

/** Days of cover each product has today; a few are deliberately tight. */
const STOCK_PLAN: Record<string, { cover?: number; incoming?: number; inDays?: number }> = {
  "FTW-TRL-01": { cover: 5.8, incoming: 1200, inDays: 9 },
  "ACC-BEA-03": { cover: 0, incoming: 800, inDays: 4 },
  "HOM-THR-02": { cover: 9.5 },
  "APP-SWT-02": { cover: 12, incoming: 600, inDays: 15 },
  "FTW-CNV-02": { cover: 17 },
};

let inventoryCache: ReturnType<typeof buildInventory> | undefined;
const inventory = () => (inventoryCache ??= buildInventory());

function buildInventory() {
  const sales = productSales("30d", "all");
  return sales.map((p) => {
    const plan = STOCK_PLAN[p.sku] ?? {};
    const dailySales = p.units / 30;
    const cover = plan.cover ?? between(`cover:${p.sku}`, 26, 75);
    const stock = Math.round(dailySales * cover);
    const reorderPoint = Math.round(dailySales * 21);
    const incoming = plan.incoming ?? 0;
    const suggested = Math.max(0, Math.ceil((dailySales * 45 - stock - incoming) / 50) * 50);
    return {
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitCost: p.price * (1 - p.margin),
      stock,
      reorderPoint,
      dailySales: round(dailySales),
      daysOfCover: round(stock / dailySales),
      ...(incoming ? { incoming, incomingInDays: plan.inDays } : {}),
      ...(suggested ? { suggestedOrder: suggested } : {}),
    };
  });
}

function stockStatus(sku: string): "In stock" | "Low stock" | "Out of stock" {
  const item = inventory().find((i) => i.sku === sku);
  if (!item || item.stock === 0) return "Out of stock";
  return item.stock < item.reorderPoint ? "Low stock" : "In stock";
}

// ── Purchase and checkout journeys (storefront and app) ───────────────────

const DEVICES = {
  desktop: {
    label: "Desktop",
    sessions: 0.37,
    orders: 0.48,
    view: 0.58,
    cart: 0.25,
    checkout: 0.52,
    ship: 0.86,
    pay: 0.86,
    prevPay: 0.86,
    aov: 1.12,
  },
  mobile: {
    label: "Mobile",
    sessions: 0.58,
    orders: 0.47,
    view: 0.56,
    cart: 0.21,
    checkout: 0.45,
    ship: 0.81,
    pay: 0.74,
    prevPay: 0.78,
    aov: 0.9,
  },
  tablet: {
    label: "Tablet",
    sessions: 0.05,
    orders: 0.05,
    view: 0.6,
    cart: 0.23,
    checkout: 0.5,
    ship: 0.84,
    pay: 0.8,
    prevPay: 0.8,
    aov: 1.02,
  },
};
type Device = keyof typeof DEVICES;

function journey(range: Range, device: string, period: "current" | "previous") {
  const get = period === "current" ? current : previous;
  const sessions = sum(get(STOREFRONT, "sessions", range));
  const orders = sum(get(STOREFRONT, "orders", range));
  const devices = (device === "all" ? Object.keys(DEVICES) : [device]) as Device[];
  const t = {
    sessions: 0,
    views: 0,
    carts: 0,
    checkouts: 0,
    shipping: 0,
    payment: 0,
    purchases: 0,
  };
  for (const d of devices) {
    const r = DEVICES[d];
    const cartRate = period === "current" ? r.cart : r.cart * 0.97;
    const s = sessions * r.sessions;
    const views = s * r.view;
    const carts = views * cartRate;
    const checkouts = carts * r.checkout;
    const shipping = checkouts * r.ship;
    t.sessions += s;
    t.views += views;
    t.carts += carts;
    t.checkouts += checkouts;
    t.shipping += shipping;
    t.payment += shipping * (period === "current" ? r.pay : r.prevPay);
    t.purchases += orders * r.orders;
  }
  return t;
}

// ── Tool handlers ──────────────────────────────────────────────────────────

const pct = (v: number) => `${v.toFixed(2)}%`;
const times = (v: number) => `${v.toFixed(2)}x`;

const CUSTOMERS = [
  "Maya Chen",
  "Liam Okafor",
  "Sofia Rossi",
  "Noah Patel",
  "Ava Müller",
  "Ethan Brooks",
  "Zara Ahmed",
  "Lucas Silva",
  "Emma Johansson",
  "Kai Nakamura",
  "Priya Nair",
  "Oliver Grant",
];
const COUNTRIES = [
  { label: "United States", share: 0.58 },
  { label: "Canada", share: 0.12 },
  { label: "United Kingdom", share: 0.1 },
  { label: "Australia", share: 0.07 },
  { label: "Germany", share: 0.05 },
  { label: "Other", share: 0.08 },
];

function ledger(lines: [string, "base" | "add" | "subtract" | "total", number, number][]) {
  return lines.map(([label, kind, value, prev]) => ({
    label,
    kind,
    value: Math.round(value),
    previous: Math.round(prev),
  }));
}

function profit(range: Range, period: "current" | "previous") {
  const get = period === "current" ? current : previous;
  const all = channelsFor("all");
  const m = marketing(range, period === "current" ? 0 : RANGE_DAYS[range]);
  const net = sum(get(all, "net", range));
  const cogs = sum(get(all, "cogs", range));
  const fulfillment = sum(get(all, "fulfillment", range));
  const fees = sum(get(all, "fees", range));
  const gross = net - cogs;
  const contribution = gross - fulfillment - fees - m.adSpend - m.otherMarketing;
  return {
    net,
    cogs,
    gross,
    fulfillment,
    fees,
    ad: m.adSpend,
    other: m.otherMarketing,
    contribution,
  };
}

function ncpa(range: Range, offset = 0) {
  const days = RANGE_DAYS[range];
  return marketing(range, offset).adSpend / sum(series(STOREFRONT, "newOrders", days, offset));
}

/** A daily series against the same days of the previous period, bucketed by week for 90d. */
function trendOf(
  range: Range,
  cur: number[],
  prev: number[],
  format: ValueFormat,
  events: (ChartEvent | undefined)[] = [],
  average = false,
) {
  const { labels, values } = bucket(dayLabels(RANGE_DAYS[range]), [cur, prev], range, average);
  return {
    labels,
    current: values[0].map((v) => round(v, 2)),
    previous: values[1].map((v) => round(v, 2)),
    format,
    events: events.filter((e): e is ChartEvent => !!e),
    asOf: AS_OF,
    partial: true,
  };
}

/** A number rounded to a few significant digits, as goals are set. */
const roundTo = (value: number, digits: number) => {
  const step = 10 ** (Math.floor(Math.log10(Math.abs(value))) - digits + 1);
  return Math.round(value / step) * step;
};

const saleEvent = (range: Range) =>
  eventSpan(range, "Fall sale", 14, 12, "20% off sitewide, Sep 26–28");

/** Ranked items with their share of the total and change against the previous period. */
function items(
  names: string[],
  values: number[],
  previousValues: number[],
  keys?: string[],
): Item[] {
  const total = sum(values) || 1;
  return names.map((name, i) => ({
    name,
    ...(keys ? { key: keys[i] } : {}),
    value: Math.round(values[i]),
    share: round(values[i] / total, 4),
    change: previousValues[i]
      ? round(((values[i] - previousValues[i]) / previousValues[i]) * 100)
      : 0,
  }));
}

function salesBy({ range, channel, dimension }: Input<"get_sales_by">) {
  const chs = channelsFor(channel);
  if (dimension === "channel") {
    const all = Object.keys(CHANNELS) as Channel[];
    const names = all.map((c) => CHANNELS[c].label);
    const totals = all.map((c) => sum(current([c], "total", range)));
    return {
      labels: names,
      totalSales: totals.map(Math.round),
      orders: all.map((c) => Math.round(sum(current([c], "orders", range)))),
      items: items(
        names,
        totals,
        all.map((c) => sum(previous([c], "total", range))),
        all,
      ),
    };
  }
  if (dimension === "category") {
    const products = productSales(range, channel);
    const categories = Object.keys(CATEGORY_LABELS);
    const totalRatio = sum(current(chs, "total", range)) / sum(current(chs, "net", range));
    const totals = categories.map(
      (c) => sum(products.filter((p) => p.category === c).map((p) => p.revenue)) * totalRatio,
    );
    const previousTotals = categories.map(
      (c) =>
        sum(products.filter((p) => p.category === c).map((p) => p.revenue / (1 + p.change / 100))) *
        totalRatio,
    );
    return {
      labels: categories.map((c) => CATEGORY_LABELS[c]),
      items: items(
        categories.map((c) => CATEGORY_LABELS[c]),
        totals,
        previousTotals,
        categories,
      ),
      totalSales: totals.map(Math.round),
      orders: categories.map((c) =>
        Math.round(sum(products.filter((p) => p.category === c).map((p) => p.units)) / 1.62),
      ),
    };
  }
  if (dimension === "device") {
    const storefront = chs.filter((c) => STOREFRONT.includes(c));
    const sales = sum(current(storefront, "total", range));
    const orders = sum(current(storefront, "orders", range));
    const devices = Object.values(DEVICES);
    const weight = sum(devices.map((d) => d.orders * d.aov));
    const prevSales = sum(previous(storefront, "total", range));
    const totals = devices.map((d) => (sales * d.orders * d.aov) / weight);
    return {
      labels: devices.map((d) => d.label),
      items: items(
        devices.map((d) => d.label),
        totals,
        devices.map((d, i) => ((prevSales * d.orders * d.aov) / weight) * (i === 1 ? 0.97 : 1.02)),
        Object.keys(DEVICES),
      ),
      totalSales: totals.map(Math.round),
      orders: devices.map((d) => Math.round(orders * d.orders)),
    };
  }
  const sales = sum(current(chs, "total", range));
  const orders = sum(current(chs, "orders", range));
  const shares = COUNTRIES.map(
    (c) => c.share * between(`country:${c.label}:${range}:${channel}`, 0.9, 1.1),
  );
  const total = sum(shares);
  const prevSales = sum(previous(chs, "total", range));
  return {
    labels: COUNTRIES.map((c) => c.label),
    items: items(
      COUNTRIES.map((c) => c.label),
      shares.map((s) => (sales * s) / total),
      shares.map((s, i) => ((prevSales * s) / total) * between(`cp:${i}:${range}`, 0.92, 1.06)),
    ),
    totalSales: shares.map((s) => Math.round((sales * s) / total)),
    orders: shares.map((s) => Math.round((orders * s) / total)),
  };
}

/**
 * The period's daily sales split by a breakdown's parts. Each part drifts by its
 * change over the period, days add up to the store's total, and each part's
 * days add up to its item value.
 */
function splitOverTime(range: Range, chs: Channel[], parts: Item[]) {
  const days = RANGE_DAYS[range];
  const daily = current(chs, "total", range);
  const total = sum(parts.map((p) => p.value)) || 1;
  const raw = parts.map((p) => {
    const next = random(`split:${p.name}:${range}`);
    return daily.map(
      (_, i) =>
        (p.value / total) * (1 + ((p.change ?? 0) / 100) * (i / days - 0.5)) * (0.8 + next() * 0.4),
    );
  });
  const perDay = daily.map((v, i) => {
    const dayTotal = sum(raw.map((r) => r[i])) || 1;
    return raw.map((r) => (v * r[i]) / dayTotal);
  });
  const split = parts.map((p, k) => {
    const values = perDay.map((d) => d[k]);
    const scale = p.value / (sum(values) || 1);
    return values.map((v) => v * scale);
  });
  const { labels, values } = bucket(dayLabels(days), split, range);
  return {
    labels,
    series: parts.map((p, k) => ({ name: p.name, values: values[k].map(Math.round) })),
  };
}

export const ecommerceHandlers: Record<string, (args: any) => unknown> = {
  get_store_kpis({ range, channel }: Input<"get_store_kpis">) {
    const chs = channelsFor(channel);
    const storefront = chs.filter((c) => STOREFRONT.includes(c));
    const sales = current(chs, "total", range);
    const orders = current(chs, "orders", range);
    const discounts = current(chs, "discounts", range);
    const aovDaily = ratio(
      current(chs, "gross", range).map((g, i) => g - discounts[i]),
      orders,
    );
    const priorDiscounts = previous(chs, "discounts", range);
    const priorAovDaily = ratio(
      previous(chs, "gross", range).map((g, i) => g - priorDiscounts[i]),
      previous(chs, "orders", range),
    );
    const aov = (s: Channel[], get: typeof current) =>
      (sum(get(s, "gross", range)) - sum(get(s, "discounts", range))) /
      sum(get(s, "orders", range));
    const returning = (get: typeof current) =>
      (1 - sum(get(chs, "newOrders", range)) / sum(get(chs, "orders", range))) * 100;
    const hero = kpi(
      "Total sales",
      sum(sales),
      sum(previous(chs, "total", range)),
      formatCurrency,
      {
        hint: "Net sales + shipping + taxes, all selected channels",
      },
    );
    const heroTrend = trendOf(range, sales, previous(chs, "total", range), "currency", [
      saleEvent(range),
    ]);
    const metrics: Kpi[] = [
      kpi("Orders", sum(orders), sum(previous(chs, "orders", range)), formatNumber, {
        series: orders,
        previousSeries: previous(chs, "orders", range),
        range,
        chart: "number",
        total: true,
      }),
      kpi("Average order value", aov(chs, current), aov(chs, previous), formatCurrency, {
        series: aovDaily,
        previousSeries: priorAovDaily,
        hint: "(Gross sales − discounts) ÷ orders",
        range,
        chart: "currency",
      }),
    ];
    if (storefront.length) {
      const sessions = current(storefront, "sessions", range);
      const conv = (get: typeof current) =>
        (sum(get(storefront, "orders", range)) / sum(get(storefront, "sessions", range))) * 100;
      metrics.push(
        kpi("Conversion rate", conv(current), conv(previous), pct, {
          series: ratio(current(storefront, "orders", range), sessions).map((v) => v * 100),
          previousSeries: ratio(
            previous(storefront, "orders", range),
            previous(storefront, "sessions", range),
          ).map((v) => v * 100),
          hint: "Orders ÷ sessions · DTC benchmark 1.5–3.5%",
          range,
          chart: "percent",
          band: { label: "DTC benchmark 1.5–3.5%", from: 1.5, to: 3.5 },
        }),
        kpi("Sessions", sum(sessions), sum(previous(storefront, "sessions", range)), formatNumber, {
          series: sessions,
          previousSeries: previous(storefront, "sessions", range),
          hint: "Online store and app",
          range,
          chart: "number",
          total: true,
        }),
      );
    } else {
      metrics.push(
        { label: "Conversion rate", value: "—", hint: "Not tracked for Amazon" },
        { label: "Sessions", value: "—", hint: "Not tracked for Amazon" },
      );
    }
    metrics.push(
      kpi(
        "Returning customer rate",
        returning(current),
        returning(previous),
        (v) => `${v.toFixed(1)}%`,
        {
          series: ratio(current(chs, "newOrders", range), orders).map((v) => (1 - v) * 100),
          previousSeries: ratio(
            previous(chs, "newOrders", range),
            previous(chs, "orders", range),
          ).map((v) => (1 - v) * 100),
          hint: "Share of orders from returning customers · benchmark 20–40%",
          range,
          chart: "percent",
          band: { label: "Benchmark 20–40%", from: 20, to: 40 },
        },
      ),
    );
    return { periodLabel: periodLabel(range), hero, heroTrend, metrics };
  },

  get_sales_over_time({ range, channel }: Input<"get_sales_over_time">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const { labels, values } = bucket(
      dayLabels(days),
      [current(chs, "total", range), previous(chs, "total", range), current(chs, "orders", range)],
      range,
    );
    return {
      labels,
      totalSales: values[0].map(Math.round),
      previousPeriod: values[1].map(Math.round),
      orders: values[2].map(Math.round),
      events: [saleEvent(range)].filter((e): e is ChartEvent => !!e),
    };
  },

  get_sales_breakdown({ range, channel }: Input<"get_sales_breakdown">) {
    const chs = channelsFor(channel);
    const s = (f: Field) => sum(current(chs, f, range));
    const p = (f: Field) => sum(previous(chs, f, range));
    return {
      lines: ledger([
        ["Gross sales", "base", s("gross"), p("gross")],
        ["Discounts", "subtract", s("discounts"), p("discounts")],
        ["Returns", "subtract", s("returns"), p("returns")],
        ["Net sales", "total", s("net"), p("net")],
        ["Shipping charges", "add", s("shipping"), p("shipping")],
        ["Taxes", "add", s("taxes"), p("taxes")],
        ["Total sales", "total", s("total"), p("total")],
      ]),
    };
  },

  get_sales_by(args: Input<"get_sales_by">) {
    const breakdown = salesBy(args);
    const parts =
      args.dimension === "channel"
        ? (Object.keys(CHANNELS) as Channel[])
        : args.dimension === "device"
          ? channelsFor(args.channel).filter((c) => STOREFRONT.includes(c))
          : channelsFor(args.channel);
    return { ...breakdown, overTime: splitOverTime(args.range, parts, breakdown.items) };
  },

  get_marketing_performance({ range }: Input<"get_marketing_performance">) {
    const days = RANGE_DAYS[range];
    const cur = marketing(range);
    const prev = marketing(range, days);
    const storefrontSales = (offset: number) => sum(series(STOREFRONT, "total", days, offset));
    const allSales = (offset: number) => sum(series(channelsFor("all"), "total", days, offset));
    const newOrders = (offset: number) => sum(series(STOREFRONT, "newOrders", days, offset));
    const aov = (offset: number) =>
      storefrontSales(offset) / sum(series(STOREFRONT, "orders", days, offset));
    const dailySpend = cur.channels
      .filter((c) => PAID.has(c.m.key))
      .reduce((acc, c) => acc.map((v, i) => v + c.spendDaily[i]), new Array(days).fill(0));
    const totalRevenue = sum(cur.channels.map((c) => c.revenue));
    const prevDailySpend = prev.channels
      .filter((c) => PAID.has(c.m.key))
      .reduce((acc, c) => acc.map((v, i) => v + c.spendDaily[i]), new Array(days).fill(0));
    const dailyRoas = (offset: number, spend: number[]) =>
      series(STOREFRONT, "total", days, offset).map((v, i) => v / (spend[i] || 1));
    const dailyMer = (offset: number, spend: number[], other: number) =>
      series(channelsFor("all"), "total", days, offset).map(
        (v, i) => v / ((spend[i] || 1) + other / days),
      );
    const dailyCpa = (offset: number, spend: number[]) =>
      series(STOREFRONT, "newOrders", days, offset).map((v, i) => spend[i] / (v || 1));
    return {
      periodLabel: periodLabel(range),
      hero: kpi(
        "Blended ROAS",
        storefrontSales(0) / cur.adSpend,
        storefrontSales(days) / prev.adSpend,
        times,
        {
          hint: "Store and app revenue ÷ ad spend on Meta, Google, and TikTok",
        },
      ),
      heroTrend: {
        ...trendOf(
          range,
          dailyRoas(0, dailySpend),
          dailyRoas(days, prevDailySpend),
          "ratio",
          [saleEvent(range)],
          true,
        ),
        // At a 59% gross margin, ad-driven revenue pays for itself above 1.7x.
        target: { label: "Break-even 1.7x", value: 1.7 },
      },
      metrics: [
        kpi("Ad spend", cur.adSpend, prev.adSpend, formatCurrency, {
          series: dailySpend,
          previousSeries: prevDailySpend,
          goodDirection: "neutral",
          hint: "Meta, Google, and TikTok",
          range,
          chart: "currency",
          total: true,
        }),
        kpi(
          "MER",
          allSales(0) / (cur.adSpend + cur.otherMarketing),
          allSales(days) / (prev.adSpend + prev.otherMarketing),
          times,
          {
            series: dailyMer(0, dailySpend, cur.otherMarketing),
            previousSeries: dailyMer(days, prevDailySpend, prev.otherMarketing),
            hint: "Total sales ÷ all marketing spend · healthy DTC 3–5x",
            range,
            chart: "ratio",
            band: { label: "Healthy DTC 3–5x", from: 3, to: 5 },
          },
        ),
        kpi(
          "New customer CPA",
          cur.adSpend / newOrders(0),
          prev.adSpend / newOrders(days),
          formatCurrency,
          {
            series: dailyCpa(0, dailySpend),
            previousSeries: dailyCpa(days, prevDailySpend),
            goodDirection: "down",
            hint: "Ad spend ÷ new-customer orders",
            range,
            chart: "currency",
          },
        ),
        kpi("New customers", newOrders(0), newOrders(days), formatNumber, {
          series: series(STOREFRONT, "newOrders", days),
          previousSeries: series(STOREFRONT, "newOrders", days, days),
          hint: "First-time buyers in the store and app",
          range,
          chart: "number",
          total: true,
        }),
        kpi(
          "New customer ROAS",
          (newOrders(0) * aov(0) * 0.94) / cur.adSpend,
          (newOrders(days) * aov(days) * 0.94) / prev.adSpend,
          times,
          { hint: "First-order revenue ÷ ad spend", range, chart: "ratio" },
        ),
      ],
      channels: cur.channels.map((c, i) => {
        const p = prev.channels[i];
        const hasRoas = c.spend > 0;
        return {
          channel: c.m.label,
          type: c.m.type,
          spend: Math.round(c.spend),
          revenue: Math.round(c.revenue),
          ...(hasRoas
            ? {
                roas: round(c.revenue / c.spend, 2),
                cpa: round(c.spend / c.orders, 2),
                roasChange: round(
                  ((c.revenue / c.spend - p.revenue / p.spend) / (p.revenue / p.spend)) * 100,
                ),
              }
            : {}),
          orders: Math.round(c.orders),
          newCustomers: Math.round(c.newCustomers),
          share: round(c.revenue / totalRevenue, 4),
          trend: downsample(c.revenueDaily, 14).map(Math.round),
        };
      }),
      targetRoas: TARGET_ROAS,
    };
  },

  get_profit_breakdown({ range }: Input<"get_profit_breakdown">) {
    const c = profit(range, "current");
    const p = profit(range, "previous");
    return {
      lines: ledger([
        ["Net sales", "base", c.net, p.net],
        ["Cost of goods", "subtract", c.cogs, p.cogs],
        ["Gross profit", "total", c.gross, p.gross],
        ["Shipping & fulfillment", "subtract", c.fulfillment, p.fulfillment],
        ["Payment & marketplace fees", "subtract", c.fees, p.fees],
        ["Ad spend", "subtract", c.ad, p.ad],
        ["Other marketing", "subtract", c.other, p.other],
        ["Contribution profit", "total", c.contribution, p.contribution],
      ]),
      grossMargin: `${((c.gross / c.net) * 100).toFixed(1)}%`,
      contributionMargin: `${((c.contribution / c.net) * 100).toFixed(1)}%`,
    };
  },

  get_purchase_journey({ range, device }: Input<"get_purchase_journey">) {
    const c = journey(range, device, "current");
    const p = journey(range, device, "previous");
    const step = (label: string, key: keyof typeof c, medianTime?: string) => ({
      label,
      value: Math.round(c[key]),
      previous: Math.round(p[key]),
      ...(medianTime ? { medianTime } : {}),
    });
    return {
      steps: [
        step("Session start", "sessions"),
        step("Viewed a product", "views", "41s"),
        step("Added to cart", "carts", "3m 12s"),
        step("Began checkout", "checkouts", "5m 48s"),
        step("Purchased", "purchases", "4m 25s"),
      ],
      conversionRate: `${((c.purchases / c.sessions) * 100).toFixed(2)}%`,
    };
  },

  get_checkout_journey({ range, device }: Input<"get_checkout_journey">) {
    const c = journey(range, device, "current");
    const p = journey(range, device, "previous");
    const step = (label: string, key: keyof typeof c, medianTime?: string) => ({
      label,
      value: Math.round(c[key]),
      previous: Math.round(p[key]),
      ...(medianTime ? { medianTime } : {}),
    });
    return {
      steps: [
        step("Began checkout", "checkouts"),
        step("Added shipping info", "shipping", "1m 05s"),
        step("Added payment info", "payment", "1m 40s"),
        step("Purchased", "purchases", "38s"),
      ],
      checkoutCompletion: `${((c.purchases / c.checkouts) * 100).toFixed(1)}%`,
    };
  },

  get_customer_kpis({ range }: Input<"get_customer_kpis">) {
    const all = channelsFor("all");
    const days = RANGE_DAYS[range];
    const orders = current(all, "orders", range);
    const newOrders = current(all, "newOrders", range);
    const returning = (get: typeof current) =>
      (1 - sum(get(all, "newOrders", range)) / sum(get(all, "orders", range))) * 100;
    const months = (seed: string, from: number, to: number) =>
      Array.from(
        { length: 12 },
        (_, i) => from + ((to - from) * i) / 11 + between(`${seed}${i}`, -0.4, 0.4),
      );
    const ltv = 184.2;
    const grossMargin = 0.59;
    const ratioNow = (ltv * grossMargin) / ncpa(range);
    const ratioPrev = (171.4 * grossMargin) / ncpa(range, days);
    return {
      periodLabel: periodLabel(range),
      hero: kpi(
        "New customers",
        sum(newOrders),
        sum(previous(all, "newOrders", range)),
        formatNumber,
        {
          hint: "First order ever placed in the period, all channels",
        },
      ),
      heroTrend: trendOf(range, newOrders, previous(all, "newOrders", range), "number", [
        saleEvent(range),
      ]),
      metrics: [
        kpi(
          "Customers",
          sum(orders) * 0.91,
          sum(previous(all, "orders", range)) * 0.91,
          formatNumber,
          {
            series: orders.map((o) => o * 0.91),
            previousSeries: previous(all, "orders", range).map((o) => o * 0.91),
            hint: "Unique buyers in the period, all channels",
            range,
            chart: "number",
            total: true,
          },
        ),
        kpi(
          "Returning customer rate",
          returning(current),
          returning(previous),
          (v) => `${v.toFixed(1)}%`,
          {
            series: ratio(newOrders, orders).map((v) => (1 - v) * 100),
            previousSeries: ratio(
              previous(all, "newOrders", range),
              previous(all, "orders", range),
            ).map((v) => (1 - v) * 100),
            hint: "Share of orders from returning customers",
            range,
            chart: "percent",
          },
        ),
        kpi("Repeat purchase rate", 27.6, 25.9, (v) => `${v.toFixed(1)}%`, {
          series: months("rpr", 25.9, 27.6),
          hint: "Customers with 2+ orders in the last 12 months",
          range,
          chart: "percent",
        }),
        kpi("Time between orders", 46, 49, (v) => `${Math.round(v)} days`, {
          goodDirection: "down",
          series: months("tbo", 49, 46),
          hint: "Median days from one order to the next",
          range,
          chart: "number",
        }),
        kpi("12-month LTV", ltv, 171.4, formatCurrency, {
          series: months("ltv", 171.4, ltv),
          hint: "Revenue per customer in their first 12 months",
          range,
          chart: "currency",
        }),
        kpi("LTV:CAC", ratioNow, ratioPrev, times, {
          hint: "Gross-margin LTV ÷ new customer CPA · healthy ≥ 3x",
          range,
          chart: "ratio",
          target: { label: "Healthy 3x", value: 3 },
        }),
      ],
    };
  },

  get_new_vs_returning({ range }: Input<"get_new_vs_returning">) {
    const all = channelsFor("all");
    const sales = current(all, "total", range);
    const orders = current(all, "orders", range);
    const newOrders = current(all, "newOrders", range);
    const newSales = sales.map((s, i) => s * (newOrders[i] / orders[i]) * 0.94);
    const { labels, values } = bucket(
      dayLabels(RANGE_DAYS[range]),
      [
        newSales,
        sales.map((s, i) => s - newSales[i]),
        newOrders,
        orders.map((o, i) => (o - newOrders[i]) * 0.9),
      ],
      range,
    );
    return {
      labels,
      newCustomerSales: values[0].map(Math.round),
      returningCustomerSales: values[1].map(Math.round),
      newCustomers: values[2].map(Math.round),
      returningCustomers: values[3].map(Math.round),
    };
  },

  get_order_journey() {
    return {
      steps: [
        { label: "1st order", value: 41820, previous: 37950 },
        { label: "2nd order", value: 11710, previous: 9830, medianTime: "38 days" },
        { label: "3rd order", value: 5621, previous: 4620, medianTime: "52 days" },
        { label: "4th order", value: 3373, previous: 2680, medianTime: "61 days" },
        { label: "5th order or later", value: 2193, previous: 1690, medianTime: "66 days" },
      ],
    };
  },

  get_customer_cohorts({ metric, months }: Input<"get_customer_cohorts">) {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const cohorts = names.map((name, k) => {
      const next = random(`cohort:${metric}:${name}`);
      const periods = names.length - k;
      const lift = 1 + 0.025 * k;
      let value = metric === "ltv" ? 78 * (1 + 0.01 * k) * (0.97 + next() * 0.06) : 3.8 * lift;
      const values = [round(value, metric === "ltv" ? 0 : 1)];
      for (let m = 1; m < periods; m++) {
        value +=
          metric === "ltv"
            ? 13.5 * 0.82 ** (m - 1) * lift * (0.9 + next() * 0.2)
            : 8.2 * 0.72 ** (m - 1) * lift * (0.9 + next() * 0.2);
        values.push(round(value, metric === "ltv" ? 0 : 1));
      }
      return {
        cohort: `${name} 2026`,
        size: Math.round(5200 * (1 + 0.03 * k) * (0.92 + next() * 0.16)),
        values,
      };
    });
    const shown = cohorts.slice(-months);
    return {
      periodLabels: Array.from({ length: shown[0].values.length }, (_, i) => `Month ${i}`),
      cohorts: shown,
      format: metric === "ltv" ? ("currency" as const) : ("percent" as const),
    };
  },

  get_customer_segments() {
    const total = 61400;
    const segments = [
      [
        "Champions",
        "positive",
        0.06,
        0.29,
        5.8,
        612,
        12,
        "Early access and referral asks; skip discounts",
      ],
      ["Loyal", "positive", 0.11, 0.24, 3.9, 371, 31, "Bundles and loyalty perks"],
      ["Promising", "neutral", 0.09, 0.09, 1.9, 168, 24, "Introduce a second category"],
      [
        "New",
        "neutral",
        0.17,
        0.1,
        1.0,
        96,
        9,
        "Welcome series aimed at a 2nd order within 60 days",
      ],
      ["Needs attention", "warning", 0.14, 0.09, 2.2, 187, 68, "Personalized recommendations"],
      ["At risk", "warning", 0.12, 0.11, 3.1, 298, 132, "Win-back offer and a short survey"],
      ["Almost lost", "negative", 0.09, 0.04, 1.6, 142, 210, "One last win-back attempt"],
      ["Dormant", "negative", 0.22, 0.04, 1.1, 88, 318, "Suppress from paid audiences"],
    ] as const;
    return {
      totalCustomers: total,
      segments: segments.map(([name, tone, cs, rs, avgOrders, avgSpend, days, action]) => ({
        name,
        tone,
        customers: Math.round(total * cs),
        customerShare: cs,
        revenueShare: rs,
        avgOrders,
        avgSpend,
        daysSinceOrder: days,
        action,
      })),
    };
  },

  get_product_performance({ range, channel, category, limit }: Input<"get_product_performance">) {
    return {
      products: productSales(range, channel)
        .filter((p) => category === "all" || p.category === category)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
        .map(({ weight: _w, cart: _c, ret: _r, price: _p, ...p }) => ({
          ...p,
          category: CATEGORY_LABELS[p.category],
          stockStatus: stockStatus(p.sku),
        })),
    };
  },

  get_inventory_health({ category }: Input<"get_inventory_health">) {
    const all = inventory().filter((i) => category === "all" || i.category === category);
    const low = all.filter((i) => i.stock < i.reorderPoint);
    const covers = all.map((i) => i.daysOfCover).sort((a, b) => a - b);
    return {
      metrics: [
        {
          label: "Inventory value",
          value: formatCurrency(sum(all.map((i) => i.stock * i.unitCost))),
          hint: "Units on hand at cost",
        },
        {
          label: "Below reorder point",
          value: `${low.length} of ${all.length} SKUs`,
          hint: "Under 21 days of cover",
        },
        {
          label: "Out of stock",
          value: ((n) => `${n} SKU${n === 1 ? "" : "s"}`)(all.filter((i) => i.stock === 0).length),
          hint: "Losing sales today",
        },
        {
          label: "Median days of cover",
          value: `${Math.round(covers[Math.floor(covers.length / 2)] ?? 0)} days`,
          hint: "At the last 30 days' sales rate",
        },
      ],
      items: low
        .sort((a, b) => a.daysOfCover - b.daysOfCover)
        .map(({ category: _c, unitCost: _u, ...item }) => item),
    };
  },

  get_sales_goal({ channel }: Input<"get_sales_goal">) {
    // October so far: the 1st to today, the 10th, of a 31-day month.
    const elapsed = 10;
    const days = 31;
    const daily = series(channelsFor(channel), "total", elapsed);
    let running = 0;
    const cumulative = daily.map((v) => Math.round((running += v)));
    const projected = (running / elapsed) * days;
    return {
      label: "October sales goal",
      goal: roundTo(projected * 1.045, 3),
      format: "currency" as const,
      labels: Array.from({ length: days }, (_, i) => dateLabel(elapsed - 1 - i)),
      cumulative,
      asOf: AS_OF,
    };
  },

  get_fulfillment_sla({ range }: Input<"get_fulfillment_sla">) {
    const days = RANGE_DAYS[range];
    const orders = series(channelsFor("all"), "orders", days);
    const next = random(`sla:${range}`);
    let shipped = 0;
    let counted = 0;
    const items = orders.map((count, i) => {
      const daysAgo = days - 1 - i;
      if (daysAgo === 0) {
        return {
          label: "Today",
          status: "none" as const,
          value: "In progress",
          detail: `${formatNumber(count)} orders so far`,
        };
      }
      // The Fall sale's backlog took three days to clear; one carrier pickup was missed.
      const backlog = daysAgo >= 11 && daysAgo <= 13;
      const carrier = daysAgo === 5;
      const rate = backlog ? 87.5 + next() * 5 : carrier ? 91.4 : 96.4 + next() * 3;
      shipped += (rate / 100) * count;
      counted += count;
      return {
        label: dateLabel(daysAgo),
        status: rate >= 95 ? ("good" as const) : rate >= 90 ? ("warn" as const) : ("bad" as const),
        value: `${rate.toFixed(1)}% shipped in 48 hours`,
        detail: `${formatNumber(count)} orders${backlog ? " · Fall sale backlog" : carrier ? " · carrier pickup missed" : ""}`,
      };
    });
    return {
      days: items,
      summary: `${((shipped / counted) * 100).toFixed(1)}% shipped within 48 hours · target 95%`,
    };
  },

  get_recent_orders({ channel, limit }: Input<"get_recent_orders">) {
    const next = random(`orders:${channel}`);
    const chs = channelsFor(channel);
    let minutesAgo = 0;
    return {
      orders: Array.from({ length: limit }, (_, i) => {
        minutesAgo += 2 + Math.floor(next() * 14);
        const ch = chs[Math.floor(next() * chs.length)];
        const items = 1 + Math.floor(next() * next() * 4);
        const placed = new Date(Date.UTC(2026, 9, 10, 16, 0) - minutesAgo * 60_000);
        const roll = next();
        return {
          id: `#${48210 - i * 3}`,
          customer: CUSTOMERS[Math.floor(next() * CUSTOMERS.length)],
          channel: CHANNELS[ch].label,
          items,
          total: formatCurrency(CHANNELS[ch].aov * (0.55 + items * 0.45) * (0.85 + next() * 0.3)),
          fulfillment:
            i < 4
              ? "Unfulfilled"
              : roll < 0.7
                ? "Fulfilled"
                : roll < 0.92
                  ? "Partially fulfilled"
                  : "Refunded",
          country: COUNTRIES[Math.min(COUNTRIES.length - 2, Math.floor(next() * next() * 5))].label,
          placedAt: placed.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
          }),
        };
      }),
    };
  },

  get_store_insights({ range, channel }: Input<"get_store_insights">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const insights: Insight[] = [];

    const sales = sum(current(chs, "total", range));
    const prevSales = sum(previous(chs, "total", range));
    const orders = sum(current(chs, "orders", range));
    const prevOrders = sum(previous(chs, "orders", range));
    insights.push({
      tone: sales >= prevSales ? "positive" : "negative",
      title: `Total sales ${sales >= prevSales ? "up" : "down"} ${changeText(sales, prevSales).slice(1)} on the prior ${days} days`,
      detail: `Orders changed ${changeText(orders, prevOrders)} and average order value ${changeText(
        (sum(current(chs, "gross", range)) - sum(current(chs, "discounts", range))) / orders,
        (sum(previous(chs, "gross", range)) - sum(previous(chs, "discounts", range))) / prevOrders,
      )}.`,
      metric: formatCurrency(sales),
    });

    const inventoryNow = inventory();
    const bestseller = productSales(range, channel).sort((a, b) => b.revenue - a.revenue)[0];
    const runner = inventoryNow.find((i) => i.sku === "FTW-TRL-01")!;
    insights.push({
      tone: "negative",
      title: `${runner.name} sells out in about ${Math.round(runner.daysOfCover)} days`,
      detail: `${bestseller.sku === runner.sku ? "It is the top product by revenue. " : ""}${formatNumber(runner.incoming ?? 0)} units arrive in ${runner.incomingInDays} days, so expect a ${Math.max(0, (runner.incomingInDays ?? 0) - Math.round(runner.daysOfCover))}-day gap. Expedite the order or move ad spend to Canvas Low.`,
      metric: `${formatNumber(runner.stock)} left`,
    });

    if (chs.some((c) => STOREFRONT.includes(c))) {
      const mobile = DEVICES.mobile;
      const desktop = DEVICES.desktop;
      insights.push({
        tone: "warning",
        title: "Mobile shoppers drop off at payment",
        detail: `${Math.round((1 - mobile.pay) * 100)}% of mobile checkouts stop before adding payment, against ${Math.round((1 - desktop.pay) * 100)}% on desktop, and ${Math.round((mobile.prevPay - mobile.pay) * 100)} points worse than the prior period. Check wallet payment options on mobile.`,
        metric: `${Math.round((1 - mobile.pay) * 100)}% drop`,
      });
    }

    const tiktok = marketing(range).channels.find((c) => c.m.key === "tiktok")!;
    const tiktokPrev = marketing(range, days).channels.find((c) => c.m.key === "tiktok")!;
    const tiktokRoas = tiktok.revenue / tiktok.spend;
    if (tiktokRoas < TARGET_ROAS) {
      insights.push({
        tone: "warning",
        title: `TikTok Ads ROAS ${tiktokRoas.toFixed(2)}x, below the ${TARGET_ROAS.toFixed(1)}x target`,
        detail: `Spend changed ${changeText(tiktok.spend, tiktokPrev.spend)} while attributed revenue changed ${changeText(tiktok.revenue, tiktokPrev.revenue)}. Meta and Google are above target.`,
        metric: formatCurrency(tiktok.spend),
      });
    }

    if (days >= 30) {
      const daily = current(chs, "orders", range);
      const saleOrders = mean([12, 13, 14].map((d) => daily[days - 1 - d]));
      insights.push({
        tone: "info",
        title: "Fall sale lifted orders for three days",
        detail: `Sep 26–28 averaged ${formatNumber(saleOrders)} orders a day, ${changeText(saleOrders, mean(daily))} on the period average, at a 21% discount rate against 7% normally.`,
        metric: changeText(saleOrders, mean(daily)),
      });
    }

    const returns = productSales(range, channel).sort((a, b) => b.returnRate - a.returnRate)[0];
    insights.push({
      tone: "warning",
      title: `${returns.name} returns ${Math.round(returns.returnRate * 100)}% of units`,
      detail: `The highest return rate in the catalog, against ${Math.round((sum(current(chs, "returns", range)) / sum(current(chs, "gross", range))) * 100)}% for the store. Returns are mostly sizing; add a fit note to the product page.`,
      metric: `${Math.round(returns.returnRate * 100)}%`,
    });
    return { insights: insights.slice(0, 6) };
  },
};
