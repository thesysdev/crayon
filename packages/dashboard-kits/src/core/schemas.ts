import { z } from "zod/v4";

// Shapes shared by tool outputs and component props. A tool returns exactly
// what the component built for it takes, so a Query result plugs in directly.

export const rangeSchema = z
  .enum(["7d", "30d", "90d"])
  .default("30d")
  .describe("Reporting period: the last 7, 30, or 90 days, compared with the period before it");

/**
 * How chart values are formatted: currency ($48.2K), number (48.2K), percent
 * (values in %), ratio (3.9x), or duration (values in minutes, shown as 6m 14s).
 */
export const formatSchema = z.enum(["currency", "number", "percent", "ratio", "duration"]);

/** A shaded span on a time chart, e.g. a sale or a holiday. */
export const eventSchema = z.object({
  label: z.string(),
  start: z.string().describe("First x label inside the span"),
  end: z.string().describe("Last x label inside the span"),
  detail: z.string().optional().describe("One line shown when hovering the span"),
});

/** A goal or limit drawn across a time chart as a dashed line. */
export const targetSchema = z.object({
  label: z.string().describe('e.g. "Target 2.0x"'),
  value: z.number(),
});

/** A healthy or benchmark range shaded across a time chart. */
export const bandSchema = z.object({
  label: z.string().describe('e.g. "Healthy 3–5x"'),
  from: z.number(),
  to: z.number(),
});

/** A time series against the same span of the previous period. */
export const trendSchema = z.object({
  labels: z.array(z.string()),
  current: z.array(z.number()),
  previous: z.array(z.number()).optional(),
  format: formatSchema.optional(),
  events: z.array(eventSchema).optional(),
  asOf: z.string().optional().describe('When the data was last updated, e.g. "Oct 10, 3:48 PM"'),
  partial: z
    .boolean()
    .optional()
    .describe("The last point is still in progress (today, or this week), so it is drawn dotted"),
  target: targetSchema.optional(),
  band: bandSchema.optional(),
});

export const kpiSchema = z.object({
  label: z.string(),
  value: z.string().describe('Formatted value, e.g. "$48.2K"'),
  previous: z.string().optional().describe("Formatted value for the previous period"),
  change: z.number().optional().describe("Percent change against the previous period"),
  goodDirection: z
    .enum(["up", "down", "neutral"])
    .optional()
    .describe("Whether an increase is good (up), bad (down), or neither (neutral); defaults to up"),
  series: z.array(z.number()).optional().describe("Recent values, oldest first, for a sparkline"),
  hint: z.string().optional().describe("Definition or benchmark shown under the value"),
  trend: trendSchema
    .optional()
    .describe("The full trend, shown in HeroMetric when this KPI's tile is selected"),
});

/** One line or column series. */
export const seriesSchema = z.object({
  name: z.string(),
  values: z.array(z.number()),
  emphasis: z
    .enum(["primary", "muted"])
    .optional()
    .describe("primary draws in the accent with an area wash; muted draws in gray for context"),
});

/** A ranked or part-to-whole item for BarList and ShareBar. */
export const itemSchema = z.object({
  name: z.string(),
  key: z
    .string()
    .optional()
    .describe("The filter value this item stands for; selecting the item sets the filter to it"),
  value: z.number(),
  share: z.number().optional().describe("Share of the total, 0–1"),
  change: z.number().optional().describe("Percent change against the previous period"),
});

export const insightSchema = z.object({
  tone: z.enum(["positive", "negative", "warning", "info"]),
  title: z.string(),
  detail: z.string(),
  metric: z.string().optional().describe('Short figure shown beside the insight, e.g. "+18%"'),
});

export const funnelStepSchema = z.object({
  label: z.string(),
  value: z.number(),
  previous: z.number().optional().describe("The same step in the previous period"),
  medianTime: z
    .string()
    .optional()
    .describe("Median time to reach this step from the previous one"),
});

/** Progress toward a goal for a calendar period, with the running total to date. */
export const goalSchema = z.object({
  label: z.string().describe('e.g. "October sales goal"'),
  goal: z.number(),
  format: formatSchema.optional(),
  labels: z.array(z.string()).describe("One label per day of the whole goal period"),
  cumulative: z
    .array(z.number())
    .describe("Running total for each day so far; shorter than labels until the period ends"),
  asOf: z.string().optional(),
});

/** One block of a status tracker, e.g. a day of fulfillment against its target. */
export const trackerItemSchema = z.object({
  label: z.string(),
  status: z.enum(["good", "warn", "bad", "none"]),
  value: z.string().optional().describe('The day\'s figure, e.g. "97.2% on time"'),
  detail: z.string().optional(),
});

export const cohortRowSchema = z.object({
  cohort: z.string(),
  size: z.number(),
  values: z
    .array(z.number())
    .describe("One value per period since the cohort started; young cohorts have fewer"),
});

/**
 * Every KPI tool returns the period it covers, the hero metric a dashboard
 * leads with and its trend against the previous period, and the other KPIs.
 */
export const kpiOutput = {
  periodLabel: z
    .string()
    .describe('The period and its comparison, e.g. "Sep 11 – Oct 10 vs prior 30 days"'),
  hero: kpiSchema.describe(
    "The headline metric: HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)",
  ),
  heroTrend: trendSchema,
  metrics: z
    .array(kpiSchema)
    .describe("The supporting KPIs, each with its trend: KpiStrip(kpis.metrics, $metric)"),
};

export type Range = z.infer<typeof rangeSchema>;
export type ValueFormat = z.infer<typeof formatSchema>;
export type Kpi = z.infer<typeof kpiSchema>;
export type Trend = z.infer<typeof trendSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Target = z.infer<typeof targetSchema>;
export type Band = z.infer<typeof bandSchema>;
export type TrackerItem = z.infer<typeof trackerItemSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ChartEvent = z.infer<typeof eventSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type FunnelStep = z.infer<typeof funnelStepSchema>;
export type CohortRow = z.infer<typeof cohortRowSchema>;
