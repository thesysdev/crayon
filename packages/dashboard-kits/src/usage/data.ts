import type { z } from "zod/v4";
import { PRODUCT_EVENTS } from "../analytics/calendar";
import { workspaces } from "../analytics/workspaces";
import { formatCurrency, formatNumber, formatPoints } from "../core/format";
import type { MetricDefinition } from "../core/metrics";
import { AS_OF, dateLabel, kpi, random, round } from "../core/sample-data";
import type { ChartEvent, Insight, Kpi } from "../core/schemas";
import { countIn, detailOf, type Detail } from "./activity";
import { editorsIn, itemModel } from "./items";
import {
  activeBetween,
  dayIndex,
  HISTORY_DAYS,
  sum,
  workspaceModel,
  type Member,
  type MemberStatus,
  type WorkspaceModel,
} from "./members";
import { definitionOf, METRICS, type MetricId } from "./metrics";
import { usageTools } from "./tools";

// Handlers for the usage kit: every figure is counted off the workspace's
// members (members.ts), so seats, activity, teams, AI, and credits agree.

type Tools = typeof usageTools;
type Input<N extends Tools[number]["name"]> = z.infer<Extract<Tools[number], { name: N }>["input"]>;
type Window = "7d" | "28d" | "90d";

const WINDOW_DAYS: Record<Window, number> = { "7d": 7, "28d": 28, "90d": 90 };
/** Inactive at 30 days (remind), reclaim 30 days later; never active after 14 days. */
export const RULES = {
  inactive: 30,
  reclaim: 60,
  neverActiveGrace: 14,
  staleInvite: 7,
  minGroup: 5,
};
/** AI actions by kind: their share of a member's actions. */
const AI_KINDS = [
  { action: "Summarize", share: 0.4 },
  { action: "Draft", share: 0.3 },
  { action: "Fill tasks", share: 0.2 },
  { action: "Run an agent", share: 0.1 },
];
const ACTIVITY_RULE =
  "Active = opened or edited a board, task, or doc, commented, or used AI · UTC";

function metric(
  id: MetricId,
  current: number,
  previous: number,
  format: (v: number) => string,
  options: Parameters<typeof kpi>[4] = {},
): Kpi {
  const { label, goodDirection } = METRICS[id] as MetricDefinition;
  return kpi(label, current, previous, format, {
    goodDirection,
    definition: definitionOf(id),
    ...options,
  });
}

/** A KPI's trend over the window, from daily values (kpi()'s ranges don't include 28 days). */
function withTrend(
  k: Kpi,
  days: number,
  current: number[],
  previous: number[],
  format: "number" | "percent" | "currency",
): Kpi {
  return {
    ...k,
    series: current,
    trend: {
      labels: dayLabelsFor(days),
      current: current.map((v) => round(v, 2)),
      previous: previous.map((v) => round(v, 2)),
      format,
      partial: true,
    },
  };
}

const dayLabelsFor = (days: number) =>
  Array.from({ length: days }, (_, i) => dateLabel(days - 1 - i));

// ── Member facts ────────────────────────────────────────────────────────────

export function statusOf(m: Member): MemberStatus {
  if (m.lastActiveAgo == null) return "never_active";
  if (m.lastActiveAgo <= 27) return "active";
  return m.lastActiveAgo <= 89 ? "inactive" : "dormant";
}

/** Days since a member's last activity, or since they joined if never active. */
const daysIdle = (m: Member) => m.lastActiveAgo ?? m.joinedAgo;

/** Seats to reclaim: 30+ days inactive, or never active 14+ days after joining. */
export function reclaimStage(m: Member): "remind" | "reclaim" | undefined {
  const never = m.lastActiveAgo == null;
  const idle = daysIdle(m);
  const due = never ? m.joinedAgo >= RULES.neverActiveGrace : idle >= RULES.inactive;
  if (!due) return undefined;
  const reclaimAt = never ? RULES.neverActiveGrace + 30 : RULES.reclaim;
  return idle >= reclaimAt ? "reclaim" : "remind";
}

/** Members active on a day, in the trailing `span` days ending `ago` days back. */
function activeCount(w: WorkspaceModel, ago: number, span: number): number {
  return w.members.filter((m) => activeBetween(m, ago + span - 1, ago)).length;
}

const activeIn = (w: WorkspaceModel, days: number, offset = 0) =>
  w.members.filter((m) => activeBetween(m, offset + days - 1, offset));

const aiActionsIn = (m: Member, days: number, offset = 0) => {
  let total = 0;
  for (let ago = offset; ago < offset + days && ago < HISTORY_DAYS; ago++) {
    total += m.aiActions[dayIndex(ago)]!;
  }
  return total;
};

const aiUsers = (w: WorkspaceModel, days: number, offset = 0) =>
  w.members.filter((m) => aiActionsIn(m, days, offset) > 0);

const withAccess = (w: WorkspaceModel) => w.members.filter((m) => m.aiAccess);

// ── Credits ─────────────────────────────────────────────────────────────────

