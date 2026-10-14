import {
  definitionOf as define,
  glossary as glossaryOf,
  type MetricDefinition,
} from "../core/metrics";
import type { Definition } from "../core/schemas";

// Every metric the usage tools return, defined once (see core/metrics.ts).
// Thresholds follow what admin pages already use: a 28-day active window
// (Slack, GitHub Copilot, Microsoft's Copilot Dashboard, Gemini), inactive at
// 30 days (GitHub's reclaim guide; Slack bills at 28), dormant at 90.

const WINDOW = "Selected window, against the window before";
const ACTIVITY =
  "Qualifying activity: open or edit a board, task, or doc, comment, or use AI · UTC";

export const METRICS = {
  seat_utilization: {
    label: "Seat utilization",
    formula: "Paid seats whose member had qualifying activity in the last 28 days ÷ paid seats",
    window: "Last 28 days, against the 28 before",
    basis: `${ACTIVITY}; SaaS seats average about 54% (Zylo 2026)`,
  },
  active_members: {
    label: "Active members",
    formula: "Members with qualifying activity in the window",
    window: WINDOW,
    basis: ACTIVITY,
  },
  stickiness: {
    label: "DAU/MAU",
    formula: "Average daily active members ÷ members active in the last 28 days",
    window: WINDOW,
    basis: ACTIVITY,
    glossary: false,
  },
  returning_members: {
    label: "Returning members",
    formula: "Members active in this window and the one before ÷ members active in the one before",
    window: WINDOW,
    basis: ACTIVITY,
  },
  ai_adoption: {
    label: "AI adoption",
    formula: "Members with 1+ AI action in the window ÷ members with AI turned on",
    window: WINDOW,
    basis: "AI actions: summarize, draft, fill tasks, or run an agent",
  },
  ai_actions_per_user: {
    label: "AI actions per AI user",
    formula: "AI actions ÷ members with 1+ AI action, in the window",
    window: WINDOW,
    basis: "AI actions: summarize, draft, fill tasks, or run an agent",
    glossary: false,
  },
  credit_pace: {
    label: "Credit pace",
    formula: "Credits used ÷ the allowance's share for the time gone",
    window: "The current credit period",
    basis: "On track 80–110% (our rule); alerts at 75%, 90%, and 100% of the allowance",
  },
  credits_used: {
    label: "Credits used",
    formula: "AI credits used in the current period",
    window: "The current credit period, against the same days of the one before",
    basis: "Annual commit (Business) or monthly pool (Team)",
    glossary: false,
  },
  members_at_limit: {
    label: "At their limit",
    formula: "Members who used their monthly AI credit limit",
    window: "This month",
    basis: "Each member's monthly limit; their AI actions pause until it resets",
    goodDirection: "down",
    glossary: false,
  },
  reclaimable_seats: {
    label: "Seats to reclaim",
    formula:
      "Paid members with no qualifying activity for 30+ days, or never active 14+ days after joining",
    window: "Today",
    basis:
      "Remind at 30 days, reclaim 30 days later (GitHub's flow); never active after 14 days is our rule",
    goodDirection: "down",
  },
  pending_invites: {
    label: "Pending invites",
    formula: "Invites sent and not yet accepted; stale after 7 days (our rule)",
    window: "Today",
    basis: "Pending invites hold paid seats",
    goodDirection: "down",
    glossary: false,
  },
  new_member_activation: {
    label: "New member activation",
    formula:
      "Members who joined in the last 90 days and were active within 14 days ÷ those who joined",
    window: "Joined in the last 90 days",
    basis: ACTIVITY,
    glossary: false,
  },
  hours_saved: {
    label: "Hours saved (estimate)",
    formula: "AI actions × minutes per action ÷ 60",
    window: WINDOW,
    basis:
      "6 minutes an action by default (Microsoft's Copilot Dashboard); an estimate, not a measurement",
  },
  value_estimate: {
    label: "Value (estimate)",
    formula: "Hours saved × hourly rate",
    window: WINDOW,
    basis: "$72 an hour by default (BLS-based, as Microsoft uses); editable",
    glossary: false,
  },
  collaborative_items: {
    label: "Worked on together",
    formula: "Boards and docs that 2+ members edited in the window ÷ boards and docs edited",
    window: WINDOW,
    basis: "Edits by members; guests not counted",
  },
  cross_team_items: {
    label: "Across teams",
    formula: "Boards and docs edited by members of 2+ teams in the window ÷ boards and docs edited",
    window: WINDOW,
    basis: "Teams as set in the workspace; our definition, as no vendor publishes one",
  },
  comments_per_member: {
    label: "Comments per active member",
    formula: "Comments ÷ active members, in the window",
    window: WINDOW,
    basis: ACTIVITY,
    glossary: false,
  },
  active_items: {
    label: "Items worked on",
    formula: "Boards and docs edited at least once in the window",
    window: WINDOW,
    basis: "Edits by members",
    glossary: false,
  },
  sso_coverage: {
    label: "Signed in with SSO",
    formula: "Members signing in through the identity provider ÷ members",
    window: "Today",
    basis: "Members with SSO; 2FA counts only for members without it",
    glossary: false,
  },
  content_created: {
    label: "Items created",
    formula: "Boards, docs, and tasks created in the window",
    window: WINDOW,
    basis: "Created by members; guests not counted",
    glossary: false,
  },
} satisfies Record<string, MetricDefinition>;

export type MetricId = keyof typeof METRICS;

/** The definition a KPI carries, without its label. */
export const definitionOf = (id: MetricId): Definition => define(METRICS[id]);

/** The usage glossary for the system prompt. */
export const glossary = () => glossaryOf(METRICS);
