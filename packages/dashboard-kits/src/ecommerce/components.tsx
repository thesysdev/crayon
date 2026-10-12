"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
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
import { Pending } from "../genui-lib/Pending";
import {
  inventoryItemSchema,
  ledgerLineSchema,
  marketingChannelSchema,
  productSchema,
  segmentSchema,
} from "./tools";

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
    "Waterfall of money from a starting amount to a result: each line adds (blue), subtracts (red), or subtotals (slate), drawn as floating bars on one scale with the amount and the change against the previous period. Pass get_sales_breakdown's or get_profit_breakdown's lines directly.",
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

export const ChannelPerformance = defineComponent({
  name: "ChannelPerformance",
  description:
    "Marketing channel table: spend, attributed revenue with a sparkline, ROAS against the target (with its change), CPA, new customers, and share of revenue, plus a total row. Pass get_marketing_performance's channels and targetRoas directly.",
  props: z.object({
    channels: z.array(marketingChannelSchema).default([]),
    targetRoas: z.number().optional(),
  }),
  component: ({ props }) => {
    const channels = props.channels ?? [];
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
    segments: z.array(segmentSchema).default([]),
  }),
  component: ({ props }) => {
    const segments = props.segments ?? [];
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
    products: z.array(productSchema).default([]),
  }),
  component: ({ props }) => {
    const products = props.products ?? [];
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
    products: z
      .array(
        z.object({
          name: z.string(),
          revenue: z.number(),
          units: z.number().optional(),
          category: z.string().optional(),
          change: z.number().optional(),
        }),
      )
      .default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const products = (props.products ?? []).slice(0, props.limit ?? 10);
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

export const InventoryAlerts = defineComponent({
  name: "InventoryAlerts",
  description:
    "Products that need restocking: days of cover at the current sales rate on a meter against the reorder point, stock on hand, any open purchase order and when it lands (flagging a stockout before it arrives), and the suggested order. Pass get_inventory_health's items directly.",
  props: z.object({
    items: z.array(inventoryItemSchema).default([]),
  }),
  component: ({ props }) => {
    const items = props.items ?? [];
    if (items.length === 0)
      return <Pending kind="list" empty="Every product is above its reorder point." />;
    return (
      <ul className="kit-alerts">
        {items.map((item) => {
          const severity = item.stock === 0 ? "out" : item.daysOfCover < 7 ? "critical" : "low";
          const tag = { out: "Out of stock", critical: "Critical", low: "Low" }[severity];
          const gap =
            item.incomingInDays != null && item.incomingInDays > item.daysOfCover
              ? Math.ceil(item.incomingInDays - item.daysOfCover)
              : 0;
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
                <span className="kit-alert__meter" aria-hidden>
                  <span
                    className={`kit-alert__fill kit-alert__fill--${severity}`}
                    style={{
                      width: `${Math.min(100, (item.stock / (item.reorderPoint || 1)) * 100)}%`,
                    }}
                  />
                </span>
              </div>
              <div className="kit-alert__meta">
                <span>
                  {formatNumber(item.stock)} on hand · reorder at {formatNumber(item.reorderPoint)}{" "}
                  · {item.dailySales.toFixed(0)}/day
                </span>
              </div>
              {(item.incoming || item.suggestedOrder) && (
                <div className="kit-alert__meta">
                  <span className={gap ? "kit-text-bad" : ""}>
                    {item.incoming
                      ? `${formatNumber(item.incoming)} arriving in ${item.incomingInDays}d${gap ? ` · ${gap}-day stockout` : ""}`
                      : "No open purchase order"}
                  </span>
                  {item.suggestedOrder ? (
                    <span className="kit-strong">Order {formatNumber(item.suggestedOrder)}</span>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
});