function credits(w: WorkspaceModel) {
  const c = w.credits;
  const actions = (days: number, offset = 0) =>
    sum(w.members.map((m) => aiActionsIn(m, days, offset)));
  const used = actions(c.elapsedDays) * c.perAction;
  const share = c.elapsedDays / c.periodDays;
  const pace = used / (c.allowance * share);
  const projected = used / share;
  const ratio = used / c.allowance;
  const alert =
    ratio >= 1
      ? ("100" as const)
      : ratio >= 0.9
        ? ("90" as const)
        : ratio >= 0.75
          ? ("75" as const)
          : projected > c.allowance
            ? ("projected" as const)
            : ("none" as const);
  // Burn: by month for an annual commit, by day for a monthly pool.
  const steps =
    c.kind === "annual"
      ? Array.from({ length: Math.ceil(c.elapsedDays / 30.4) }, (_, k) =>
          Math.min(c.elapsedDays, Math.round((k + 1) * 30.4)),
        )
      : Array.from({ length: c.elapsedDays }, (_, k) => k + 1);
  const burn = steps.map((day) => round(actions(day, c.elapsedDays - day) * c.perAction, 0));
  const ideal = steps.map((day) => round((c.allowance * day) / c.periodDays, 0));
  const labels = steps.map((day) =>
    c.kind === "annual"
      ? new Date(Date.UTC(2026, 9, 10) - (c.elapsedDays - day) * 86_400_000).toLocaleDateString(
          "en-US",
          { month: "short", timeZone: "UTC" },
        ) +
        ` '${String(new Date(Date.UTC(2026, 9, 10) - (c.elapsedDays - day) * 86_400_000).getUTCFullYear()).slice(2)}`
      : dateLabel(c.elapsedDays - day),
  );
  const resetIn = c.periodDays - c.elapsedDays;
  const left = c.allowance - projected;
  const summary =
    c.kind === "annual"
      ? `${formatNumber(used)} of ${formatNumber(c.allowance)} credits used with ${resetIn} days of the commit left${w.aiSince < c.elapsedDays ? `; AI was turned on ${dateLabel(w.aiSince)}, so the months before used none` : ""}. At this pace ${left >= 0 ? `${formatNumber(left)} credits (${formatCurrency(left * CREDIT_PRICE)}) go unused at renewal` : `the commit runs out ${formatNumber(-left)} credits short`}.`
      : `${formatNumber(used)} of ${formatNumber(c.allowance)} credits used ${c.elapsedDays} days into the month. At this pace the pool ${projected > c.allowance ? `runs out around day ${Math.floor((c.allowance / used) * c.elapsedDays)}` : "lasts the month"}.`;
  const monthCredits = (m: Member) => aiActionsIn(m, MONTH_SO_FAR) * c.perAction;
  return {
    used,
    pace,
    projected,
    alert,
    burn,
    ideal,
    labels,
    resetLabel: c.kind === "annual" ? `Renews in ${resetIn} days` : `Resets in ${resetIn} days`,
    summary,
    atLimit: w.members.filter((m) => monthCredits(m) >= c.memberMonthlyLimit),
    // Annual: the year so far 30 days ago. Monthly: the same days of last month.
    previousUsed:
      c.kind === "annual"
        ? actions(c.elapsedDays - 30, 30) * c.perAction
        : actions(c.elapsedDays, 30) * c.perAction,
  };
}

/** What a credit costs, for unused credits at renewal. */
const CREDIT_PRICE = 0.02;
/** Days of October so far: today is the 10th. */
const MONTH_SO_FAR = 10;

// ── Events ──────────────────────────────────────────────────────────────────

function eventsFor(days: number): ChartEvent[] {
  return PRODUCT_EVENTS.filter(
    (e) => e.to < days && !e.anyEventOnly && (e.kind === "holiday" || e.kind === "launch"),
  ).map((e) => ({
    label: e.label,
    start: dateLabel(Math.min(e.from, days - 1)),
    end: dateLabel(e.to),
    detail: e.detail,
    kind: e.kind,
  }));
}

// ── Peers ───────────────────────────────────────────────────────────────────

const BANDS: [number, number, string][] = [
  [1, 24, "1–24 seats"],
  [25, 99, "25–99 seats"],
  [100, 249, "100–249 seats"],
  [250, 10_000, "250+ seats"],
];

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (sorted.length - 1) * p;
  const lo = Math.floor(at);
  return sorted[lo]! + (sorted[Math.min(sorted.length - 1, lo + 1)]! - sorted[lo]!) * (at - lo);
}

// ── Handlers ────────────────────────────────────────────────────────────────

const pct = (v: number) => `${v.toFixed(1)}%`;
const share = (n: number, of: number) => (of ? (n / of) * 100 : 0);

