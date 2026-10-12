import { z } from "zod/v4";
import { defineTool } from "../core/kit";
import {
  cohortRowSchema,
  funnelStepSchema,
  goalSchema,
  insightSchema,
  itemSchema,
  kpiOutput,
  rangeSchema,
} from "../core/schemas";

// Data contract for Relay, a team workspace app (boards, tasks, docs) with
// Free, Team, and Business plans on web, iOS, and Android. Metric names follow
// PostHog, Amplitude, and Mixpanel.

const platform = z
  .enum(["all", "web", "ios", "android"])
  .default("all")
  .describe("Client platform");
const plan = z
  .enum(["all", "free", "team", "business"])
  .default("all")
  .describe("The workspace's plan");

export const featureSchema = z.object({
  name: z.string(),
  breadth: z.number().describe("Percent of monthly active users who used the feature, 0–100"),
  frequency: z.number().describe("Average days per week the feature is used, among its users"),
  users: z.number(),
  change: z
    .number()
    .describe("Change in breadth, in percentage points, against the previous period"),
});

export const trackedEventSchema = z.object({
  name: z.string(),
  count: z.number(),
  users: z.number(),
  perUser: z.number(),
  change: z.number().describe("Percent change in count against the previous period"),
});

export const pathSchema = z.object({
  steps: z.array(z.string()).describe("Events in order after the start event"),
  users: z.number(),
  share: z.number().describe("Share of users who started, 0–1"),
  outcome: z.enum(["activated", "in progress", "dropped"]),
});

export const experimentSchema = z.object({
  name: z.string(),
  hypothesis: z.string(),
  metric: z.string(),
  status: z.enum(["running", "won", "lost", "inconclusive"]),
  daysRunning: z.number(),
  variants: z.array(
    z.object({
      name: z.string(),
      users: z.number().describe("Exposed users"),
      conversion: z.number().describe("Metric value for the variant, percent"),
      lift: z
        .number()
        .optional()
        .describe("Relative lift against control, percent; missing for control"),
      ciLow: z
        .number()
        .optional()
        .describe("Lower bound of the 95% confidence interval for lift, percent"),
      ciHigh: z
        .number()
        .optional()
        .describe("Upper bound of the 95% confidence interval for lift, percent"),
      significance: z.number().optional().describe("1 − p-value, 0–1"),
    }),
  ),
  decision: z.string(),
});

export const accountSchema = z.object({
  name: z.string(),
  plan: z.enum(["Team", "Business"]),
  seats: z.number(),
  activeSeats: z.number().describe("Seats active in the last 7 days"),
  healthScore: z.number().describe("0–100 from seat activity, feature breadth, and trend"),
  change: z.number().describe("Change in health score over 30 days, in points"),
  mrr: z.number(),
  lastActiveDays: z.number().describe("Days since anyone in the workspace was active"),
});

