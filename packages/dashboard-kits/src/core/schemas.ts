import { z } from "zod/v4";

// Shapes shared by tool outputs and component props. A tool returns exactly
// what the component built for it takes, so a Query result plugs in directly.

export const rangeSchema = z
  .enum(["7d", "30d", "90d", "mtd"])
  .default("30d")
  .describe("Reporting period: the last 7, 30, or 90 days, or this month to date")
  .meta({ filter: "$range" });

export const compareSchema = z
  .enum(["previous_period", "last_year", "plan"])
  .default("previous_period")
  .describe(
    "What the period is compared with: the period just before it, the same weekdays 52 weeks earlier, or the plan",
  )
  .meta({ filter: "$compare" });

/**
 * How chart values are formatted: currency ($48.2K), number (48.2K), percent
 * (values in %), ratio (3.9x), or duration (values in minutes, shown as 6m 14s).
 */
export const formatSchema = z.enum(["currency", "number", "percent", "ratio", "duration"]);

/**
 * Something that happened on a time chart: a shaded span (a sale), or a
 * one-day marker when start and end are the same label (a launch, a tracking
 * change).
 */
export const eventSchema = z.object({
  label: z.string(),
  start: z.string().describe("First x label inside the span"),
  end: z.string().describe("Last x label inside the span; the same as start for a marker"),
  detail: z.string().optional().describe("One line shown when hovering the span"),
  kind: z
    .enum(["promo", "launch", "stockout", "incident", "measurement", "holiday"])
    .optional()
    .describe("measurement marks a tracking or data change, not a real one"),
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
  comparisonLabel: z
    .string()
    .optional()
    .describe(
      'What `previous` is, e.g. "Plan" or "Same days last year"; "Prior period" if left out',
    ),
  format: formatSchema.optional(),
  events: z.array(eventSchema).optional(),
  asOf: z.string().optional().describe('When the data was last updated, e.g. "Oct 10, 3:48 PM"'),
  partial: z
    .boolean()
    .optional()
    .describe("The last point is still in progress (today, or this week), so it is drawn dotted"),
  target: targetSchema.optional(),
  band: bandSchema.optional(),
  summary: z.string().optional().describe("What moved the metric"),
});

/**
 * How a metric is calculated, shown when hovering its value. Marked opaque:
 * the prompt lists it as an object, since only components read its fields.
 */
export const definitionSchema = z
  .object({
    formula: z.string().describe('e.g. "(Gross sales − discounts) ÷ orders"'),
    window: z.string().describe('The time the value covers, e.g. "Selected period"'),
    basis: z
      .string()
      .optional()
      .describe('Where the numbers come from, e.g. "Store orders, not ad-platform claims"'),
  })
  .meta({ opaque: "Definition" });

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
  definition: definitionSchema.optional(),
  usual: z
    .object({
      low: z.string(),
      high: z.string(),
      status: z.enum(["below", "within", "above"]),
      periods: z
        .number()
        .describe("How many earlier periods of the same length the range comes from"),
    })
    .meta({ opaque: "UsualRange" })
    .optional()
    .describe(
      "The metric's own usual range, from its 10th to 90th percentile over earlier periods",
    ),
  trend: trendSchema
    .meta({ opaque: "Trend" })
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
  tone: z.enum(["good", "warn", "bad"]).optional(),
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

export const insightSchema = z
  .object({
    tone: z.enum(["positive", "negative", "warning", "info"]),
    kind: z
      .enum([
        "period_change",
        "top_driver",
        "top_detractor",
        "pace_to_goal",
        "trend_change",
        "concentration_risk",
        "data_quality",
        "stock_risk",
        "below_break_even",
        "workspace_risk",
        "experiment_ready",
      ])
      .optional()
      .describe("What sort of finding it is"),
    title: z.string(),
    detail: z.string(),
    metric: z.string().optional().describe('Short figure shown beside the insight, e.g. "+18%"'),
  })
  .meta({ opaque: "Insight" });

/** A recommended action, with why and its expected effect, to approve or dismiss. */
export const actionSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    detail: z.string(),
    impact: z.number(),
    impactText: z.string(),
    owner: z.string(),
    effort: z.enum(["Low", "Medium", "High"]),
    kind: z
      .enum(["task", "audience", "experiment", "change"])
      .optional()
      .describe("What approving creates: a task, a flag audience, a draft experiment, or a change"),
    effect: z.string().optional().describe("What approving would do, written to the log"),
  })
  .meta({ opaque: "Action" });

/** One step of a variance walk from the comparison to the current value. */
export const walkStepSchema = z
  .object({
    label: z.string(),
    value: z.number().describe("Amount, always positive; kind says how it combines"),
    kind: z.enum(["base", "add", "subtract", "total"]),
  })
  .meta({ opaque: "WalkStep" });

/** Something that moved a metric, with its share of the change. */
export const driverSchema = z
  .object({
    dimension: z.string().describe('What the driver is a part of, e.g. "Sales channel"'),
    name: z.string(),
    delta: z.string().describe('Its change in the metric, signed, e.g. "−$12.3K"'),
    share: z.number().describe("Signed share of the total change it explains"),
    current: z.string(),
    comparison: z.string(),
    tone: z.enum(["good", "bad", "neutral"]),
    detail: z.string().optional(),
  })
  .meta({ opaque: "Driver" });