export const usageHandlers: Record<string, (args: any) => unknown> = {
  get_workspace_overview({ workspace, window }: Input<"get_workspace_overview">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    // Seat utilization each day: members active in the 28 days to it ÷ paid seats.
    const utilization = (offset: number) =>
      Array.from({ length: days }, (_, i) =>
        share(activeCount(w, offset + days - 1 - i, 28), w.paidSeats),
      );
    const daily = (offset: number) =>
      Array.from({ length: days }, (_, i) => activeCount(w, offset + days - 1 - i, 1));
    const monthly = (offset: number) =>
      Array.from({ length: days }, (_, i) => activeCount(w, offset + days - 1 - i, 28));
    const now = utilization(0);
    const before = utilization(days);
    const active = [activeIn(w, days).length, activeIn(w, days, days).length];
    const stick = (offset: number) => {
      const d = daily(offset);
      const m = monthly(offset);
      return d.map((v, i) => share(v, m[i]!));
    };
    const returning = (offset: number) => {
      const then = new Set(activeIn(w, days, offset + days).map((m) => m.id));
      const both = activeIn(w, days, offset).filter((m) => then.has(m.id)).length;
      return share(both, then.size);
    };
    const access = withAccess(w).length;
    const adoption = [aiUsers(w, days).length, aiUsers(w, days, days).length].map((n) =>
      share(n, access),
    );
    const cr = credits(w);
    const reclaim = w.members.filter((m) => reclaimStage(m)).length;
    const reclaimBefore = w.members.filter((m) => {
      // A month ago: the same rule on idleness 30 days shorter.
      const idle = daysIdle(m) - 30;
      return m.lastActiveAgo == null
        ? m.joinedAgo - 30 >= RULES.neverActiveGrace
        : idle >= RULES.inactive;
    }).length;
    const window28 = `${window === "28d" ? "Last 28 days" : `Last ${days} days`}`;
    return {
      periodLabel: `${dateLabel(days - 1)} – ${dateLabel(0, true)} vs the ${days} days before`,
      workspaceLabel: `${w.name} · ${w.plan} · ${w.paidSeats} seats · renews in ${w.renewalInDays} days`,
      hero: metric("seat_utilization", now.at(-1)!, before.at(-1)!, pct, {
        series: now,
        hint: `${activeCount(w, 0, 28)} of ${w.paidSeats} paid seats active in 28 days`,
      }),
      heroTrend: {
        labels: dayLabelsFor(days),
        current: now.map((v) => round(v, 1)),
        previous: before.map((v) => round(v, 1)),
        format: "percent" as const,
        events: eventsFor(days),
        asOf: AS_OF,
        partial: true,
      },
      metrics: [
        withTrend(
          metric("active_members", active[0]!, active[1]!, formatNumber, { hint: window28 }),
          days,
          monthly(0),
          monthly(days),
          "number",
        ),
        withTrend(
          metric("stickiness", sum(stick(0)) / days, sum(stick(days)) / days, pct),
          days,
          stick(0),
          stick(days),
          "percent",
        ),
        metric("returning_members", returning(0), returning(days), pct),
        metric("ai_adoption", adoption[0]!, adoption[1]!, pct, {
          hint: `${aiUsers(w, days).length} of ${access} members with AI on`,
        }),
        metric(
          "credit_pace",
          cr.pace * 100,
          (cr.previousUsed /
            (w.credits.allowance *
              Math.max(0.01, (w.credits.elapsedDays - 30) / w.credits.periodDays))) *
            100,
          (v) => `${v.toFixed(0)}%`,
          {
            hint: cr.resetLabel,
          },
        ),
        metric("reclaimable_seats", reclaim, reclaimBefore, formatNumber, {
          hint: `${formatCurrency(reclaim * w.pricePerSeat)} a month`,
        }),
      ],
      rules: [
        ACTIVITY_RULE,
        `Inactive after ${RULES.inactive} days; dormant after 90`,
        `Compared with the ${days} days before`,
        `Data as of ${AS_OF} UTC · updates daily`,
      ],
    };
  },

  get_seat_inventory({ workspace }: Input<"get_seat_inventory">) {
    const w = workspaceModel(workspace);
    const by = (s: MemberStatus) => w.members.filter((m) => statusOf(m) === s).length;
    const reclaim = w.members.filter((m) => reclaimStage(m));
    // Seats at renewal: assigned today plus the last 90 days' net additions a month.
    const joined90 = w.members.filter((m) => m.joinedAgo <= 90).length;
    const months = w.renewalInDays / 30.4;
    const atRenewal = Math.round(w.members.length + (joined90 / 3) * months);
    const states = [
      {
        state: "active" as const,
        label: "Active",
        seats: by("active"),
        detail: "Activity in the last 28 days",
      },
      {
        state: "inactive" as const,
        label: "Inactive",
        seats: by("inactive"),
        detail: "No activity for 28–89 days",
      },
      {
        state: "dormant" as const,
        label: "Dormant",
        seats: by("dormant"),
        detail: "No activity for 90+ days",
      },
      {
        state: "never_active" as const,
        label: "Never active",
        seats: by("never_active"),
        detail: "Claimed the seat, never used it",
      },
      {
        state: "pending" as const,
        label: "Pending invites",
        seats: w.invites.length,
        detail: "Invited, not accepted",
      },
      {
        state: "unassigned" as const,
        label: "Unassigned",
        seats: w.unassigned,
        detail: "Paid for, nobody on it",
      },
    ];
    const saving = (reclaim.length + w.unassigned) * w.pricePerSeat;
    return {
      paid: w.paidSeats,
      guests: w.guests.length,
      states,
      metrics: [
        metric(
          "seat_utilization",
          share(by("active"), w.paidSeats),
          share(activeCount(w, 30, 28), w.paidSeats),
          pct,
        ),
        metric(
          "reclaimable_seats",
          reclaim.length,
          w.members.filter((m) => daysIdle(m) - 30 >= RULES.inactive).length,
          formatNumber,
          {
            hint: `${formatCurrency(reclaim.length * w.pricePerSeat * 12)} a year`,
          },
        ),
        metric("pending_invites", w.invites.length, w.invites.length, formatNumber, {
          hint: `${w.invites.filter((i) => i.sentAgo >= RULES.staleInvite).length} stale (7+ days)`,
        }),
      ],
      forecast: `${atRenewal} seats assigned at renewal in ${w.renewalInDays} days at the last 90 days' pace of ${round(joined90 / 3, 1)} new members a month; reclaiming ${reclaim.length} idle seats and ${w.unassigned} unassigned ones saves ${formatCurrency(saving)} a month (${formatCurrency(saving * 12)} a year).`,
    };
  },

  get_members({ workspace, view, status, team, names, limit }: Input<"get_members">) {
    const w = workspaceModel(workspace);
    const c = w.credits;
    const list = w.members
      .filter((m) => view !== "reclaim" || reclaimStage(m))
      .filter((m) => status === "all" || statusOf(m) === status)
      .filter((m) => team === "all" || m.team === team)
      .sort((a, b) =>
        view === "reclaim"
          ? daysIdle(b) - daysIdle(a)
          : (a.lastActiveAgo ?? 999) - (b.lastActiveAgo ?? 999),
      );
    const rows = list.slice(0, limit).map((m, k) => {
      const idle = daysIdle(m);
      const stage = reclaimStage(m);
      const label = names === "hide" ? `Member ${k + 1}` : m.name;
      return {
        id: m.id,
        name: label,
        email: names === "hide" ? "hidden" : m.email,
        team: m.team,
        role: m.role,
        status: statusOf(m),
        lastActive:
          m.lastActiveAgo == null
            ? `Never · joined ${dateLabel(m.joinedAgo, m.joinedAgo > 300)}`
            : m.lastActiveAgo === 0
              ? "Today"
              : `${dateLabel(m.lastActiveAgo, m.lastActiveAgo > 300)} · ${m.lastActiveAgo}d ago`,
        ...(stage ? { daysInactive: idle } : {}),
        activeDays: countIn(m.active, 28),
        aiActions: aiActionsIn(m, 28),
        credits: Math.round(aiActionsIn(m, 28) * c.perAction),
        auth: m.auth,
        monthlyCost: w.pricePerSeat,
        ...(stage ? { stage } : {}),
      };
    });
    const reclaim = w.members.filter((m) => reclaimStage(m)).length;
    return {
      rows,
      total: list.length,
      rule: `Remind at ${RULES.inactive} days without activity, reclaim at ${RULES.reclaim}; never-active seats after ${RULES.neverActiveGrace} days`,
      teams: w.teams,
      saving: `${reclaim} seats · ${formatCurrency(reclaim * w.pricePerSeat)} a month`,
    };
  },

  get_invites({ workspace }: Input<"get_invites">) {
    const w = workspaceModel(workspace);
    const joined = w.members.filter((m) => m.joinedAgo <= 90 && m.joinedAgo >= 14);
    const activated = joined.filter((m) =>
      Array.from({ length: 14 }, (_, k) => m.joinedAgo - k).some(
        (ago) => ago >= 0 && m.active[dayIndex(ago)],
      ),
    );
    const stale = w.invites.filter((i) => i.sentAgo >= RULES.staleInvite).length;
    return {
      items: [...w.invites]
        .sort((a, b) => b.sentAgo - a.sentAgo)
        .map((i) => ({ name: `${i.email} · ${i.team}`, value: i.sentAgo })),
      metrics: [
        metric("pending_invites", w.invites.length, w.invites.length, formatNumber, {
          hint: `${stale} stale (7+ days)`,
        }),
        metric(
          "new_member_activation",
          share(activated.length, joined.length),
          share(activated.length, joined.length),
          pct,
          {
            hint: `${activated.length} of ${joined.length} who joined 14–90 days ago`,
          },
        ),
      ],
      note: `Days since each invite was sent; invites pending ${RULES.staleInvite}+ days are stale and still hold a paid seat.`,
    };
  },

  get_activity({ workspace, window }: Input<"get_activity">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    const series = (span: number) =>
      Array.from({ length: days }, (_, i) => activeCount(w, days - 1 - i, span));
    return {
      labels: dayLabelsFor(days),
      dau: series(1),
      wau: series(7),
      mau: series(28),
      events: eventsFor(days),
      rule: `${ACTIVITY_RULE} · members active that day, in 7 days, and in 28 days`,
    };
  },

  get_team_adoption({ workspace, window }: Input<"get_team_adoption">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    return {
      rows: w.teams.map((team) => {
        const members = w.members.filter((m) => m.team === team);
        const hidden = members.length < RULES.minGroup;
        const aiOff = w.aiOff.includes(team);
        if (hidden) return { team, members: members.length, hidden, aiOff };
        const active = members.filter((m) => activeBetween(m, days - 1, 0));
        const contributors = members.filter((m) => countIn(detailOf(m).created, days) > 0);
        const ai = members.filter((m) => aiActionsIn(m, days) > 0);
        return {
          team,
          members: members.length,
          hidden,
          aiOff,
          active: round(share(active.length, members.length), 0),
          ...(aiOff ? {} : { aiActive: round(share(ai.length, members.length), 0) }),
          contributors: round(share(contributors.length, members.length), 0),
          credits: Math.round(sum(members.map((m) => aiActionsIn(m, days))) * w.credits.perAction),
        };
      }),
      note: `Teams under ${RULES.minGroup} members show no rates, so no one can be singled out.`,
    };
  },

  get_feature_adoption({ workspace, window }: Input<"get_feature_adoption">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    const active = activeIn(w, days);
    const used = (pick: (d: Detail) => Uint8Array) =>
      share(active.filter((m) => countIn(pick(detailOf(m)), days) > 0).length, active.length);
    const engaged = (pick: (d: Detail) => Uint8Array) =>
      share(
        active.filter((m) => {
          const v = pick(detailOf(m));
          let n = 0;
          for (let ago = 0; ago < days; ago++) if (v[dayIndex(ago)]) n++;
          return n >= 2;
        }).length,
        active.length,
      );
    const ai = share(aiUsers(w, days).length, active.length);
    const created = (offset: number) =>
      sum(w.members.map((m) => countIn(detailOf(m).created, days, offset)));
    const completed = (offset: number) =>
      sum(w.members.map((m) => countIn(detailOf(m).completed, days, offset)));
    return {
      items: [
        {
          name: "Tasks",
          value: round(
            used((d) => d.tasks),
            0,
          ),
          share: round(engaged((d) => d.tasks) / 100, 3),
        },
        {
          name: "Boards",
          value: round(
            used((d) => d.boards),
            0,
          ),
          share: round(engaged((d) => d.boards) / 100, 3),
        },
        {
          name: "Comments",
          value: round(
            used((d) => d.comments),
            0,
          ),
          share: round(engaged((d) => d.comments) / 100, 3),
        },
        {
          name: "Docs",
          value: round(
            used((d) => d.docs),
            0,
          ),
          share: round(engaged((d) => d.docs) / 100, 3),
        },
        { name: "AI", value: round(ai, 0) },
      ].sort((a, b) => b.value - a.value),
      metrics: [
        metric("content_created", created(0), created(days), formatNumber),
        kpi("Tasks completed", completed(0), completed(days), formatNumber, {
          definition: {
            formula: "Tasks marked done in the window",
            window: "Selected window, against the window before",
            basis: "Members' tasks",
          },
        }),
      ],
    };
  },

  get_ai_adoption({ workspace, window }: Input<"get_ai_adoption">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    const access = withAccess(w).length;
    const users = [aiUsers(w, days), aiUsers(w, days, days)];
    const actions = (offset: number) => sum(w.members.map((m) => aiActionsIn(m, days, offset)));
    const cr = credits(w);
    // Intensity each of the last 12 weeks: power 15+ actions in the week,
    // habitual 3–14, occasional 1–2 (weekly cuts of the 12-week bands).
    const weeks = Array.from({ length: 12 }, (_, k) => (11 - k) * 7);
    const band = (offset: number, lo: number, hi: number) =>
      w.members.filter((m) => {
        const n = aiActionsIn(m, 7, offset);
        return n >= lo && n <= hi;
      }).length;
    const kinds = actions(0);
    return {
      metrics: [
        metric(
          "ai_adoption",
          share(users[0]!.length, access),
          share(users[1]!.length, access),
          pct,
          {
            hint: `${users[0]!.length} of ${access} members with AI on`,
          },
        ),
        metric(
          "ai_actions_per_user",
          actions(0) / Math.max(1, users[0]!.length),
          actions(days) / Math.max(1, users[1]!.length),
          (v) => v.toFixed(1),
        ),
        metric("credits_used", cr.used, cr.previousUsed, formatNumber, { hint: cr.resetLabel }),
        metric("members_at_limit", cr.atLimit.length, cr.atLimit.length, formatNumber),
      ],
      weeks: weeks.map((ago) => dateLabel(ago + 6)),
      power: weeks.map((ago) => band(ago, 15, 999)),
      habitual: weeks.map((ago) => band(ago, 3, 14)),
      occasional: weeks.map((ago) => band(ago, 1, 2)),
      features: AI_KINDS.map((k) => ({ name: k.action, value: Math.round(kinds * k.share) })),
      aiOff: w.aiOff,
    };
  },

  get_credits({ workspace }: Input<"get_credits">) {
    const w = workspaceModel(workspace);
    const c = w.credits;
    const cr = credits(w);
    // Teams under 5 members are pooled, so no one's use can be singled out.
    const teamCreditsOf = (members: Member[]) =>
      Math.round(sum(members.map((m) => aiActionsIn(m, c.elapsedDays))) * c.perAction);
    const big = w.teams.filter(
      (t) => w.members.filter((m) => m.team === t).length >= RULES.minGroup,
    );
    const small = w.members.filter((m) => !big.includes(m.team));
    const teamCredits = [
      ...big.map((team) => ({
        name: team,
        value: teamCreditsOf(w.members.filter((m) => m.team === team)),
      })),
      ...(small.length
        ? [{ name: "Smaller teams (under 5 each)", value: teamCreditsOf(small) }]
        : []),
    ]
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value);
    const total = sum(teamCredits.map((t) => t.value));
    return {
      pool: {
        kind: c.kind,
        allowance: c.allowance,
        used: Math.round(cr.used),
        pace: round(cr.pace * 100, 0),
        projected: Math.round(cr.projected),
        alert: cr.alert,
        resetLabel: cr.resetLabel,
        labels: cr.labels,
        burn: cr.burn,
        ideal: cr.ideal,
        summary: cr.summary,
      },
      byTeam: teamCredits.map((t) => ({ ...t, share: round(t.value / Math.max(1, total), 4) })),
      metrics: [
        metric("credit_pace", cr.pace * 100, cr.pace * 100, (v) => `${v.toFixed(0)}%`, {
          hint: cr.resetLabel,
        }),
        metric("credits_used", cr.used, cr.previousUsed, formatNumber, {
          hint: `of ${formatNumber(c.allowance)} ${c.kind === "annual" ? "this contract year" : "this month"}`,
        }),
        metric("members_at_limit", cr.atLimit.length, cr.atLimit.length, formatNumber, {
          hint: `Limit ${formatNumber(c.memberMonthlyLimit)} credits a member a month`,
        }),
      ],
      atLimit: cr.atLimit.map((m) => `${m.name} · ${m.team}`),
    };
  },

  get_value_estimate({ workspace, window, minutes, rate }: Input<"get_value_estimate">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    const perAction = Number(minutes);
    const hourly = Number(rate);
    const total = sum(w.members.map((m) => aiActionsIn(m, days)));
    const lines = AI_KINDS.map((k) => {
      const actions = Math.round(total * k.share);
      return {
        action: k.action,
        actions,
        minutes: perAction,
        hours: round((actions * perAction) / 60, 1),
      };
    });
    const hours = sum(lines.map((l) => l.hours));
    const users = aiUsers(w, days).length;
    return {
      hours: round(hours, 0),
      value: Math.round(hours * hourly),
      lines,
      minutes: perAction,
      rate: hourly,
      perMember: round(hours / Math.max(1, users), 1),
      formula: `${formatNumber(total)} AI actions × ${perAction} minutes ÷ 60 = ${formatNumber(Math.round(hours))} hours × $${hourly} an hour`,
      caveat:
        "An estimate, not a measurement: it assumes each AI action saves the same few minutes. Microsoft's Copilot Dashboard uses 6 minutes and $72 an hour by default.",
    };
  },

  get_collaboration({ workspace, window }: Input<"get_collaboration">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    const model = itemModel(w);
    const read = (offset: number) => {
      const editors = editorsIn(model, days, offset);
      let together = 0;
      let across = 0;
      for (const set of editors.values()) {
        if (set.size >= 2) together++;
        if (new Set([...set].map((k) => w.members[k]!.team)).size >= 2) across++;
      }
      const comments = sum(w.members.map((m) => countIn(detailOf(m).comments, days, offset)));
      const active = activeIn(w, days, offset).length;
      return {
        editors,
        items: editors.size,
        together,
        across,
        perMember: comments / Math.max(1, active),
      };
    };
    const now = read(0);
    const before = read(days);
    // Team pairs that share items, and each team's share of items it worked on with others.
    const big = new Set(
      w.teams.filter((t) => w.members.filter((m) => m.team === t).length >= RULES.minGroup),
    );
    const label = (team: string) => (big.has(team) ? team : "Smaller teams");
    const pairs = new Map<string, number>();
    const touched = new Map<string, { all: number; shared: number }>();
    for (const set of now.editors.values()) {
      const teams = [...new Set([...set].map((k) => label(w.members[k]!.team)))].sort();
      for (const team of teams) {
        const t = touched.get(team) ?? { all: 0, shared: 0 };
        t.all++;
        if (teams.length >= 2) t.shared++;
        touched.set(team, t);
      }
      for (let a = 0; a < teams.length; a++)
        for (let b = a + 1; b < teams.length; b++) {
          const key = `${teams[a]} and ${teams[b]}`;
          pairs.set(key, (pairs.get(key) ?? 0) + 1);
        }
    }
    const pct = (v: number) => `${v.toFixed(0)}%`;
    return {
      metrics: [
        metric(
          "collaborative_items",
          share(now.together, now.items),
          share(before.together, before.items),
          pct,
          {
            hint: `${formatNumber(now.together)} of ${formatNumber(now.items)} items`,
          },
        ),
        metric(
          "cross_team_items",
          share(now.across, now.items),
          share(before.across, before.items),
          pct,
          {
            hint: `${formatNumber(now.across)} items`,
          },
        ),
        metric("comments_per_member", now.perMember, before.perMember, (v) => v.toFixed(1)),
        metric("active_items", now.items, before.items, formatNumber),
      ],
      pairs: [...pairs.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
      byTeam: [...touched.entries()]
        .map(([name, t]) => ({ name, value: round(share(t.shared, t.all), 0) }))
        .sort((a, b) => b.value - a.value),
      note: `Boards and docs edited in the window; teams under ${RULES.minGroup} members are pooled as "Smaller teams".`,
    };
  },

  get_champions({ workspace, window, by, names }: Input<"get_champions">) {
    const w = workspaceModel(workspace);
    const days = WINDOW_DAYS[window];
    const model = itemModel(w);
    const { item, member, ago } = model.edits;
    const stats = w.members.map(() => ({ created: 0, edits: 0, helped: 0 }));
    for (let k = 0; k < item.length; k++) {
      if (ago[k]! >= days) continue;
      const it = model.items[item[k]!]!;
      const s = stats[member[k]!]!;
      if (it.creator === member[k] && it.bornAgo === ago[k]) s.created++;
      else s.edits++;
      if (it.shared || it.team !== w.members[member[k]!]!.team) s.helped++;
    }
    // Members can opt out of the leaderboard (as Notion lets them opt out of view tracking).
    const optedOut = w.members.filter((m) => random(`optout:${m.id}`)() < 0.08);
    const out = new Set(optedOut.map((m) => m.id));
    const ranked = w.members
      .map((m, k) => {
        const comments = countIn(detailOf(m).comments, days);
        const st = stats[k]!;
        // Helping counts work on other teams' and shared items; comments only break ties.
        const score =
          by === "helping"
            ? st.helped * 10 + Math.min(9, Math.floor(comments / 5))
            : st.created * 5 + st.edits + comments;
        return { m, ...st, comments, score };
      })
      .filter((r) => !out.has(r.m.id) && r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return {
      rows: ranked.map((r, k) => ({
        rank: k + 1,
        name: names === "show" ? r.m.name : `Champion ${k + 1}`,
        // With names hidden, a team under 5 members would still point at someone.
        team:
          names === "hide" && w.members.filter((m) => m.team === r.m.team).length < RULES.minGroup
            ? "A smaller team"
            : r.m.team,
        score: r.score,
        created: r.created,
        edits: r.edits,
        comments: r.comments,
        helped: r.helped,
      })),
      note: `${by === "helping" ? "Ranked by edits on other teams' and shared items, comments breaking ties" : "Score: 5 per board or doc started, 1 per item edited a day, 1 per comment"}. ${optedOut.length} ${optedOut.length === 1 ? "member has" : "members have"} opted out of the leaderboard.${names === "hide" ? " Names are hidden; an admin can show them." : ""}`,
    };
  },

  get_peer_benchmarks({ workspace }: Input<"get_peer_benchmarks">) {
    const w = workspaceModel(workspace);
    const [lo, hi, label] = BANDS.find(([a, b]) => w.paidSeats >= a && w.paidSeats <= b)!;
    const pool = workspaces().filter((x) => x.seats >= lo && x.seats <= hi && x.name !== w.name);
    // Peers' AI adoption and activation are modelled from their engagement
    // (our model); seat utilization is their record.
    const peer = pool.map((x) => {
      const engaged = x.active28 / Math.max(1, x.claimed);
      return {
        utilization: share(x.active28, x.seats),
        ai: Math.min(95, 15 + 55 * engaged * (x.breadth / 7) + between(`peer-ai:${x.id}`, -8, 8)),
        activation: Math.min(98, 55 + 35 * engaged + between(`peer-act:${x.id}`, -6, 6)),
      };
    });
    const access = withAccess(w).length;
    const joined = w.members.filter((m) => m.joinedAgo <= 90 && m.joinedAgo >= 14);
    const activated = joined.filter((m) =>
      Array.from({ length: 14 }, (_, k) => m.joinedAgo - k).some(
        (ago) => ago >= 0 && m.active[dayIndex(ago)],
      ),
    );
    const mine = {
      utilization: share(activeCount(w, 0, 28), w.paidSeats),
      ai: share(aiUsers(w, 28).length, access),
      activation: joined.length ? share(activated.length, joined.length) : 100,
    };
    const row = (metricName: string, key: keyof typeof mine, note: string) => ({
      metric: metricName,
      value: round(mine[key], 1),
      median: round(
        percentile(
          peer.map((p) => p[key]),
          0.5,
        ),
        1,
      ),
      topQuartile: round(
        percentile(
          peer.map((p) => p[key]),
          0.75,
        ),
        1,
      ),
      format: "percent" as const,
      note,
    });
    return {
      rows: [
        row("Seat utilization", "utilization", "Active in 28 days ÷ paid seats"),
        row("AI adoption", "ai", "Members using AI in 28 days ÷ members with AI on"),
        row("New member activation", "activation", "Joined in 90 days and active within 14"),
      ],
      pool: `Relay workspaces with ${label} (${formatNumber(pool.length)}), median and top quartile`,
    };
  },

  get_security({ workspace }: Input<"get_security">) {
    const w = workspaceModel(workspace);
    const by = (a: Member["auth"]) => w.members.filter((m) => m.auth === a).length;
    const scim = w.members.filter((m) => m.scim).length;
    const next = random(`security:${w.id}`);
    const publicLinks = Math.round(w.paidSeats * (0.08 + next() * 0.2));
    const canEdit = w.guests.filter((g) => g.canEdit).length;
    const events = securityEvents(w, next);
    return {
      coverage: [
        {
          label: "How members sign in",
          parts: [
            { name: "SSO", value: by("SSO"), tone: "good" as const },
            { name: "Password + 2FA", value: by("2FA"), tone: "warn" as const },
            { name: "Password only", value: by("Password"), tone: "bad" as const },
          ],
          note:
            by("Password") > 0
              ? `${by("Password")} members sign in with a password alone.`
              : "Every member uses SSO or two-factor sign-in.",
        },
        {
          label: "How members were added",
          parts: [
            { name: "SCIM", value: scim, tone: "good" as const },
            { name: "Invited by hand", value: w.members.length - scim, tone: "warn" as const },
          ],
          note: scim
            ? `${w.members.length - scim} members were added outside the identity provider, so leaving the company won't remove them.`
            : "No identity provider sync: members leave only when an admin removes them.",
        },
        {
          label: "Guests",
          parts: [
            { name: "Can view", value: w.guests.length - canEdit, tone: "good" as const },
            { name: "Can edit", value: canEdit, tone: "warn" as const },
          ],
          note: `${w.guests.length} guests (not paid seats); ${canEdit} can edit.`,
        },
      ],
      metrics: [
        metric(
          "sso_coverage",
          share(by("SSO"), w.members.length),
          share(by("SSO"), w.members.length),
          pct,
        ),
        kpi("Public links", publicLinks, Math.round(publicLinks * 0.9), formatNumber, {
          goodDirection: "down",
          definition: {
            formula: "Boards and docs anyone with the link can open",
            window: "Today, against 30 days ago",
            basis: "Links still enabled",
          },
        }),
        kpi("Guests", w.guests.length, w.guests.length - 1, formatNumber, {
          goodDirection: "neutral",
          definition: {
            formula: "People outside the workspace invited to specific boards or docs",
            window: "Today, against 30 days ago",
            basis: "Guests are free; they hold no paid seat",
          },
        }),
      ],
      events,
    };
  },

  get_usage_insights({ workspace, window }: Input<"get_usage_insights">) {
    return { insights: insightsFor(workspaceModel(workspace), WINDOW_DAYS[window]) };
  },

  get_admin_actions({ workspace }: Input<"get_admin_actions">) {
    return { actions: actionsFor(workspaceModel(workspace)) };
  },
};

function between(seed: string, min: number, max: number) {
  return min + random(seed)() * (max - min);
}

function securityEvents(w: WorkspaceModel, next: () => number) {
  const owner = w.members.find((m) => m.role === "Owner")!.name;
  const admins = w.members.filter((m) => m.role !== "Member").map((m) => m.name);
  const someone = () => w.members[Math.floor(next() * w.members.length)]!;
  const events = [
    ...w.invites.slice(0, 3).map((i) => ({
      ago: i.sentAgo,
      actor: admins[0] ?? owner,
      action: "Invited a member",
      detail: `${i.email} to ${i.team}`,
      kind: "seats" as const,
    })),
    {
      ago: 2,
      actor: owner,
      action: "Changed a role",
      detail: `${someone().name} to Admin`,
      kind: "roles" as const,
    },
    {
      ago: 4,
      actor: admins[1] ?? owner,
      action: "Created a public link",
      detail: "Q4 vendor onboarding board",
      kind: "sharing" as const,
    },
    {
      ago: 9,
      actor: owner,
      action: "Removed a member",
      detail: `${someone().name}'s seat returned to the pool`,
      kind: "seats" as const,
    },
    ...(w.aiOff.length
      ? [
          {
            ago: 16,
            actor: owner,
            action: "Kept AI off",
            detail: `${w.aiOff.join(", ")}: AI stays off pending review`,
            kind: "ai" as const,
          },
        ]
      : []),
    {
      ago: 21,
      actor: owner,
      action: "Required two-factor sign-in",
      detail: "For members without SSO",
      kind: "security" as const,
    },
  ];
  return events
    .sort((a, b) => a.ago - b.ago)
    .map((e) => ({
      when: e.ago === 0 ? "Today" : `${dateLabel(e.ago)} · ${e.ago}d ago`,
      actor: e.actor,
      action: e.action,
      detail: e.detail,
      kind: e.kind,
    }));
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${formatNumber(n)} ${n === 1 ? one : many}`;

function insightsFor(w: WorkspaceModel, days: number): Insight[] {
  const out: Insight[] = [];
  const reclaim = w.members.filter((m) => reclaimStage(m));
  const saving = (reclaim.length + w.unassigned) * w.pricePerSeat;
  const before = activeCount(w, 90, 28);
  const now = activeCount(w, 0, 28);
  if (reclaim.length) {
    out.push({
      tone: w.renewalInDays <= 60 ? "negative" : "warning",
      kind: "workspace_risk",
      title: `${plural(reclaim.length + w.unassigned, "paid seat")} idle, ${w.renewalInDays} days before renewal`,
      detail: `${plural(reclaim.length, "member")} with no activity for ${RULES.inactive}+ days (or never started)${w.unassigned ? ` and ${plural(w.unassigned, "unassigned seat")}` : ""}. Reclaiming them saves ${formatCurrency(saving)} a month.`,
      metric: formatCurrency(saving * 12),
    });
  }
  const free = w.unassigned + w.invites.length;
  if (share(now, w.paidSeats) >= 90 && free <= 3) {
    const joined90 = w.members.filter((m) => m.joinedAgo <= 90).length;
    out.push({
      tone: "info",
      kind: "workspace_risk",
      title: `Seats nearly full: ${now} of ${w.paidSeats} active`,
      detail: `${plural(free, "seat")} left, counting pending invites. The last 90 days added ${plural(joined90, "member")}; add seats before the next hires.`,
      metric: `${round(share(now, w.paidSeats), 0)}%`,
    });
  }
  if (before - now >= 5) {
    out.push({
      tone: "negative",
      kind: "trend_change",
      title: `Active members fell from ${before} to ${now} in 90 days`,
      detail: `${before - now} fewer members active in 28 days than in the same window 90 days ago; most stopped between ${dateLabel(89)} and ${dateLabel(28)}.`,
      metric: formatPoints(share(now, w.paidSeats) - share(before, w.paidSeats), 0),
    });
  }
  // An annual commit under pace is money left on the table; a monthly pool
  // only matters when it is about to run out.
  const cr = credits(w);
  const annualUnder = w.credits.kind === "annual" && cr.pace < 0.8;
  const runningOut = cr.projected > w.credits.allowance;
  if (annualUnder || runningOut) {
    out.push({
      tone: "warning",
      kind: "pace_to_goal",
      title: runningOut
        ? `AI credits on pace to run out before the reset`
        : `AI credits at ${round(cr.pace * 100, 0)}% of pace`,
      detail: cr.summary,
      metric: `${round(cr.pace * 100, 0)}%`,
    });
  }
  const teams = w.teams
    .map((team) => {
      const members = w.members.filter((m) => m.team === team);
      const ai = members.filter((m) => aiActionsIn(m, days) > 0).length;
      return { team, size: members.length, rate: share(ai, members.length) };
    })
    .filter((t) => t.size >= RULES.minGroup && !w.aiOff.includes(t.team))
    .sort((a, b) => a.rate - b.rate);
  const low = teams[0];
  const high = teams.at(-1);
  if (low && high && low.rate < 40 && high.rate - low.rate >= 20) {
    out.push({
      tone: "info",
      kind: "concentration_risk",
      title: `${low.team} uses AI least: ${round(low.rate, 0)}% against ${round(high.rate, 0)}% in ${high.team}`,
      detail: `Of teams with ${RULES.minGroup}+ members. A short session from ${high.team}'s heaviest users is the usual fix.`,
      metric: `${round(low.rate, 0)}%`,
    });
  }
  if (w.aiOff.length) {
    out.push({
      tone: "info",
      kind: "workspace_risk",
      title: `AI is off for ${w.aiOff.join(" and ")}`,
      detail: `${plural(w.members.filter((m) => !m.aiAccess).length, "member")} can't use AI features; turned off by an admin pending review.`,
      metric: formatNumber(w.members.filter((m) => !m.aiAccess).length),
    });
  }
  const password = w.members.filter((m) => m.auth === "Password").length;
  if (password) {
    out.push({
      tone: "warning",
      kind: "data_quality",
      title: `${plural(password, "member")} ${password === 1 ? "signs" : "sign"} in with a password alone`,
      detail: "No SSO and no two-factor sign-in. Requiring SSO or 2FA for them closes the gap.",
      metric: formatNumber(password),
    });
  }
  const stale = w.invites.filter((i) => i.sentAgo >= RULES.staleInvite).length;
  if (stale) {
    out.push({
      tone: "info",
      kind: "workspace_risk",
      title: `${plural(stale, "invite")} pending a week or more`,
      detail: `${stale === 1 ? "It holds" : "Each holds"} a paid seat until accepted or revoked.`,
      metric: formatNumber(stale),
    });
  }
  return out;
}