export const analyticsTools = [
  defineTool({
    name: "get_usage_kpis",
    description:
      "Usage KPIs: daily active users as the hero with its daily trend against the prior period, plus weekly and monthly active users, DAU/MAU stickiness, new signups, week-1 activation rate, sessions per user per week, and median session length with sparklines. Every KPI carries its own trend. Feeds HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) and KpiStrip(kpis.metrics, $metric).",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object(kpiOutput),
  }),
  defineTool({
    name: "get_signup_goal",
    description:
      "Progress toward this month's signup goal: the goal, the running total of signups for each day so far, and a label for every day of the month. Feeds GoalPace(goal) directly.",
    input: z.object({ platform }),
    output: goalSchema,
  }),
  defineTool({
    name: "get_active_users",
    description:
      "Daily active users with rolling 7-day (WAU) and 28-day (MAU) active users: daily for 7d and 30d, weekly averages for 90d.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({
      labels: z.array(z.string()),
      dau: z.array(z.number()),
      wau: z.array(z.number()),
      mau: z.array(z.number()),
    }),
  }),
  defineTool({
    name: "get_lifecycle",
    description:
      "Weekly lifecycle (growth accounting): new, returning, and resurrecting users, and dormant users as negative numbers, with the latest quick ratio. Feeds LifecycleChart directly.",
    input: z.object({ platform, plan, weeks: z.number().int().min(4).max(16).default(12) }),
    output: z.object({
      labels: z.array(z.string()),
      newUsers: z.array(z.number()),
      returning: z.array(z.number()),
      resurrecting: z.array(z.number()),
      dormant: z.array(z.number()).describe("Negative: users active last week but not this week"),
      quickRatio: z.string().describe("(new + resurrecting) ÷ dormant for the latest week"),
    }),
  }),
  defineTool({
    name: "get_activation_funnel",
    description:
      "Signup-to-activation funnel for users who signed up in the period: signed up, created a workspace, created a first project, invited a teammate, activated (3+ active days in week 1), with median times and the previous period. Feeds ConversionFunnel directly.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({ steps: z.array(funnelStepSchema), activationRate: z.string() }),
  }),
  defineTool({
    name: "get_retention_cohorts",
    description:
      "Weekly signup cohorts with the percent of each cohort active in each following week. Feeds CohortGrid directly.",
    input: z.object({ platform, plan, weeks: z.number().int().min(4).max(10).default(8) }),
    output: z.object({
      periodLabels: z.array(z.string()),
      cohorts: z.array(cohortRowSchema),
      format: z.enum(["percent", "currency"]),
    }),
  }),
  defineTool({
    name: "get_retention_curves",
    description:
      'Average weekly retention curves (percent active N weeks after signup) for all users and per plan, for LineChart: [Series("Free", curves.free), …].',
    input: z.object({ platform, weeks: z.number().int().min(4).max(12).default(8) }),
    output: z.object({
      labels: z.array(z.string()),
      all: z.array(z.number()),
      free: z.array(z.number()),
      team: z.array(z.number()),
      business: z.array(z.number()),
    }),
  }),
  defineTool({
    name: "get_stickiness",
    description:
      "Power user curve: how many active users were active on 1, 2, … N days of the last 7 or 28 days, and the share who are power users. Feeds PowerUserCurve directly.",
    input: z.object({ platform, plan, window: z.union([z.literal(7), z.literal(28)]).default(7) }),
    output: z.object({
      window: z.number(),
      buckets: z.array(z.object({ days: z.number(), users: z.number() })),
      powerUserShare: z.string(),
    }),
  }),
  defineTool({
    name: "get_feature_engagement",
    description:
      "Feature breadth (percent of monthly active users) and frequency (days per week) for each feature, with the change in breadth. Feeds EngagementMatrix and FeatureAdoption directly.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({ features: z.array(featureSchema) }),
  }),
  defineTool({
    name: "get_activity_heatmap",
    description: "Average events per hour for each weekday (UTC). Feeds ActivityHeatmap directly.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({
      hourLabels: z.array(z.string()),
      days: z.array(z.object({ day: z.string(), values: z.array(z.number()) })),
    }),
  }),
  defineTool({
    name: "get_top_events",
    description:
      "Most frequent tracked events with unique users, events per user, and change. Feeds EventTable(top.events) directly.",
    input: z.object({
      range: rangeSchema,
      platform,
      limit: z.number().int().min(1).max(10).default(8),
    }),
    output: z.object({ events: z.array(trackedEventSchema) }),
  }),
  defineTool({
    name: "get_user_paths",
    description:
      "The most common event sequences in a new user's first session after signup_completed, with how each ended. Feeds UserPaths directly.",
    input: z.object({ range: rangeSchema, platform }),
    output: z.object({ start: z.string(), totalUsers: z.number(), paths: z.array(pathSchema) }),
  }),
  defineTool({
    name: "get_signups_by_source",
    description:
      'Signups by acquisition source with each source\'s week-1 activation rate (percent). items feeds BarList and ShareBar with signups; activation feeds BarList with activation rates (format "percent").',
    input: z.object({ range: rangeSchema, platform }),
    output: z.object({
      labels: z.array(z.string()),
      signups: z.array(z.number()),
      activationRate: z.array(z.number()),
      items: z.array(itemSchema),
      activation: z.array(itemSchema),
    }),
  }),
  defineTool({
    name: "get_experiments",
    description:
      "A/B tests with each variant's exposures, metric value, relative lift, 95% confidence interval, significance, and the decision. Feeds ExperimentResults directly.",
    input: z.object({ status: z.enum(["all", "running", "completed"]).default("all") }),
    output: z.object({ experiments: z.array(experimentSchema) }),
  }),
  defineTool({
    name: "get_account_health",
    description:
      "Paying workspaces: KPIs (paying workspaces, healthy share, MRR at risk, seat utilization) and accounts with seats, weekly active seats, health score, MRR, and last activity. Feeds AccountHealth and KpiStrip directly.",
    input: z.object({
      plan: z.enum(["all", "team", "business"]).default("all"),
      sort: z.enum(["risk", "mrr"]).default("risk"),
      limit: z.number().int().min(1).max(10).default(8),
    }),
    output: z.object({ metrics: kpiOutput.metrics, accounts: z.array(accountSchema) }),
  }),
  defineTool({
    name: "get_product_insights",
    description:
      "Notable changes detected across activation, retention, engagement, experiments, and accounts, most important first. Feeds InsightList directly.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({ insights: z.array(insightSchema) }),
  }),
];
