import { z } from "zod/v4";
import { defineTool } from "../core/kit";
import { actionSchema, eventSchema, insightSchema, itemSchema, kpiOutput } from "../core/schemas";

// Data contract for a Relay workspace's own admins: the usage page Relay
// shows its customers. Metric names and thresholds follow Slack, GitHub
// Copilot, Microsoft 365, Gemini, Atlassian, and Notion admin analytics.

const workspace = z
  .enum(["brightline", "kestrel", "bluefin"])
  .default("brightline")
  .describe("Brightline Health (180 seats), Kestrel Labs (64), or Bluefin Studio (22)")
  .meta({ filter: "$workspace" });
const window = z
  .enum(["7d", "28d", "90d"])
  .default("28d")
  .describe("Trailing window, against the window before")
  .meta({ filter: "$window" });

export const seatStateSchema = z
  .object({
    state: z.enum(["active", "inactive", "dormant", "never_active", "pending", "unassigned"]),
    label: z.string(),
    seats: z.number(),
    detail: z.string(),
  })
  .meta({ opaque: "SeatState" });

export const memberRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    team: z.string(),
    role: z.string(),
    status: z.enum(["active", "inactive", "dormant", "never_active"]),
    lastActive: z.string(),
    daysInactive: z.number().optional(),
    activeDays: z.number().describe("Days active in the last 28"),
    aiActions: z.number().describe("AI actions in the last 28 days"),
    credits: z.number().describe("AI credits in the last 28 days"),
    auth: z.string(),
    monthlyCost: z.number(),
    stage: z
      .enum(["remind", "reclaim"])
      .optional()
      .describe("Reclaim flow: remind at 30 days inactive, reclaim at 60"),
  })
  .meta({ opaque: "MemberRow" });

export const teamRowSchema = z
  .object({
    team: z.string(),
    members: z.number(),
    hidden: z.boolean().describe("Under 5 members: rates are not shown"),
    active: z.number().optional().describe("Percent active in the window"),
    aiActive: z.number().optional().describe("Percent of the team using AI; absent if AI is off"),
    contributors: z.number().optional().describe("Percent who created or edited content"),
    credits: z.number().optional(),
    aiOff: z.boolean(),
  })
  .meta({ opaque: "TeamRow" });

export const creditSchema = z
  .object({
    kind: z.enum(["annual", "monthly"]),
    allowance: z.number(),
    used: z.number(),
    pace: z.number().describe("Percent of the allowance's share for the time gone"),
    projected: z.number().describe("Credits used by the reset at this pace"),
    alert: z.enum(["none", "75", "90", "100", "projected"]),
    resetLabel: z.string(),
    labels: z.array(z.string()),
    burn: z.array(z.number()).describe("Cumulative credits by day or month of the period so far"),
    ideal: z.array(z.number()).describe("A straight line through the period to the allowance"),
    summary: z.string(),
  })
  .meta({ opaque: "Credits" });

export const benchmarkSchema = z
  .object({
    metric: z.string(),
    value: z.number(),
    median: z.number(),
    topQuartile: z.number(),
    format: z.enum(["percent", "number"]),
    note: z.string(),
  })
  .meta({ opaque: "Benchmark" });

export const valueLineSchema = z
  .object({
    action: z.string(),
    actions: z.number(),
    minutes: z.number(),
    hours: z.number(),
  })
  .meta({ opaque: "ValueLine" });

export const coverageSchema = z
  .object({
    label: z.string(),
    parts: z.array(
      z.object({ name: z.string(), value: z.number(), tone: z.enum(["good", "warn", "bad"]) }),
    ),
    note: z.string(),
  })
  .meta({ opaque: "Coverage" });

export const auditEventSchema = z
  .object({
    when: z.string(),
    actor: z.string(),
    action: z.string(),
    detail: z.string(),
    kind: z.enum(["seats", "roles", "sharing", "security", "ai"]),
  })
  .meta({ opaque: "AuditEvent" });

export const championSchema = z
  .object({
    rank: z.number(),
    name: z.string(),
    team: z.string(),
    score: z.number(),
    created: z.number().describe("Boards and docs started"),
    edits: z.number().describe("Days × items edited"),
    comments: z.number(),
    helped: z.number().describe("Edits on other teams' and shared items"),
  })
  .meta({ opaque: "Champion" });

