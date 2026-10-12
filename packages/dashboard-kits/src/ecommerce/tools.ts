import { z } from "zod/v4";
import { defineTool } from "../core/kit";
import {
  cohortRowSchema,
  eventSchema,
  funnelStepSchema,
  goalSchema,
  insightSchema,
  itemSchema,
  kpiOutput,
  rangeSchema,
  seriesSchema,
  trackerItemSchema,
} from "../core/schemas";

// Data contract for Sundial Goods, a direct-to-consumer brand selling apparel,
// footwear, accessories, and home goods through its online store, mobile app,
// and Amazon. Metric names follow Shopify, GA4, and Triple Whale.

const channel = z
  .enum(["all", "online", "app", "amazon"])
  .default("all")
  .describe("Sales channel: online store, mobile app, or Amazon");
const category = z
  .enum(["all", "apparel", "footwear", "accessories", "home"])
  .default("all")
  .describe("Product category");
const device = z
  .enum(["all", "desktop", "mobile", "tablet"])
  .default("all")
  .describe("Shopper device (storefront and app only)");

/** A line in a running money breakdown, e.g. gross sales minus discounts. */
export const ledgerLineSchema = z.object({
  label: z.string(),
  value: z.number().describe("Amount, always positive; kind says how it combines"),
  kind: z
    .enum(["base", "add", "subtract", "total"])
    .describe("base starts the breakdown, add and subtract adjust it, total is a subtotal"),
  previous: z.number().optional().describe("The same line in the previous period"),
});

export const marketingChannelSchema = z.object({
  channel: z.string(),
  type: z.enum(["paid", "owned", "organic", "partner"]),
  spend: z.number().describe("Ad spend, platform cost, or commissions"),
  revenue: z.number().describe("Attributed order revenue"),
  roas: z.number().optional().describe("Revenue ÷ spend; missing for organic channels"),
  cpa: z.number().optional().describe("Spend ÷ attributed orders"),
  orders: z.number(),
  newCustomers: z.number(),
  share: z.number().describe("Share of attributed revenue, 0–1"),
  roasChange: z.number().optional().describe("Percent change in ROAS against the previous period"),
  trend: z
    .array(z.number())
    .optional()
    .describe("Attributed revenue over the period, for a sparkline"),
});

export const segmentSchema = z.object({
  name: z.string(),
  tone: z.enum(["positive", "neutral", "warning", "negative"]),
  customers: z.number(),
  customerShare: z.number().describe("Share of customers, 0–1"),
  revenueShare: z.number().describe("Share of 12-month revenue, 0–1"),
  avgOrders: z.number(),
  avgSpend: z.number().describe("Average 12-month spend per customer"),
  daysSinceOrder: z.number().describe("Median days since the last order"),
  action: z.string().describe("Recommended next step for the segment"),
});

export const productSchema = z.object({
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  revenue: z.number(),
  units: z.number(),
  change: z.number().describe("Percent change in revenue against the previous period"),
  views: z.number().optional().describe("Product page views (storefront and app)"),
  addToCartRate: z.number().optional().describe("Add-to-carts ÷ views, 0–1"),
  conversionRate: z.number().optional().describe("Purchases ÷ views, 0–1"),
  returnRate: z.number().describe("Units returned ÷ units sold, 0–1"),
  margin: z.number().describe("Gross margin after cost of goods, 0–1"),
  stockStatus: z.enum(["In stock", "Low stock", "Out of stock"]),
  trend: z.array(z.number()).optional().describe("Units sold over the period, for a sparkline"),
});

export const inventoryItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  stock: z.number(),
  reorderPoint: z
    .number()
    .describe("21 days of sales: 14-day lead time plus 7 days of safety stock"),
  dailySales: z.number().describe("Average units sold per day over the last 30 days"),
  daysOfCover: z.number(),
  incoming: z.number().optional().describe("Units on open purchase orders"),
  incomingInDays: z.number().optional().describe("Days until the open purchase order arrives"),
  suggestedOrder: z.number().optional().describe("Units to order now to cover 45 days"),
});