function actionsFor(w: WorkspaceModel) {
  const remind = w.members.filter((m) => reclaimStage(m) === "remind");
  const reclaim = w.members.filter((m) => reclaimStage(m) === "reclaim");
  const stale = w.invites.filter((i) => i.sentAgo >= RULES.staleInvite);
  const password = w.members.filter((m) => m.auth === "Password");
  const cr = credits(w);
  const unusedAtRenewal = Math.max(0, w.credits.allowance - cr.projected);
  const lowTeam = w.teams
    .map((team) => {
      const members = w.members.filter((m) => m.team === team);
      return {
        team,
        members,
        rate: share(members.filter((m) => aiActionsIn(m, 28) > 0).length, members.length),
      };
    })
    .filter((t) => t.members.length >= RULES.minGroup && !w.aiOff.includes(t.team))
    .filter((t) => t.rate < 40)
    .sort((a, b) => a.rate - b.rate)[0];
  const actions = [
    ...(reclaim.length
      ? [
          {
            id: "reclaim",
            kind: "change" as const,
            title: `Reclaim ${plural(reclaim.length + w.unassigned, "idle seat")} before renewal`,
            detail: `${plural(reclaim.length, "member")} inactive ${RULES.reclaim}+ days (or never active a month after joining)${w.unassigned ? ` and ${plural(w.unassigned, "unassigned seat")}` : ""}. Their boards and docs stay; they can be re-invited.`,
            impact: (reclaim.length + w.unassigned) * w.pricePerSeat * 12,
            impactText: `${formatCurrency((reclaim.length + w.unassigned) * w.pricePerSeat * 12)} a year`,
            owner: "Workspace admin",
            effort: "Low" as const,
            effect: `Would remove ${plural(reclaim.length, "member's seat", "members' seats")} and lower the plan by ${plural(reclaim.length + w.unassigned, "seat")} at renewal`,
          },
        ]
      : []),
    ...(remind.length
      ? [
          {
            id: "remind",
            kind: "task" as const,
            title: `Remind ${plural(remind.length, "member")} inactive for ${RULES.inactive}+ days`,
            detail: `They keep their seats for now; anyone still inactive at ${RULES.reclaim} days is reclaimed.`,
            impact: remind.length * w.pricePerSeat * 12 * 0.5,
            impactText: `Keeps ${remind.length} seats in use or frees them in 30 days`,
            owner: "Workspace admin",
            effort: "Low" as const,
            effect: `Would email ${remind.length} members that their seat is reclaimed in 30 days if unused`,
          },
        ]
      : []),
    ...(unusedAtRenewal > w.credits.allowance * 0.1 && w.credits.kind === "annual"
      ? [
          {
            id: "right-size-credits",
            kind: "change" as const,
            title: "Lower the AI credit commit at renewal",
            detail: `At this pace ${formatNumber(unusedAtRenewal)} of ${formatNumber(w.credits.allowance)} credits go unused this year.`,
            impact: unusedAtRenewal * CREDIT_PRICE,
            impactText: `${formatCurrency(unusedAtRenewal * CREDIT_PRICE)} a year`,
            owner: "Finance",
            effort: "Low" as const,
            effect: `Would set next year's commit to ${formatNumber(Math.round((cr.projected * 1.15) / 1000) * 1000)} credits, 15% above this year's use`,
          },
        ]
      : []),
    ...(cr.alert !== "none" && cr.projected > w.credits.allowance
      ? [
          {
            id: "raise-pool",
            kind: "change" as const,
            title: "Add credits before the pool runs out",
            detail: cr.summary,
            impact: 1000,
            impactText: "Keeps AI working for every member this month",
            owner: "Workspace admin",
            effort: "Low" as const,
            effect: `Would add ${formatNumber(Math.ceil((cr.projected - w.credits.allowance) / 100) * 100)} credits to this month's pool`,
          },
        ]
      : []),
    ...(lowTeam
      ? [
          {
            id: "ai-session",
            kind: "task" as const,
            title: `Run an AI session for ${lowTeam.team}`,
            detail: `${round(lowTeam.rate, 0)}% of ${lowTeam.team} used AI in the last 28 days.`,
            impact: lowTeam.members.length * 10,
            impactText: `${lowTeam.members.length} members`,
            owner: "Team lead",
            effort: "Medium" as const,
            effect: `Would book a 30-minute session for ${lowTeam.team} and share three prompts their peers use most`,
          },
        ]
      : []),
    ...(password.length
      ? [
          {
            id: "require-sso",
            kind: "change" as const,
            title: `Require SSO or 2FA for ${plural(password.length, "member")}`,
            detail: "They sign in with a password alone.",
            impact: password.length * 5,
            impactText: `${password.length} accounts`,
            owner: "IT",
            effort: "Low" as const,
            effect: `Would ask ${password.length} members to set up two-factor sign-in at their next login`,
          },
        ]
      : []),
    ...(stale.length
      ? [
          {
            id: "resend-invites",
            kind: "task" as const,
            title: `Resend or revoke ${plural(stale.length, "stale invite")}`,
            detail: `Pending ${RULES.staleInvite}+ days, each holding a paid seat.`,
            impact: stale.length * w.pricePerSeat,
            impactText: `${stale.length} seats`,
            owner: "Workspace admin",
            effort: "Low" as const,
            effect: `Would resend ${stale.length} invites; any still pending in 7 days are revoked`,
          },
        ]
      : []),
  ];
  return actions.sort((a, b) => b.impact - a.impact);
}
