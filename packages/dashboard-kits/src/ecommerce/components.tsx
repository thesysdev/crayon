"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ProfitWaterfall as ProfitWaterfallView } from "../components/Charts/ProfitWaterfall";
import { QuadrantChart } from "../components/Charts/QuadrantChart";
import { SegmentFlow as SegmentFlowView } from "../components/Charts/SegmentFlow";
import { Sparkline } from "../components/Charts/Sparkline";
import { SERIES_COLORS as SLOTS } from "../components/Charts/utils/constants";
import { DeltaPill } from "../components/DeltaPill";
import {
  changeTone,
  formatChange,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../core/format";
import { passed } from "../core/schemas";
import { Pending } from "../genui-lib/Pending";
import {
  ledgerLineSchema,
  type inventoryItemSchema,
  type marketingChannelSchema,
  type productSchema,
  type segmentSchema,
} from "./tools";

type MarketingChannel = z.infer<typeof marketingChannelSchema>;
type CustomerSegment = z.infer<typeof segmentSchema>;
type Product = z.infer<typeof productSchema>;
type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Props reuse the tool schemas, so a Query result plugs in without reshaping:
// MoneyBreakdown(breakdown.lines), ChannelPerformance(mkt.channels, mkt.targetRoas).

function Change({
  value,
  goodDirection = "up",
}: {
  value?: number;
  goodDirection?: "up" | "down";
}) {
  if (value == null) return null;
  return (
    <span className={`kit-text-${changeTone(value, goodDirection)} kit-num`}>
      {formatChange(value)}
    </span>
  );
}

const KIND_COLOR = {
  base: "var(--kit-total)",
  total: "var(--kit-total)",
  add: "var(--kit-up)",
  subtract: "var(--kit-down)",
} as const;

export const MoneyBreakdown = defineComponent({
  name: "MoneyBreakdown",
  description:
    "Waterfall of money from a starting amount to a result: each line adds (blue), subtracts (red), or subtotals (slate), drawn as floating bars on one scale with the amount and the change against the previous period. Pass get_sales_breakdown's or get_profit_bridge's lines directly.",
  props: z.object({
    lines: z.array(ledgerLineSchema).default([]),
  }),
  component: ({ props }) => {
    const lines = props.lines ?? [];
    if (lines.length === 0) return <Pending kind="list" rows={7} />;
    let running = 0;
    const spans = lines.map((line) => {
      const v = Math.abs(line.value);
      let from = 0;
      let to = v;
      if (line.kind === "add") [from, to] = [running, running + v];
      if (line.kind === "subtract") [from, to] = [running - v, running];
      running = line.kind === "subtract" ? running - v : line.kind === "add" ? running + v : v;
      return { line, from: Math.min(from, to), to: Math.max(from, to) };
    });
    const max = Math.max(1, ...spans.map((s) => s.to));
    return (
      <div className="kit-waterfall">
        {spans.map(({ line, from, to }, i) => {
          const sign = line.kind === "subtract" ? "−" : line.kind === "add" ? "+" : "";
          const change = line.previous
            ? ((line.value - line.previous) / Math.abs(line.previous)) * 100
            : undefined;
          return (
            <div
              key={`${line.label}-${i}`}
              className={`kit-waterfall__row kit-waterfall__row--${line.kind}`}
            >
              <span className="kit-waterfall__label">{line.label}</span>
              <span className="kit-waterfall__track">
                <span
                  className="kit-waterfall__bar"
                  style={{
                    left: `${(from / max) * 100}%`,
                    width: `${Math.max(0.6, ((to - from) / max) * 100)}%`,
                    background: KIND_COLOR[line.kind],
                  }}
                />
              </span>
              <span className="kit-waterfall__value">
                {sign}
                {formatCurrency(Math.abs(line.value))}
              </span>
              <span className="kit-waterfall__change">
                <Change value={change} goodDirection={line.kind === "subtract" ? "down" : "up"} />
              </span>
            </div>
          );
        })}
      </div>
    );
  },
});

export const ProfitWaterfall = defineComponent({
  name: "ProfitWaterfall",
  description:
    "Profit bridge chart: a floating bar per step from net sales to contribution profit, the comparison as a dashed outline on each, the variance on hover: ProfitWaterfall(profit.lines, profit.comparisonLabel).",
  props: z.object({
    lines: z.array(ledgerLineSchema).default([]),
    comparisonLabel: z.string().optional().describe('What the dashed outlines are, e.g. "Plan"'),
  }),
  component: ({ props }) => {
    const lines = props.lines ?? [];
    if (lines.length === 0) return <Pending kind="columns" />;
    return (
      <ProfitWaterfallView
        steps={lines.map((l) => ({
          label: l.label,
          value: l.value,
          kind: l.kind,
          comparison: l.previous,
        }))}
        comparisonLabel={props.comparisonLabel}
      />
    );
  },
});

interface PlatformClaim {
  platform: string;
  spend: number;
  storeRevenue: number;
  claimedRevenue: number;
  storeRoas: number;
  claimedRoas: number;
}

export const ReconciliationCard = defineComponent({
  name: "ReconciliationCard",
  description:
    "Store orders against ad-platform claims, per platform, with ROAS both ways and a summary: ReconciliationCard(recon).",
  props: z.object({
    recon: passed("get_reconciliation's result, passed whole"),
  }),
  component: ({ props }) => {
    const recon = props.recon as unknown as
      | { platforms: PlatformClaim[]; summary: string; storeTotal: number; claimedTotal: number }
      | undefined;
    const platforms = recon?.platforms ?? [];
    if (platforms.length === 0) return <Pending kind="list" rows={3} />;
    const max = Math.max(1, ...platforms.map((p) => Math.max(p.claimedRevenue, p.storeRevenue)));
    return (
      <div className="kit-recon">
        <ul className="kit-recon__list">
          {platforms.map((p) => (
            <li key={p.platform} className="kit-recon__row">
              <span className="kit-recon__name">{p.platform}</span>
              <span className="kit-recon__bars" aria-hidden>
                <span
                  className="kit-recon__claimed"
                  style={{ width: `${(p.claimedRevenue / max) * 100}%` }}
                />
                <span
                  className="kit-recon__store"
                  style={{ width: `${(p.storeRevenue / max) * 100}%` }}
                />
              </span>
              <span className="kit-recon__figures">
                <span>
                  <strong>{formatCurrency(p.storeRevenue)}</strong>
                  <span className="kit-muted"> store · </span>
                  {formatCurrency(p.claimedRevenue)}
                  <span className="kit-muted"> claimed</span>
                </span>
                <span className="kit-muted">
                  ROAS {p.storeRoas.toFixed(2)}x store · {p.claimedRoas.toFixed(2)}x claimed ·{" "}
                  {(p.claimedRevenue / p.storeRevenue).toFixed(2)}×
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="kit-recon__legend" aria-hidden>
          <span>
            <i className="kit-recon__key kit-recon__key--store" /> Store orders
          </span>
          <span>
            <i className="kit-recon__key kit-recon__key--claimed" /> Platform claims
          </span>
        </div>
        <p className="kit-recon__summary">{recon?.summary}</p>
      </div>
    );
  },
});

export const ChannelPerformance = defineComponent({
  name: "ChannelPerformance",
  description:
    "Marketing channel table: spend, attributed revenue with a sparkline, ROAS against the target (with its change), CPA, new customers, and share of revenue, plus a total row. Pass get_marketing_performance's channels and targetRoas directly.",
  props: z.object({
    channels: z.array(passed("A channel from get_marketing_performance")).default([]),
    targetRoas: z.number().optional(),
  }),
  component: ({ props }) => {
    const channels = (props.channels ?? []) as unknown as MarketingChannel[];
    if (channels.length === 0) return <Pending kind="table" rows={7} />;
    const target = props.targetRoas;
    const maxRoas = Math.max(
      (target ?? 1) * 2,
      ...channels.filter((c) => c.type === "paid" && c.roas != null).map((c) => c.roas! * 1.15),
    );
    const spend = channels.reduce((a, c) => a + c.spend, 0);
    const revenue = channels.reduce((a, c) => a + c.revenue, 0);
    const paid = channels.filter((c) => c.type === "paid");
    const paidSpend = paid.reduce((a, c) => a + c.spend, 0);
    const paidRevenue = paid.reduce((a, c) => a + c.revenue, 0);
    return (
      <div className="kit-scroll">
        <table className="kit-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th className="kit-num">Spend</th>
              <th className="kit-num">Revenue</th>
              <th aria-label="Revenue trend" />
              <th>ROAS{target ? ` · target ${target.toFixed(1)}x` : ""}</th>
              <th className="kit-num">CPA</th>
              <th className="kit-num">New customers</th>
              <th className="kit-num">Share</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => {
              const below =
                target != null && c.roas != null && c.type === "paid" && c.roas < target;
              return (
                <tr key={c.channel}>
                  <td>
                    <span className="kit-cell-title">{c.channel}</span>
                    <span className={`kit-tag kit-tag--${c.type}`}>{c.type}</span>
                  </td>
                  <td className="kit-num">{c.spend ? formatCurrency(c.spend) : "—"}</td>
                  <td className="kit-num kit-strong">{formatCurrency(c.revenue)}</td>
                  <td className="kit-cell-spark">
                    {c.trend && <Sparkline values={c.trend} tone="neutral" height={26} />}
                  </td>
                  <td>
                    {c.roas == null ? (
                      <span className="kit-muted">Organic</span>
                    ) : (
                      <span className="kit-roas">
                        <span className={`kit-roas__value${below ? " kit-text-bad" : ""}`}>
                          {below && <span aria-hidden>▾ </span>}
                          {c.roas.toFixed(2)}x
                        </span>
                        <span className="kit-roas__track">
                          <span
                            className={`kit-roas__bar${below ? " kit-roas__bar--below" : ""}`}
                            style={{ width: `${Math.min(100, (c.roas / maxRoas) * 100)}%` }}
                          />
                          {target != null && (
                            <i
                              className="kit-roas__target"
                              style={{ left: `${(target / maxRoas) * 100}%` }}
                            />
                          )}
                        </span>
                        <Change value={c.roasChange} />
                      </span>
                    )}
                  </td>
                  <td className="kit-num">{c.cpa != null ? formatCurrency(c.cpa) : "—"}</td>
                  <td className="kit-num">{formatNumber(c.newCustomers)}</td>
                  <td className="kit-num">{formatPercent(c.share)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="kit-strong">All channels</td>
              <td className="kit-num kit-strong">{formatCurrency(spend)}</td>
              <td className="kit-num kit-strong">{formatCurrency(revenue)}</td>
              <td />
              <td className="kit-muted">
                {paidSpend ? `Paid ads ${(paidRevenue / paidSpend).toFixed(2)}x` : ""}
              </td>
              <td />
              <td className="kit-num kit-strong">
                {formatNumber(channels.reduce((a, c) => a + c.newCustomers, 0))}
              </td>
              <td className="kit-num">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  },
});

const SEGMENT_TONE = {
  positive: { label: "Healthy", icon: "M3.5 8.5 6.5 11.5 12.5 4.5" },
  neutral: { label: "Growing", icon: "M8 3v10M3 8h10" },
  warning: { label: "Slipping", icon: "M8 3.2 14 13H2L8 3.2Zm0 4v2.6m0 1.9v.1" },
  negative: { label: "Lapsed", icon: "M4 4l8 8M12 4l-8 8" },
} as const;

export const CustomerSegments = defineComponent({
  name: "CustomerSegments",
  description:
    "RFM customer segment tiles: each segment's customers, its share of customers against its share of revenue, average orders and spend, days since the last order, a health status, and the recommended action. Pass get_customer_segments's segments directly.",
  props: z.object({
    segments: z.array(passed("A segment from get_customer_segments")).default([]),
  }),
  component: ({ props }) => {
    const segments = (props.segments ?? []) as unknown as CustomerSegment[];
    if (segments.length === 0) return <Pending kind="tiles" rows={4} />;
    const maxShare = Math.max(...segments.flatMap((s) => [s.customerShare, s.revenueShare]), 0.01);
    return (
      <div className="kit-segments">
        {segments.map((s) => {
          const tone = SEGMENT_TONE[s.tone] ?? SEGMENT_TONE.neutral;
          return (
            <div key={s.name} className="kit-segment">
              <div className="kit-segment__head">
                <span className="kit-segment__name">{s.name}</span>
                <span className={`kit-status kit-status--${s.tone}`}>
                  <svg viewBox="0 0 16 16" aria-hidden>
                    <path d={tone.icon} />
                  </svg>
                  {tone.label}
                </span>
              </div>
              <span className="kit-segment__count">{formatNumber(s.customers)}</span>
              <div className="kit-segment__bars">
                <span className="kit-segment__bar-label">Customers</span>
                <span className="kit-segment__bar">
                  <span
                    className="kit-segment__fill kit-segment__fill--muted"
                    style={{ width: `${(s.customerShare / maxShare) * 100}%` }}
                  />
                </span>
                <span className="kit-segment__pct">{formatPercent(s.customerShare, 0)}</span>
                <span className="kit-segment__bar-label">Revenue</span>
                <span className="kit-segment__bar">
                  <span
                    className="kit-segment__fill"
                    style={{ width: `${(s.revenueShare / maxShare) * 100}%` }}
                  />
                </span>
                <span className="kit-segment__pct">{formatPercent(s.revenueShare, 0)}</span>
              </div>
              <span className="kit-segment__stats">
                {s.avgOrders.toFixed(1)} orders · {formatCurrency(s.avgSpend)} · {s.daysSinceOrder}d
                since last order
              </span>
              <span className="kit-segment__action">→ {s.action}</span>
            </div>
          );
        })}
      </div>
    );
  },
});

const STOCK_TONE = {
  "In stock": "positive",
  "Low stock": "warning",
  "Out of stock": "negative",
} as const;
const CATEGORY_SLOT: Record<string, number> = { Apparel: 0, Footwear: 1, Accessories: 2, Home: 3 };

function Monogram({ name, category }: { name: string; category: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className="kit-monogram"
      style={{ ["--kit-mono" as string]: SLOTS[CATEGORY_SLOT[category] ?? 6] }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export const ProductPerformance = defineComponent({
  name: "ProductPerformance",
  description:
    "Product table for merchandising: revenue with change, a units sparkline, page views, add-to-cart rate, view-to-purchase rate, return rate (flagged when high), gross margin, and stock status. Pass get_product_performance's products directly.",
  props: z.object({
    products: z.array(passed("A product from get_product_performance")).default([]),
  }),
  component: ({ props }) => {
    const products = (props.products ?? []) as unknown as Product[];
    if (products.length === 0) return <Pending kind="table" rows={8} />;
    const views = products.some((p) => p.views != null);
    return (
      <div className="kit-scroll">
        <table className="kit-table">
          <thead>
            <tr>
              <th>Product</th>
              <th className="kit-num">Revenue</th>
              <th>Units sold</th>
              {views && <th className="kit-num">Views</th>}
              {views && <th className="kit-num">Add to cart</th>}
              {views && <th className="kit-num">Purchase</th>}
              <th className="kit-num">Returns</th>
              <th className="kit-num">Margin</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku ?? p.name}>
                <td>
                  <span className="kit-product">
                    <Monogram name={p.name} category={p.category} />
                    <span className="kit-product__text">
                      <span className="kit-cell-title">{p.name}</span>
                      <span className="kit-muted kit-small">
                        {p.category} · {p.sku}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="kit-num">
                  <span className="kit-stack">
                    <span className="kit-strong">{formatCurrency(p.revenue)}</span>
                    <Change value={p.change} />
                  </span>
                </td>
                <td>
                  <span className="kit-units">
                    {p.trend && <Sparkline values={p.trend} tone="neutral" height={22} />}
                    <span className="kit-num">{formatNumber(p.units)}</span>
                  </span>
                </td>
                {views && (
                  <td className="kit-num">{p.views != null ? formatNumber(p.views) : "—"}</td>
                )}
                {views && (
                  <td className="kit-num">
                    {p.addToCartRate != null ? formatPercent(p.addToCartRate) : "—"}
                  </td>
                )}
                {views && (
                  <td className="kit-num">
                    {p.conversionRate != null ? formatPercent(p.conversionRate) : "—"}
                  </td>
                )}
                <td className="kit-num">
                  <span className={p.returnRate >= 0.12 ? "kit-flag" : ""}>
                    {formatPercent(p.returnRate)}
                  </span>
                </td>
                <td className="kit-num">{formatPercent(p.margin, 0)}</td>
                <td>
                  <span className={`kit-status kit-status--${STOCK_TONE[p.stockStatus]}`}>
                    <i className="kit-status__dot" />
                    {p.stockStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

export const ProductLeaderboard = defineComponent({
  name: "ProductLeaderboard",
  description:
    "Compact ranked list of best-selling products with revenue, units, category, a revenue bar relative to the leader, and the change against the previous period. Pass get_product_performance's products directly.",
  props: z.object({
    products: z.array(passed("A product: {name, revenue, units?, category?, change?}")).default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const products = ((props.products ?? []) as unknown as Product[]).slice(0, props.limit ?? 10);
    if (products.length === 0) return <Pending kind="list" />;
    const top = Math.max(...products.map((p) => p.revenue), 1);
    return (
      <ol className="kit-leaderboard">
        {products.map((product, i) => (
          <li key={`${product.name}-${i}`} className="kit-leaderboard__item">
            <Monogram name={product.name} category={product.category ?? ""} />
            <span className="kit-leaderboard__body">
              <span className="kit-leaderboard__line">
                <span className="kit-leaderboard__name">{product.name}</span>
                <span className="kit-num kit-strong">{formatCurrency(product.revenue)}</span>
              </span>
              <span className="kit-meter">
                <span style={{ width: `${(product.revenue / top) * 100}%` }} />
              </span>
              <span className="kit-leaderboard__line kit-small">
                <span className="kit-muted">
                  {[
                    product.category,
                    product.units != null && `${formatNumber(product.units)} sold`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <DeltaPill change={product.change} />
              </span>
            </span>
          </li>
        ))}
      </ol>
    );
  },
});

export const ExchangeMatrix = defineComponent({
  name: "ExchangeMatrix",
  description:
    "Size exchanges as a grid, size ordered against size swapped to, with the share that went a size up: ExchangeMatrix(returns.exchanges).",
  props: z.object({
    exchanges: passed("get_returns' exchanges, passed whole").optional(),
  }),
  component: ({ props }) => {
    const m = props.exchanges as unknown as
      { category: string; sizes: string[]; counts: number[][] } | undefined;
    if (!m?.sizes?.length) return <Pending kind="list" rows={6} empty="No size exchanges here." />;
    const max = Math.max(1, ...m.counts.flat());
    const total = m.counts.flat().reduce((a, b) => a + b, 0) || 1;
    const up = m.counts.reduce((t, row, r) => t + row.slice(r + 1).reduce((a, b) => a + b, 0), 0);
    return (
      <div className="kit-exchange">
        <p className="kit-exchange__lead">
          <strong>{Math.round((up / total) * 100)}%</strong> of {m.category.toLowerCase()} exchanges
          went to a larger size
          {up / total > 0.55 ? ": it runs small." : "."}
        </p>
        <div className="kit-exchange__scroll">
          <table className="kit-exchange__table">
            <caption className="kit-visually-hidden">
              {m.category} exchanges by size ordered and size swapped to
            </caption>
            <thead>
              <tr>
                <th scope="col" className="kit-exchange__corner">
                  Ordered → swapped to
                </th>
                {m.sizes.map((size) => (
                  <th key={size} scope="col">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.counts.map((row, r) => (
                <tr key={m.sizes[r]}>
                  <th scope="row">{m.sizes[r]}</th>
                  {row.map((count, c) => (
                    <td
                      key={c}
                      className={
                        c === r
                          ? "kit-exchange__cell kit-exchange__cell--same"
                          : "kit-exchange__cell"
                      }
                      style={{
                        background: count
                          ? `color-mix(in srgb, var(--kit-s1) ${Math.round(8 + (count / max) * 72)}%, var(--kit-card))`
                          : undefined,
                        color: count / max > 0.55 ? "var(--kit-on-accent, #fff)" : undefined,
                      }}
                    >
                      {count || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});

/** Segments best first, with first orders coming in at the top and lapsed customers leaving at the bottom. */
const SEGMENT_ORDER = [
  "First order",
  "Champions",
  "Loyal",
  "Promising",
  "New",
  "Needs attention",
  "At risk",
  "Almost lost",
  "Dormant",
  "Lapsed",
];

export const SegmentFlow = defineComponent({
  name: "SegmentFlow",
  description:
    "How customers moved between RFM segments over 90 days, as ribbons from then to now colored by direction, with the biggest moves in words: SegmentFlow(segments.movement).",
  props: z.object({
    moves: z.array(passed("A move from get_customer_segments")).default([]),
  }),
  component: ({ props }) => {
    const moves = (props.moves ?? []) as unknown as {
      from: string;
      to: string;
      customers: number;
    }[];
    if (moves.length === 0) return <Pending kind="columns" />;
    return (
      <SegmentFlowView
        links={moves.map((m) => ({ from: m.from, to: m.to, value: m.customers }))}
        order={SEGMENT_ORDER}
        source="First order"
        sink="Lapsed"
      />
    );
  },
});

export const ProductQuadrant = defineComponent({
  name: "ProductQuadrant",
  description:
    "Products by sell-through and gross margin, sized by net sales, in four quadrants: Winners, Push (slow, high margin), Volume (fast, thin), Review. Pass get_product_performance's products with limit 16.",
  props: z.object({
    products: z.array(passed("A product from get_product_performance")).default([]),
  }),
  component: ({ props }) => {
    const products = (props.products ?? []) as unknown as Product[];
    if (products.length === 0) return <Pending kind="trend" />;
    const margins = products.map((p) => p.margin * 100);
    const lo = Math.floor(Math.min(...margins) / 5) * 5;
    const hi = Math.ceil(Math.max(...margins) / 5) * 5;
    return (
      <QuadrantChart
        points={products.map((p) => ({
          name: p.name,
          x: Math.round(p.sellThrough * 1000) / 10,
          y: Math.round(p.margin * 1000) / 10,
          size: p.revenue,
          change: { text: formatChange(p.change), good: p.change >= 0 },
        }))}
        x={{
          title: "Sell-through: % of available stock sold",
          domain: [0, 100],
          ticks: [0, 25, 50, 75, 100],
          format: (t) => `${t}%`,
        }}
        y={{
          title: "Gross margin",
          domain: [lo, hi],
          ticks: Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5),
          format: (t) => `${t}%`,
        }}
        quadrants={{
          highHigh: "Winners",
          lowHigh: "Push",
          highLow: "Volume",
          lowLow: "Review",
        }}
        describe={(p) => [
          { name: "sell-through", value: `${p.x}%` },
          { name: "gross margin", value: `${p.y}%` },
          { name: "net sales", value: formatCurrency(p.size) },
        ]}
        sizeLabel="Bubble size: net sales"
      />
    );
  },
});

interface Creative {
  name: string;
  platform: string;
  format: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  ctrChange: number;
  hookRate?: number;
  holdRate?: number;
  frequency?: number;
  fatigue: "Fresh" | "Watch" | "Fatigued";
  belowBreakEven: boolean;
}

const FATIGUE_TONE = { Fresh: "positive", Watch: "warning", Fatigued: "negative" } as const;

export const CreativeLeaderboard = defineComponent({
  name: "CreativeLeaderboard",
  description:
    "Ad creatives by spend: ROAS against break-even, CTR and its change, hook and hold rates for video, frequency, and a fatigue badge: CreativeLeaderboard(ads.creatives, ads.breakEvenRoas). LargeCard only.",
  props: z.object({
    creatives: z.array(passed("A creative from get_creatives")).default([]),
    breakEvenRoas: z.number().optional(),
  }),
  component: ({ props }) => {
    const creatives = (props.creatives ?? []) as unknown as Creative[];
    if (creatives.length === 0) return <Pending kind="list" rows={6} />;
    const rate = (v?: number) =>
      v == null ? (
        <span className="kit-muted">—</span>
      ) : (
        <span className="kit-creative__rate">
          <span className="kit-creative__meter" aria-hidden>
            <span style={{ width: `${Math.min(100, v * 200)}%` }} />
          </span>
          {formatPercent(v, 0)}
        </span>
      );
    return (
      <div className="kit-scroll">
        <table className="kit-table kit-creatives">
          <thead>
            <tr>
              <th>Creative</th>
              <th className="kit-num">Spend</th>
              <th className="kit-num">ROAS</th>
              <th className="kit-num">CTR</th>
              <th>Hook</th>
              <th>Hold</th>
              <th className="kit-num">Frequency</th>
              <th>Fatigue</th>
            </tr>
          </thead>
          <tbody>
            {[...creatives]
              .sort((a, b) => b.spend - a.spend)
              .map((c) => (
                <tr key={c.name}>
                  <td>
                    <span className="kit-cell-title">{c.name}</span>
                    <span className="kit-muted kit-small">
                      {" "}
                      {c.platform} · {c.format}
                    </span>
                  </td>
                  <td className="kit-num">{formatCurrency(c.spend)}</td>
                  <td className={`kit-num ${c.belowBreakEven ? "kit-text-bad" : "kit-text-good"}`}>
                    {c.roas.toFixed(2)}x
                    {props.breakEvenRoas != null && c.belowBreakEven && (
                      <span className="kit-small kit-muted">
                        {" "}
                        &lt; {props.breakEvenRoas.toFixed(1)}x
                      </span>
                    )}
                  </td>
                  <td className="kit-num">
                    {formatPercent(c.ctr, 2)} <Change value={c.ctrChange} />
                  </td>
                  <td>{rate(c.hookRate)}</td>
                  <td>{rate(c.holdRate)}</td>
                  <td className="kit-num">{c.frequency != null ? c.frequency.toFixed(1) : "—"}</td>
                  <td>
                    <span className={`kit-status kit-status--${FATIGUE_TONE[c.fatigue]}`}>
                      <i className="kit-status__dot" />
                      {c.fatigue}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  },
});

export const InventoryAlerts = defineComponent({
  name: "InventoryAlerts",
  description:
    "Products to restock, most urgent first: a days-of-cover timeline with the reorder point, when the open order lands, and any gap; the order-by date; sales at risk; and ad spend still pointing at it. Pass get_inventory_health's items.",
  props: z.object({
    items: z.array(passed("An item from get_inventory_health")).default([]),
  }),
  component: ({ props }) => {
    const items = (props.items ?? []) as unknown as InventoryItem[];
    if (items.length === 0)
      return <Pending kind="list" empty="Every product is above its reorder point." />;
    return (
      <ul className="kit-alerts">
        {items.map((item) => {
          const severity = item.stock === 0 ? "out" : item.daysOfCover < 7 ? "critical" : "low";
          const tag = { out: "Out of stock", critical: "Critical", low: "Low" }[severity];
          const reorderDays = item.reorderPoint / (item.dailySales || 1);
          const lands = item.incomingInDays;
          // One timeline for every row's marks: today on the left, days ahead to the right.
          const span = Math.max(30, reorderDays + 4, (lands ?? 0) + 4);
          const at = (days: number) => `${Math.min(100, (days / span) * 100)}%`;
          const gapStart = item.daysOfCover;
          const gapEnd = gapStart + item.stockoutGapDays;
          const atRisk = item.revenueAtRisk + (item.lostRevenue ?? 0);
          return (
            <li key={item.sku} className="kit-alert">
              <div className="kit-alert__head">
                <span>
                  <span className="kit-cell-title">{item.name}</span>
                  <span className="kit-muted kit-small"> {item.sku}</span>
                </span>
                <span
                  className={`kit-status kit-status--${severity === "low" ? "warning" : "negative"}`}
                >
                  <i className="kit-status__dot" />
                  {tag}
                </span>
              </div>
              <div className="kit-alert__cover">
                <span className="kit-alert__days">
                  {item.daysOfCover.toFixed(1)}
                  <small> days left</small>
                </span>
                <span
                  className="kit-alert__timeline"
                  role="img"
                  aria-label={`${item.daysOfCover.toFixed(1)} days of cover; reorder point at ${Math.round(reorderDays)} days${lands != null ? `; order lands in ${lands} days` : ""}${item.stockoutGapDays > 0 ? `; ${Math.ceil(item.stockoutGapDays)} days with nothing to sell` : ""}`}
                >
                  <span
                    className={`kit-alert__fill kit-alert__fill--${severity}`}
                    style={{ width: at(item.daysOfCover) }}
                  />
                  {item.stockoutGapDays > 0 && (
                    <span
                      className="kit-alert__gap"
                      style={{ left: at(gapStart), width: `calc(${at(gapEnd)} - ${at(gapStart)})` }}
                    />
                  )}
                  <span className="kit-alert__tick" style={{ left: at(reorderDays) }} />
                  {lands != null && (
                    <span
                      className="kit-alert__po"
                      style={{ left: at(lands) }}
                      title="Order lands"
                    />
                  )}
                </span>
              </div>
              <div className="kit-alert__meta">
                <span>
                  {formatNumber(item.stock)} on hand · {item.dailySales.toFixed(0)}/day ·{" "}
                  {item.incoming
                    ? `${formatNumber(item.incoming)} land in ${lands}d`
                    : "no open order"}
                  {item.stockoutGapDays > 0 && (
                    <span className="kit-text-bad">
                      {" "}
                      · {Math.ceil(item.stockoutGapDays)}-day gap
                    </span>
                  )}
                </span>
                <span className={item.daysLate ? "kit-text-bad kit-strong" : "kit-strong"}>
                  {item.replenishBy === "Now"
                    ? `Order now${item.daysLate ? ` (${item.daysLate}d late)` : ""}`
                    : `Order by ${item.replenishBy}`}
                  {item.suggestedOrder ? ` · ${formatNumber(item.suggestedOrder)} units` : ""}
                </span>
              </div>
              {(atRisk > 0 || item.adSpendPerDay > 0) && (
                <div className="kit-alert__meta">
                  {atRisk > 0 ? (
                    <span className="kit-text-bad">
                      {formatCurrency(atRisk)} {item.lostRevenue ? "lost or at risk" : "at risk"}
                    </span>
                  ) : (
                    <span />
                  )}
                  {item.adSpendPerDay > 0 && (
                    <span className="kit-muted">
                      Ads still running: {formatCurrency(item.adSpendPerDay)}/day
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
});