export const ecommerceTools = [
  defineTool({
    name: "get_store_kpis",
    description:
      "Store KPIs: total sales as the hero with its daily trend against the prior period (Fall sale shaded), plus orders, average order value, conversion rate, sessions, and returning customer rate with sparklines. Every KPI carries its own trend. Feeds HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) and KpiStrip(kpis.metrics, $metric).",
    input: z.object({ range: rangeSchema, channel }),
    output: z.object(kpiOutput),
  }),
  defineTool({
    name: "get_sales_over_time",
    description:
      "Total sales and orders over time with the previous period aligned for comparison: daily for 7d and 30d, weekly for 90d.",
    input: z.object({ range: rangeSchema, channel }),
    output: z.object({
      labels: z.array(z.string()),
      totalSales: z.array(z.number()),
      previousPeriod: z
        .array(z.number())
        .describe("Total sales for the matching days of the previous period"),
      orders: z.array(z.number()),
      events: z.array(eventSchema).describe("Promotions to shade on the chart"),
    }),
  }),
  defineTool({
    name: "get_sales_breakdown",
    description:
      "Shopify-style total sales breakdown: gross sales, discounts, returns, net sales, shipping charges, taxes, and total sales. Feeds MoneyBreakdown directly.",
    input: z.object({ range: rangeSchema, channel }),
    output: z.object({ lines: z.array(ledgerLineSchema) }),
  }),
  defineTool({
    name: "get_sales_by",
    description:
      "Total sales and orders split by sales channel, product category, country, or device. items feeds BarList and ShareBar directly, with share and change; overTime splits the period's sales by the same parts for a stacked ColumnChart.",
    input: z.object({
      range: rangeSchema,
      channel,
      dimension: z.enum(["channel", "category", "country", "device"]).default("channel"),
    }),
    output: z.object({
      labels: z.array(z.string()),
      totalSales: z.array(z.number()),
      orders: z.array(z.number()),
      items: z.array(itemSchema),
      overTime: z
        .object({ labels: z.array(z.string()), series: z.array(seriesSchema) })
        .describe(
          'Sales over time split by the same parts, daily for 7d and 30d, weekly for 90d: ColumnChart(byCategory.overTime.labels, byCategory.overTime.series, "currency", true)',
        ),
    }),
  }),
  defineTool({
    name: "get_marketing_performance",
    description:
      "Marketing efficiency: blended ROAS as the hero with its daily trend, KPIs (ad spend, MER, new-customer CPA, new customers, ncROAS), and per-channel spend, attributed revenue, ROAS against target, CPA, new customers, and a revenue sparkline. Feeds HeroMetric, KpiStrip, and ChannelPerformance directly.",
    input: z.object({ range: rangeSchema }),
    output: z.object({
      ...kpiOutput,
      channels: z.array(marketingChannelSchema),
      targetRoas: z.number().describe("The ROAS paid channels are expected to reach"),
    }),
  }),
  defineTool({
    name: "get_profit_breakdown",
    description:
      "Contribution profit: net sales, cost of goods, gross profit, shipping and fulfillment, payment and marketplace fees, ad spend, other marketing, and contribution profit. Feeds MoneyBreakdown directly.",
    input: z.object({ range: rangeSchema }),
    output: z.object({
      lines: z.array(ledgerLineSchema),
      grossMargin: z.string(),
      contributionMargin: z.string(),
    }),
  }),
  defineTool({
    name: "get_purchase_journey",
    description:
      "GA4-style purchase journey for the storefront and app: session start, product view, add to cart, begin checkout, purchase, with the previous period and median times. Feeds ConversionFunnel directly.",
    input: z.object({ range: rangeSchema, device }),
    output: z.object({ steps: z.array(funnelStepSchema), conversionRate: z.string() }),
  }),
  defineTool({
    name: "get_checkout_journey",
    description:
      "GA4-style checkout journey: begin checkout, add shipping info, add payment info, purchase, with the previous period. Feeds ConversionFunnel directly.",
    input: z.object({ range: rangeSchema, device }),
    output: z.object({ steps: z.array(funnelStepSchema), checkoutCompletion: z.string() }),
  }),
  defineTool({
    name: "get_customer_kpis",
    description:
      "Customer KPIs: new customers as the hero with its daily trend, plus customers, returning customer rate, 12-month repeat purchase rate, time between orders, 12-month LTV, and LTV:CAC. Feeds HeroMetric and KpiStrip directly.",
    input: z.object({ range: rangeSchema }),
    output: z.object(kpiOutput),
  }),
  defineTool({
    name: "get_new_vs_returning",
    description:
      "Sales and customers from new versus returning customers over time: daily for 7d and 30d, weekly for 90d.",
    input: z.object({ range: rangeSchema }),
    output: z.object({
      labels: z.array(z.string()),
      newCustomerSales: z.array(z.number()),
      returningCustomerSales: z.array(z.number()),
      newCustomers: z.array(z.number()),
      returningCustomers: z.array(z.number()),
    }),
  }),
  defineTool({
    name: "get_order_journey",
    description:
      "How customers progress from their 1st to 5th order over the last 12 months, with the median days between orders and the prior 12 months for comparison. Feeds ConversionFunnel directly.",
    input: z.object({}),
    output: z.object({ steps: z.array(funnelStepSchema) }),
  }),
  defineTool({
    name: "get_customer_cohorts",
    description:
      "Monthly first-order cohorts by months since the first order: cumulative revenue per customer (LTV) or the cumulative share who ordered again (repeat rate). Feeds CohortGrid directly.",
    input: z.object({
      metric: z.enum(["ltv", "repeat_rate"]).default("ltv"),
      months: z
        .number()
        .int()
        .min(4)
        .max(9)
        .default(9)
        .describe("How many monthly cohorts to show"),
    }),
    output: z.object({
      periodLabels: z.array(z.string()),
      cohorts: z.array(cohortRowSchema),
      format: z.enum(["percent", "currency"]),
    }),
  }),
  defineTool({
    name: "get_customer_segments",
    description:
      "RFM customer segments over the last 12 months (Champions, Loyal, Promising, New, Needs attention, At risk, Almost lost, Dormant) with size, revenue share, and the recommended action. Feeds CustomerSegments directly.",
    input: z.object({}),
    output: z.object({ totalCustomers: z.number(), segments: z.array(segmentSchema) }),
  }),
  defineTool({
    name: "get_product_performance",
    description:
      "Products ranked by revenue with units, change, page views, add-to-cart rate, view-to-purchase rate, return rate, margin, and stock status. Feeds ProductPerformance and ProductLeaderboard directly.",
    input: z.object({
      range: rangeSchema,
      channel,
      category,
      limit: z.number().int().min(1).max(16).default(8),
    }),
    output: z.object({ products: z.array(productSchema) }),
  }),
  defineTool({
    name: "get_inventory_health",
    description:
      "Inventory KPIs and the products that need restocking: stock against reorder point, days of cover, open purchase orders, and the suggested order. Feeds InventoryAlerts and KpiStrip directly.",
    input: z.object({ category }),
    output: z.object({ metrics: kpiOutput.metrics, items: z.array(inventoryItemSchema) }),
  }),
  defineTool({
    name: "get_sales_goal",
    description:
      "Progress toward this month's sales goal: the goal, the running total of sales for each day so far, and a label for every day of the month. Feeds GoalPace(goal) directly.",
    input: z.object({ channel }),
    output: goalSchema,
  }),
  defineTool({
    name: "get_fulfillment_sla",
    description:
      "Share of orders shipped within 48 hours on each day of the period against the 95% target, with today still in progress. Feeds Tracker(sla.days, sla.summary) directly.",
    input: z.object({ range: rangeSchema }),
    output: z.object({ days: z.array(trackerItemSchema), summary: z.string() }),
  }),
  defineTool({
    name: "get_recent_orders",
    description:
      'Latest orders, newest first. Pluck columns for Table: Col("Order", recent.orders.id).',
    input: z.object({ channel, limit: z.number().int().min(1).max(20).default(8) }),
    output: z.object({
      orders: z.array(
        z.object({
          id: z.string(),
          customer: z.string(),
          channel: z.string(),
          items: z.number(),
          total: z.string(),
          fulfillment: z.enum(["Unfulfilled", "Fulfilled", "Partially fulfilled", "Refunded"]),
          country: z.string(),
          placedAt: z.string(),
        }),
      ),
    }),
  }),
  defineTool({
    name: "get_store_insights",
    description:
      "Notable changes detected across sales, marketing, conversion, inventory, and returns for the period, most important first. Feeds InsightList directly.",
    input: z.object({ range: rangeSchema, channel }),
    output: z.object({ insights: z.array(insightSchema) }),
  }),
];