/** A computed explanation of one metric's change: what drove it and how sure we are. */
export const whySchema = z.object({
  metric: z.string(),
  periodLabel: z.string(),
  comparisonLabel: z.string(),
  value: z.string(),
  comparison: z.string(),
  delta: z.string().describe('Signed change, e.g. "−$22.7K"'),
  change: z.number().describe("Percent change against the comparison"),
  tone: z.enum(["good", "bad", "neutral"]),
  confidence: z.object({
    level: z.enum(["High", "Medium", "Low"]),
    z: z.number(),
    note: z.string(),
  }),
  summary: z
    .string()
    .describe("One or two sentences, written from the numbers, safe to show as is"),
  drivers: z.array(driverSchema).describe("What pushed the metric the way it moved, largest first"),
  offsetting: z.array(driverSchema).describe("What pushed against it"),
  walk: z.array(walkStepSchema).describe("From the comparison to this period, step by step"),
  format: formatSchema,
  dataQuality: z
    .string()
    .optional()
    .describe("A tracking or data change behind part of the move, when there is one"),
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
  projected: z
    .number()
    .optional()
    .describe(
      "Where the tool forecasts the period to finish; a straight line from the pace so far if left out",
    ),
  planToDate: z
    .number()
    .optional()
    .describe(
      "Where the plan says the running total should be by now; a straight line to the goal if left out",
    ),
  range: z.array(z.number()).optional(),
  asOf: z.string().optional(),
});

/** A metric's progress toward its target for a calendar period, and where it is heading. */
export const targetProgressSchema = z
  .object({
    label: z.string(),
    format: formatSchema,
    actual: z.number().describe("So far this period"),
    toDate: z.number().describe("The target for the days so far"),
    target: z.number().describe("The target for the whole period"),
    forecast: z.number().describe("Where the current pace finishes the period"),
    forecastLow: z.number(),
    forecastHigh: z.number().describe("The forecast's 80% range"),
    status: z.enum(["ahead", "on_pace", "behind", "over", "under"]),
    goodDirection: z.enum(["up", "down"]).describe("down for a budget"),
  })
  .meta({ opaque: "TargetProgress" });

/** One row of a heat grid, e.g. a weekday with a value per hour. */
export const heatRowSchema = z
  .object({ label: z.string(), values: z.array(z.number()) })
  .meta({ opaque: "HeatRow" });

/** One block of a status tracker, e.g. a day of fulfillment against its target. */
export const trackerItemSchema = z
  .object({
    label: z.string(),
    status: z.enum(["good", "warn", "bad", "none"]),
    value: z.string().optional().describe('The day\'s figure, e.g. "97.2% on time"'),
    detail: z.string().optional(),
  })
  .meta({ opaque: "TrackerItem" });

export const cohortRowSchema = z
  .object({
    cohort: z.string(),
    size: z.number(),
    values: z
      .array(z.number())
      .describe("One value per period since the cohort started; young cohorts have fewer"),
    predicted: z
      .number()
      .optional()
      .describe("How many of the last values are forecasts, drawn striped"),
    payback: z
      .number()
      .optional()
      .describe("The period in which the cohort earned back what it cost to acquire"),
    partial: z
      .boolean()
      .optional()
      .describe("The last value is a period still in progress, drawn hatched"),
  })
  .meta({ opaque: "CohortRow" });

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
  heroTrend: trendSchema.meta({ opaque: "Trend" }),
  metrics: z
    .array(kpiSchema.meta({ opaque: "Kpi" }))
    .describe("The supporting KPIs, each with its trend: KpiStrip(kpis.metrics, $metric)"),
  rules: z
    .array(z.string())
    .optional()
    .describe("How the numbers are counted, one rule each: RuleChips(kpis.rules)"),
};

/**
 * A prop that takes part of a tool's result whole, typed loosely so the
 * component signature in the prompt stays one line; the tool's own output
 * schema carries the full shape. The component checks what it reads.
 */
export const passed = (what: string) => z.record(z.string(), z.unknown()).describe(what);

export type Range = z.infer<typeof rangeSchema>;
export type Compare = z.infer<typeof compareSchema>;
export type ValueFormat = z.infer<typeof formatSchema>;
export type Kpi = z.infer<typeof kpiSchema>;
export type Definition = z.infer<typeof definitionSchema>;
export type Trend = z.infer<typeof trendSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Target = z.infer<typeof targetSchema>;
export type Band = z.infer<typeof bandSchema>;
export type TrackerItem = z.infer<typeof trackerItemSchema>;
export type TargetProgress = z.infer<typeof targetProgressSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ChartEvent = z.infer<typeof eventSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Driver = z.infer<typeof driverSchema>;
export type Why = z.infer<typeof whySchema>;
export type WalkStep = z.infer<typeof walkStepSchema>;
export type FunnelStep = z.infer<typeof funnelStepSchema>;
export type CohortRow = z.infer<typeof cohortRowSchema>;