export const usageTools = [
  defineTool({
    name: "get_workspace_overview",
    description:
      "Workspace usage KPIs: seat utilization as the hero with its daily trend against the window before, plus active members, DAU/MAU, returning members, AI adoption, credit pace, and seats to reclaim, each with its trend; the workspace's plan, seats, and renewal; and how members were counted. Feeds HeroMetric(overview.hero, overview.heroTrend, overview.metrics, $metric), KpiStrip(overview.metrics, $metric), RuleChips(overview.rules).",
    input: z.object({ workspace, window }),
    output: z.object({
      ...kpiOutput,
      workspaceLabel: z.string(),
      rules: z.array(z.string()),
    }),
  }),
  defineTool({
    name: "get_seat_inventory",
    description:
      "Where every paid seat is: active, inactive (30+ days), dormant (90+), never active, pending invites, and unassigned; guests (free) apart; the seats at renewal at the current pace; and the saving if the seats to reclaim are removed. SeatInventory(seats.states, seats.paid), KpiStrip(seats.metrics).",
    input: z.object({ workspace }),
    output: z.object({
      paid: z.number(),
      guests: z.number(),
      states: z.array(seatStateSchema),
      metrics: kpiOutput.metrics,
      forecast: z.string(),
    }),
  }),
  defineTool({
    name: "get_members",
    description:
      'The member directory: one row per member with team, role, status, last active, active days, AI actions and credits in 28 days, sign-in method, and seat cost; filter by status and team. view "reclaim" lists seats to reclaim (30+ days inactive, or never active 14+ days after joining) with their stage in the flow. names "hide" replaces names for screen sharing. MemberTable(members.rows) or ReclaimList(members.rows, members.rule).',
    input: z.object({
      workspace,
      view: z.enum(["all", "reclaim"]).default("all"),
      status: z.enum(["all", "active", "inactive", "dormant", "never_active"]).default("all"),
      team: z.string().default("all").meta({ filter: "$team" }),
      names: z.enum(["show", "hide"]).default("show").meta({ filter: "$names" }),
      limit: z.number().int().min(5).max(500).default(25),
    }),
    output: z.object({
      rows: z.array(memberRowSchema),
      total: z.number(),
      rule: z.string(),
      teams: z.array(z.string()),
      saving: z.string(),
    }),
  }),
  defineTool({
    name: "get_invites",
    description:
      'Pending invites (stale after 7 days) and how new members activate: the share of members who joined in the last 90 days and were active within 14. BarList(invites.items, "number") and KpiStrip(invites.metrics).',
    input: z.object({ workspace }),
    output: z.object({ items: z.array(itemSchema), metrics: kpiOutput.metrics, note: z.string() }),
  }),
  defineTool({
    name: "get_activity",
    description:
      'Daily, weekly (7-day), and monthly (28-day) active members over the window with events marked. TrendChart(activity.labels, [{name: "28 days", values: activity.mau}, {name: "7 days", values: activity.wau}, {name: "Today", values: activity.dau}], "number", "line", activity.events, true).',
    input: z.object({ workspace, window }),
    output: z.object({
      labels: z.array(z.string()),
      dau: z.array(z.number()),
      wau: z.array(z.number()),
      mau: z.array(z.number()),
      events: z.array(eventSchema),
      rule: z.string(),
    }),
  }),
  defineTool({
    name: "get_team_adoption",
    description:
      "Each team's members, share active, share using AI, share contributing, and credits; teams under 5 members show no rates (privacy). Feeds TeamAdoption(teams.rows).",
    input: z.object({ workspace, window }),
    output: z.object({ rows: z.array(teamRowSchema), note: z.string() }),
  }),
  defineTool({
    name: "get_feature_adoption",
    description:
      'Share of active members who used each part of Relay in the window (engaged = 2+ days), and items created. BarList(features.items, "percent"), KpiStrip(features.metrics).',
    input: z.object({ workspace, window }),
    output: z.object({ items: z.array(itemSchema), metrics: kpiOutput.metrics }),
  }),
  defineTool({
    name: "get_ai_adoption",
    description:
      'AI adoption: KPIs, weekly AI-active members by intensity for 12 weeks (power 15+ actions a week, habitual, occasional), AI actions by feature, and teams with AI off. ColumnChart(ai.weeks, [{name: "Power", values: ai.power}, {name: "Habitual", values: ai.habitual}, {name: "Occasional", values: ai.occasional}], "number", true), BarList(ai.features, "number").',
    input: z.object({ workspace, window }),
    output: z.object({
      metrics: kpiOutput.metrics,
      weeks: z.array(z.string()),
      power: z.array(z.number()),
      habitual: z.array(z.number()),
      occasional: z.array(z.number()),
      features: z.array(itemSchema),
      aiOff: z.array(z.string()),
    }),
  }),
  defineTool({
    name: "get_credits",
    description:
      'The AI credit pool: allowance, used, pace, projection at reset, alert (75/90/100% or projected to run out), its burn against a straight line, credits by team (teams under 5 pooled), and members at their limit. CreditBurn(credits.pool), BarList(credits.byTeam, "number"), KpiStrip(credits.metrics).',
    input: z.object({ workspace }),
    output: z.object({
      pool: creditSchema,
      byTeam: z.array(itemSchema),
      metrics: kpiOutput.metrics,
      atLimit: z.array(z.string()),
    }),
  }),
  defineTool({
    name: "get_value_estimate",
    description:
      "Estimated hours saved and their value with the working: AI actions by type × minutes per action, × hourly rate; minutes and rate are inputs. Always an estimate. ValueEstimate(value).",
    input: z.object({
      workspace,
      window,
      minutes: z.enum(["3", "6", "10"]).default("6").meta({ filter: "$minutes" }),
      rate: z.enum(["50", "72", "100"]).default("72").meta({ filter: "$rate" }),
    }),
    output: z.object({
      hours: z.number(),
      value: z.number(),
      lines: z.array(valueLineSchema),
      minutes: z.number(),
      rate: z.number(),
      perMember: z.number(),
      formula: z.string(),
      caveat: z.string(),
    }),
  }),
  defineTool({
    name: "get_collaboration",
    description:
      'How members work together: KPIs (items worked on by 2+ members, items across teams, comments per active member), the team pairs that share the most items, and each team\'s share of items worked on with other teams (teams under 5 pooled). KpiStrip(collab.metrics), BarList(collab.pairs, "number"), BarList(collab.byTeam, "percent").',
    input: z.object({ workspace, window }),
    output: z.object({
      metrics: kpiOutput.metrics,
      pairs: z.array(itemSchema),
      byTeam: z.array(itemSchema),
      note: z.string(),
    }),
  }),
  defineTool({
    name: "get_champions",
    description:
      'The top 10 members by contribution (boards and docs started, items edited, comments) or by helping others (edits on other teams\' and shared items); members who opted out are left out, and names stay hidden unless names is "show". Feeds ChampionList(champions.rows, champions.note).',
    input: z.object({
      workspace,
      window,
      by: z.enum(["contribution", "helping"]).default("contribution").meta({ filter: "$by" }),
      names: z.enum(["show", "hide"]).default("hide").meta({ filter: "$names" }),
    }),
    output: z.object({ rows: z.array(championSchema), note: z.string() }),
  }),
  defineTool({
    name: "get_peer_benchmarks",
    description:
      "This workspace against Relay workspaces of the same size: seat utilization, AI adoption, and new member activation, each with the median and top quartile. Feeds PeerBenchmark(peers.rows, peers.pool).",
    input: z.object({ workspace }),
    output: z.object({ rows: z.array(benchmarkSchema), pool: z.string() }),
  }),
  defineTool({
    name: "get_security",
    description:
      "Security posture: sign-in method coverage (SSO, 2FA, password only), SCIM provisioning, guests and guests who can edit, public links, and recent admin events. SecurityPosture(security.coverage), AuditLog(security.events), KpiStrip(security.metrics).",
    input: z.object({ workspace }),
    output: z.object({
      coverage: z.array(coverageSchema),
      metrics: kpiOutput.metrics,
      events: z.array(auditEventSchema),
    }),
  }),
  defineTool({
    name: "get_usage_insights",
    description:
      "Findings for the workspace's admin, most important first: idle seats before renewal, adoption gaps by team, credit pace, stale invites, sign-in gaps. Feeds InsightList directly.",
    input: z.object({ workspace, window }),
    output: z.object({ insights: z.array(insightSchema) }),
  }),
  defineTool({
    name: "get_admin_actions",
    description:
      "What the admin could do next, biggest effect first, each saying what approving would do: remind or reclaim idle seats, resend invites, turn AI on for a team, change the credit cap, enforce SSO. Feeds ActionCards(actions.actions).",
    input: z.object({ workspace }),
    output: z.object({ actions: z.array(actionSchema) }),
  }),
];

export type UsageTools = typeof usageTools;
