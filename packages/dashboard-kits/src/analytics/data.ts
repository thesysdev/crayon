import type { z } from "zod/v4";
import { formatDuration, formatNumber } from "../core/format";
import {
  AS_OF,
  RANGE_DAYS,
  between,
  bucket,
  dailySeries,
  dateLabel,
  dayLabels,
  eventSpan,
  kpi,
  mean,
  periodLabel,
  random,
  round,
  sum,
} from "../core/sample-data";
import type { ChartEvent, Insight } from "../core/schemas";
import { analyticsTools } from "./tools";

// Relay: a demo team workspace app. Daily activity per platform and plan drives
// the active-user, lifecycle, activation, and retention tools, so they agree.

type Tools = typeof analyticsTools;
type Input<N extends Tools[number]["name"]> = z.output<
  Extract<Tools[number], { name: N }>["input"]
>;
type Platform = "web" | "ios" | "android";
type Plan = "free" | "team" | "business";

const HISTORY = 200;

const PLATFORMS: Record<
  Platform,
  {
    dau: number;
    mau: number;
    signups: number;
    activation: number;
    retention: number;
    session: number;
  }
> = {
  web: { dau: 15200, mau: 2.7, signups: 0.7, activation: 1.06, retention: 1, session: 7.7 },
  ios: { dau: 4900, mau: 3.1, signups: 0.18, activation: 0.92, retention: 0.9, session: 3.4 },
  android: { dau: 2700, mau: 3.5, signups: 0.12, activation: 0.74, retention: 0.74, session: 3.1 },
};
const PLANS: Record<
  Plan,
  {
    dau: number;
    mau: number;
    signups: number;
    activation: number;
    retention: number;
    label: string;
  }
> = {
  free: { dau: 0.45, mau: 1.22, signups: 0.78, activation: 0.84, retention: 0.66, label: "Free" },
  team: { dau: 0.34, mau: 0.9, signups: 0.17, activation: 1.38, retention: 1.32, label: "Team" },
  business: {
    dau: 0.21,
    mau: 0.78,
    signups: 0.05,
    activation: 1.62,
    retention: 1.6,
    label: "Business",
  },
};
const SIGNUPS_PER_DAY = 520;
/** The week of Labor Day (Sep 7) had an unusual number of dormant users. */
const HOLIDAY_DAYS_AGO = new Set([30, 31, 32, 33, 34]);

const platformsFor = (p: string) =>
  p === "all" ? (Object.keys(PLATFORMS) as Platform[]) : [p as Platform];
const plansFor = (p: string) => (p === "all" ? (Object.keys(PLANS) as Plan[]) : [p as Plan]);
const segments = (platform: string, plan: string) =>
  platformsFor(platform).flatMap((pf) => plansFor(plan).map((pl) => [pf, pl] as const));

const dauCache = new Map<string, number[]>();
/** Daily active users for one platform and plan, oldest first, over the full history. */
function dauHistory(pf: Platform, pl: Plan): number[] {
  const key = `${pf}:${pl}`;
  const cached = dauCache.get(key);
  if (cached) return cached;
  const base = PLATFORMS[pf].dau * PLANS[pl].dau;
  const values = dailySeries(`dau:${key}`, HISTORY, base, {
    weekend: 0.42,
    growth: 0.14,
    noise: 0.12,
  }).map((v, i) => (HOLIDAY_DAYS_AGO.has(HISTORY - 1 - i) ? v * 0.7 : v));
  dauCache.set(key, values);
  return values;
}

function dau(platform: string, plan: string, days: number, offset = 0): number[] {
  const out = new Array(days).fill(0);
  for (const [pf, pl] of segments(platform, plan)) {
    const values = dauHistory(pf, pl);
    for (let i = 0; i < days; i++) {
      // Before the start of the history, reuse its first week, weekday for weekday.
      const at = HISTORY - offset - days + i;
      out[i] += values[at >= 0 ? at : ((at % 7) + 7) % 7];
    }
  }
  return out;
}

function signups(platform: string, plan: string, days: number, offset = 0): number[] {
  const share = sum(
    segments(platform, plan).map(([pf, pl]) => PLATFORMS[pf].signups * PLANS[pl].signups),
  );
  return dailySeries(`signups:${platform}:${plan}`, HISTORY, SIGNUPS_PER_DAY * share, {
    weekend: 0.55,
    growth: 0.18,
    noise: 0.2,
  }).slice(HISTORY - offset - days, HISTORY - offset);
}

/** Weighted multiplier of a per-platform and per-plan attribute for the selected users. */
/** Monthly and weekly active users as multiples of daily active users. */
const mauRatio = (platform: string, plan: string) => factor(platform, plan, "mau");
const wauRatio = (platform: string, plan: string) => 1 + (mauRatio(platform, plan) - 1) * 0.42;

function factor(platform: string, plan: string, key: "activation" | "retention" | "mau") {
  const segs = segments(platform, plan);
  const weights = segs.map(([pf, pl]) => PLATFORMS[pf].dau * PLANS[pl].dau);
  const values = segs.map(([pf, pl]) => PLATFORMS[pf][key] * PLANS[pl][key]);
  return sum(values.map((v, i) => v * weights[i])) / sum(weights);
}

/** Week-1 activation rate: the onboarding checklist v2 shipped 18 days ago lifted it. */
function activationRate(platform: string, plan: string, daysAgo: number) {
  const shipped = daysAgo < 18 ? 1.1 : 1;
  return Math.min(0.85, 0.27 * factor(platform, plan, "activation") * shipped);
}

/**
 * Users active in the trailing window, for each day of the period: the window's
 * average daily actives times the segment's WAU or MAU ratio. A holiday counts
 * as the same weekday a week earlier, because people who skip one still count
 * as active that week or month.
 */
function activeInWindow(
  platform: string,
  plan: string,
  days: number,
  window: number,
  ratio: number,
  offset = 0,
): number[] {
  const lead = window - 1 + 7;
  const daily = dau(platform, plan, days + lead, offset);
  const filled = daily
    .map((v, k) =>
      k >= 7 && HOLIDAY_DAYS_AGO.has(offset + days + lead - 1 - k) ? daily[k - 7] : v,
    )
    .slice(7);
  return Array.from({ length: days }, (_, i) => mean(filled.slice(i, i + window)) * ratio);
}

const FEATURES = [
  { name: "Boards", breadth: 91, frequency: 4.1, mobile: 1 },
  { name: "Tasks and comments", breadth: 74, frequency: 3.6, mobile: 1.05 },
  { name: "Timeline view", breadth: 46, frequency: 2.4, mobile: 0.5 },
  { name: "Docs", breadth: 38, frequency: 2.1, mobile: 0.7 },
  { name: "Templates", breadth: 33, frequency: 0.9, mobile: 0.6 },
  { name: "Mobile quick capture", breadth: 27, frequency: 2.2, mobile: 2.2 },
  { name: "AI summaries", breadth: 24, frequency: 1.3, mobile: 0.9 },
  { name: "Automations", breadth: 17, frequency: 4.3, mobile: 0.4 },
  { name: "Integrations", breadth: 13, frequency: 1.1, mobile: 0.3 },
  { name: "Dashboards", breadth: 12, frequency: 2.9, mobile: 0.5 },
  { name: "Guest access", breadth: 8, frequency: 1.4, mobile: 0.6 },
];

const EVENTS = [
  { name: "board_viewed", perUser: 9.4, reach: 0.9 },
  { name: "task_updated", perUser: 6.1, reach: 0.78 },
  { name: "task_created", perUser: 3.2, reach: 0.66 },
  { name: "comment_added", perUser: 2.7, reach: 0.58 },
  { name: "automation_run", perUser: 1.9, reach: 0.17 },
  { name: "doc_edited", perUser: 1.4, reach: 0.34 },
  { name: "file_uploaded", perUser: 0.8, reach: 0.27 },
  { name: "ai_summary_generated", perUser: 0.6, reach: 0.21 },
  { name: "teammate_invited", perUser: 0.15, reach: 0.08 },
  { name: "integration_connected", perUser: 0.04, reach: 0.03 },
];

const SOURCES = [
  { label: "Organic search", share: 0.26, activation: 0.92 },
  { label: "Teammate invites", share: 0.24, activation: 1.68 },
  { label: "Direct", share: 0.17, activation: 1.0 },
  { label: "Paid search", share: 0.13, activation: 0.74 },
  { label: "Social", share: 0.11, activation: 0.58 },
  { label: "Partner marketplace", share: 0.09, activation: 1.12 },
];

const ACCOUNTS = [
  {
    name: "Orbit Fintech",
    plan: "Business",
    seats: 320,
    active: 291,
    score: 84,
    change: 1,
    mrr: 12800,
    last: 0,
  },
  {
    name: "Northwind Logistics",
    plan: "Business",
    seats: 240,
    active: 212,
    score: 88,
    change: 3,
    mrr: 9600,
    last: 0,
  },
  {
    name: "Granite Works",
    plan: "Business",
    seats: 210,
    active: 118,
    score: 47,
    change: -6,
    mrr: 8400,
    last: 0,
  },
  {
    name: "Brightline Health",
    plan: "Business",
    seats: 180,
    active: 96,
    score: 52,
    change: -9,
    mrr: 7200,
    last: 1,
  },
  {
    name: "Summit Analytics",
    plan: "Business",
    seats: 150,
    active: 131,
    score: 79,
    change: -2,
    mrr: 6000,
    last: 0,
  },
  {
    name: "Lumen Retail",
    plan: "Team",
    seats: 80,
    active: 71,
    score: 81,
    change: 4,
    mrr: 1600,
    last: 0,
  },
  {
    name: "Kestrel Labs",
    plan: "Team",
    seats: 64,
    active: 61,
    score: 91,
    change: 2,
    mrr: 1280,
    last: 0,
  },
  {
    name: "Harbor & Pine",
    plan: "Team",
    seats: 45,
    active: 18,
    score: 34,
    change: -15,
    mrr: 900,
    last: 3,
  },
  {
    name: "Tidewater Media",
    plan: "Team",
    seats: 38,
    active: 9,
    score: 22,
    change: -12,
    mrr: 760,
    last: 9,
  },
  {
    name: "Bluefin Studio",
    plan: "Team",
    seats: 22,
    active: 20,
    score: 86,
    change: 5,
    mrr: 440,
    last: 0,
  },
] as const;

function retentionCurve(platform: string, plan: string, weeks: number, lift = 1) {
  const floor = Math.min(0.6, 0.22 * factor(platform, plan, "retention"));
  return Array.from({ length: weeks + 1 }, (_, k) =>
    k === 0
      ? 100
      : round(Math.min(100, (floor + (1 - floor) * Math.exp(-0.95 * k)) * 100 * lift), 1),
  );
}

function stickinessShares(platform: string, plan: string, window: 7 | 28) {
  const engagement = factor(platform, plan, "retention");
  if (window === 7) {
    const base = [0.27, 0.16, 0.12, 0.1, 0.11, 0.11, 0.13];
    const shifted = base.map((v, i) => v * engagement ** ((i - 3) / 3));
    const total = sum(shifted);
    return shifted.map((v) => v / total);
  }
  // A work tool's power users cluster near 20 of 28 days: every weekday.
  const raw = Array.from({ length: 28 }, (_, i) => {
    const d = i + 1;
    const light = 0.2 * Math.exp(-(d - 1) / 3);
    const work = 0.07 * engagement * Math.exp(-((d - 20) ** 2) / 8);
    const daily = d >= 26 ? 0.02 * engagement : 0;
    return light + work + daily + 0.008;
  });
  const total = sum(raw);
  return raw.map((v) => v / total);
}

export const analyticsHandlers: Record<string, (args: any) => unknown> = {
  get_usage_kpis({ range, platform, plan }: Input<"get_usage_kpis">) {
    const days = RANGE_DAYS[range];
    const cur = dau(platform, plan, days);
    const prev = dau(platform, plan, days, days);
    const mau = mauRatio(platform, plan);
    const wau = wauRatio(platform, plan);
    const sign = signups(platform, plan, days);
    const signPrev = signups(platform, plan, days, days);
    const session = (() => {
      const segs = segments(platform, plan);
      const weights = segs.map(([pf, pl]) => PLATFORMS[pf].dau * PLANS[pl].dau);
      return sum(segs.map(([pf], i) => PLATFORMS[pf].session * weights[i])) / sum(weights);
    })();
    const act = activationRate(platform, plan, 0) * 100;
    const actPrev = activationRate(platform, plan, days + 10) * 100;
    // The hero trend is a 7-day rolling average: a work tool's weekend dips
    // would otherwise turn the period's direction into a sawtooth.
    // A holiday the chart can't mark (before the window, or anywhere in the
    // prior period) is swapped for the same weekday a week earlier, so an
    // unlabelled dip can't bend the line or open a false gap between periods.
    const smooth = (offset: number) => {
      const lead = 13;
      const raw = dau(platform, plan, days + lead, offset);
      const daysAgo = (k: number) => offset + days + lead - 1 - k;
      const fixed = raw.map((v, k) =>
        k >= 7 && daysAgo(k) >= days && HOLIDAY_DAYS_AGO.has(daysAgo(k)) ? raw[k - 7] : v,
      );
      return fixed.slice(lead).map((_, i) => mean(fixed.slice(lead + i - 6, lead + i + 1)));
    };
    const trend = bucket(dayLabels(days), [smooth(0), smooth(days)], range, true);
    return {
      periodLabel: periodLabel(range),
      hero: kpi("Daily active users", mean(cur), mean(prev), formatNumber, {
        hint: "Average per day in the period · chart shows the 7-day rolling average",
      }),
      heroTrend: {
        labels: trend.labels,
        current: trend.values[0].map(Math.round),
        previous: trend.values[1].map(Math.round),
        format: "number" as const,
        events: [
          eventSpan(range, "Labor Day", 34, 30, "Holiday week: daily actives fell about 30%"),
        ].filter((e): e is ChartEvent => !!e),
        asOf: AS_OF,
        partial: true,
      },
      metrics: [
        kpi("Weekly active users", mean(cur) * wau, mean(prev) * wau, formatNumber, {
          series: activeInWindow(platform, plan, days, 7, wau),
          previousSeries: activeInWindow(platform, plan, days, 7, wau, days),
          hint: "Active in the last 7 days, averaged over the period",
          range,
          chart: "number",
        }),
        kpi("Monthly active users", mean(cur) * mau, mean(prev) * mau * 0.985, formatNumber, {
          series: activeInWindow(platform, plan, days, 28, mau),
          previousSeries: activeInWindow(platform, plan, days, 28, mau, days).map((v) => v * 0.985),
          hint: "Active in the last 28 days, averaged over the period",
          range,
          chart: "number",
        }),
        kpi("DAU/MAU", 100 / mau, 100 / (mau * 1.02), (v) => `${v.toFixed(1)}%`, {
          hint: "Stickiness · 20%+ is good for work tools",
          range,
          chart: "percent",
          target: { label: "Good for work tools 20%", value: 20 },
        }),
        kpi("New signups", sum(sign), sum(signPrev), formatNumber, {
          series: sign,
          previousSeries: signPrev,
          range,
          chart: "number",
          total: true,
        }),
        kpi("Week-1 activation", act, actPrev, (v) => `${v.toFixed(1)}%`, {
          hint: "3+ active days in the first week",
          range,
          chart: "percent",
        }),
        kpi(
          "Sessions per user",
          4.6 * Math.sqrt(factor(platform, plan, "retention")),
          4.4 * Math.sqrt(factor(platform, plan, "retention")),
          (v) => `${v.toFixed(1)} / week`,
          { range, chart: "number" },
        ),
        kpi("Median session", session, session * 0.97, formatDuration, {
          hint: "Time from first to last event",
          range,
          chart: "duration",
        }),
      ],
    };
  },

  get_signup_goal({ platform }: Input<"get_signup_goal">) {
    // October so far: the 1st to today, the 10th, of a 31-day month.
    const elapsed = 10;
    const days = 31;
    let running = 0;
    const cumulative = signups(platform, "all", elapsed).map((v) => Math.round((running += v)));
    const projected = (running / elapsed) * days;
    const step = 10 ** (Math.floor(Math.log10(projected)) - 2);
    return {
      label: "October signup goal",
      goal: Math.round((projected * 0.97) / step) * step,
      format: "number" as const,
      labels: Array.from({ length: days }, (_, i) => dateLabel(elapsed - 1 - i)),
      cumulative,
      asOf: AS_OF,
    };
  },

  get_active_users({ range, platform, plan }: Input<"get_active_users">) {
    const days = RANGE_DAYS[range];
    const wau = activeInWindow(platform, plan, days, 7, wauRatio(platform, plan));
    const mau = activeInWindow(platform, plan, days, 28, mauRatio(platform, plan));
    const { labels, values } = bucket(
      dayLabels(days),
      [dau(platform, plan, days), wau, mau],
      range,
      true,
    );
    return {
      labels,
      dau: values[0].map(Math.round),
      wau: values[1].map(Math.round),
      mau: values[2].map(Math.round),
    };
  },

  get_lifecycle({ platform, plan, weeks }: Input<"get_lifecycle">) {
    const daily = dau(platform, plan, (weeks + 1) * 7);
    const sign = signups(platform, plan, (weeks + 1) * 7);
    const ratio = wauRatio(platform, plan);
    const wau = Array.from(
      { length: weeks + 1 },
      (_, w) => mean(daily.slice(w * 7, w * 7 + 7)) * ratio,
    );
    // Churn is set first; returning follows, and resurrecting reconciles the week's WAU.
    const churnBase = 0.16 / Math.sqrt(factor(platform, plan, "retention"));
    const out = {
      labels: [] as string[],
      newUsers: [] as number[],
      returning: [] as number[],
      resurrecting: [] as number[],
      dormant: [] as number[],
    };
    for (let w = 1; w <= weeks; w++) {
      const daysAgo = (weeks - w) * 7 + 6;
      const holiday = [...HOLIDAY_DAYS_AGO].some((d) => d <= daysAgo && d > daysAgo - 7);
      const churn =
        churnBase * (holiday ? 2.1 : 1) * between(`churn:${platform}:${plan}:${w}`, 0.92, 1.08);
      const dormant = wau[w - 1] * churn;
      const returning = wau[w - 1] - dormant;
      const fresh = sum(sign.slice(w * 7, w * 7 + 7));
      const resurrecting = Math.max(wau[w] * 0.03, wau[w] - returning - fresh);
      out.labels.push(`Wk of ${dateLabel(daysAgo)}`);
      out.newUsers.push(Math.round(fresh));
      out.returning.push(Math.round(returning));
      out.resurrecting.push(Math.round(resurrecting));
      out.dormant.push(-Math.round(dormant));
    }
    const last = weeks - 1;
    const quick = (out.newUsers[last] + out.resurrecting[last]) / Math.abs(out.dormant[last] || 1);
    return { ...out, quickRatio: quick.toFixed(2) };
  },

  get_activation_funnel({ range, platform, plan }: Input<"get_activation_funnel">) {
    const days = RANGE_DAYS[range];
    const n = sum(signups(platform, plan, days));
    const p = sum(signups(platform, plan, days, days));
    const act = activationRate(platform, plan, 0);
    const actPrev = activationRate(platform, plan, days + 10);
    const a = factor(platform, plan, "activation");
    const ws = Math.min(0.96, 0.88 * a ** 0.2);
    const proj = Math.min(0.95, 0.7 * a ** 0.3);
    const steps = (total: number, activation: number, invite: number) => {
      const workspace = total * ws;
      const project = workspace * proj;
      const invited = Math.max(total * activation * 1.05, project * invite);
      return [total, workspace, project, invited, total * activation].map(Math.round);
    };
    const cur = steps(n, act, 0.62);
    const prev = steps(p, actPrev, 0.57);
    const labels = [
      "Signed up",
      "Created workspace",
      "Created project",
      "Invited teammate",
      "Activated",
    ];
    const times = [undefined, "2m", "14m", "1.6 days", "4 days"];
    return {
      steps: labels.map((label, i) => ({
        label,
        value: cur[i],
        previous: prev[i],
        ...(times[i] ? { medianTime: times[i] } : {}),
      })),
      activationRate: `${(act * 100).toFixed(1)}%`,
    };
  },

  get_retention_cohorts({ platform, plan, weeks }: Input<"get_retention_cohorts">) {
    const sign = signups(platform, plan, weeks * 7);
    const cohorts = Array.from({ length: weeks }, (_, k) => {
      const daysAgo = (weeks - k) * 7 - 1;
      const next = random(`cohort:${platform}:${plan}:${k}`);
      // Newer cohorts retain slightly better after onboarding changes.
      const curve = retentionCurve(platform, plan, weeks - k - 1, 1 + (k / weeks) * 0.1);
      return {
        cohort: `Wk of ${dateLabel(daysAgo)}`,
        size: Math.round(sum(sign.slice(k * 7, k * 7 + 7))),
        values: curve.map((v, i) =>
          i === 0 ? 100 : round(Math.min(100, v * (0.95 + next() * 0.1)), 1),
        ),
      };
    });
    return {
      periodLabels: Array.from({ length: weeks }, (_, i) => `Week ${i}`),
      cohorts,
      format: "percent" as const,
    };
  },

  get_retention_curves({ platform, weeks }: Input<"get_retention_curves">) {
    return {
      labels: Array.from({ length: weeks + 1 }, (_, i) => `Week ${i}`),
      all: retentionCurve(platform, "all", weeks),
      free: retentionCurve(platform, "free", weeks),
      team: retentionCurve(platform, "team", weeks),
      business: retentionCurve(platform, "business", weeks),
    };
  },

  get_stickiness({ platform, plan, window }: Input<"get_stickiness">) {
    const w = window as 7 | 28;
    const active =
      mean(dau(platform, plan, 7)) *
      (w === 7 ? wauRatio(platform, plan) : mauRatio(platform, plan));
    const shares = stickinessShares(platform, plan, w);
    const powerFrom = w === 7 ? 5 : 20;
    return {
      window: w,
      buckets: shares.map((s, i) => ({ days: i + 1, users: Math.round(active * s) })),
      powerUserShare: `${(sum(shares.slice(powerFrom - 1)) * 100).toFixed(1)}%`,
    };
  },

  get_feature_engagement({ range, platform, plan }: Input<"get_feature_engagement">) {
    const mobile = platform === "ios" || platform === "android";
    const mau = mean(dau(platform, plan, 28)) * mauRatio(platform, plan);
    const engagement = factor(platform, plan, "retention");
    return {
      features: FEATURES.map((f) => {
        const breadth = Math.min(
          98,
          f.breadth *
            (mobile ? f.mobile : 1) *
            engagement ** 0.4 *
            between(`fb:${f.name}:${platform}:${plan}`, 0.94, 1.06),
        );
        return {
          name: f.name,
          breadth: round(breadth),
          frequency: round(
            f.frequency * engagement ** 0.3 * between(`ff:${f.name}:${platform}`, 0.93, 1.07),
          ),
          users: Math.round((mau * breadth) / 100),
          change: round(
            f.name === "AI summaries"
              ? 4.8
              : f.name === "Templates"
                ? -2.1
                : between(`fc:${f.name}:${range}`, -1.5, 3),
          ),
        };
      }).sort((a, b) => b.breadth - a.breadth),
    };
  },

  get_activity_heatmap({ range, platform, plan }: Input<"get_activity_heatmap">) {
    const avg = mean(dau(platform, plan, RANGE_DAYS[range]));
    const mobile = platform === "ios" || platform === "android";
    return {
      hourLabels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, d) => {
        const next = random(`heat:${day}:${range}:${platform}:${plan}`);
        const weekend = d >= 5;
        return {
          day,
          values: Array.from({ length: 24 }, (_, h) => {
            const work = Math.exp(-((h - 11) ** 2) / 14) + 0.85 * Math.exp(-((h - 15) ** 2) / 9);
            const evening = (mobile ? 0.55 : 0.2) * Math.exp(-((h - 21) ** 2) / 5);
            const commute = mobile ? 0.35 * Math.exp(-((h - 8) ** 2) / 1.5) : 0;
            const shape = (weekend ? 0.14 * work : work * (d === 4 ? 0.85 : 1)) + evening + commute;
            return Math.round(avg * 1.6 * (0.02 + shape) * (0.9 + next() * 0.2));
          }),
        };
      }),
    };
  },

  get_top_events({ range, platform, limit }: Input<"get_top_events">) {
    const days = RANGE_DAYS[range];
    const cur = sum(dau(platform, "all", days));
    const prev = sum(dau(platform, "all", days, days));
    return {
      events: EVENTS.map((e) => {
        const count = Math.round(
          cur * e.perUser * between(`ev:${e.name}:${range}:${platform}`, 0.92, 1.08),
        );
        const prevCount =
          prev * e.perUser * between(`evp:${e.name}:${range}:${platform}`, 0.92, 1.04);
        const users = Math.round(
          mean(dau(platform, "all", days)) * mauRatio(platform, "all") * e.reach,
        );
        return {
          name: e.name,
          count,
          users,
          perUser: round(count / users),
          change: round(((count - prevCount) / prevCount) * 100),
        };
      })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
    };
  },

  get_user_paths({ range, platform }: Input<"get_user_paths">) {
    const mobile = platform === "ios" || platform === "android";
    const total = Math.round(sum(signups(platform, "all", RANGE_DAYS[range])));
    const paths = [
      {
        steps: ["workspace_created", "template_applied", "project_created", "teammate_invited"],
        share: 0.22,
        outcome: "activated",
        m: 0.7,
      },
      {
        steps: ["workspace_created", "project_created", "task_created", "session_ended"],
        share: 0.18,
        outcome: "in progress",
        m: 1,
      },
      { steps: ["workspace_created", "session_ended"], share: 0.15, outcome: "dropped", m: 1.5 },
      {
        steps: ["import_started", "import_completed", "project_created", "teammate_invited"],
        share: 0.11,
        outcome: "activated",
        m: 0.4,
      },
      {
        steps: ["workspace_created", "template_browsed", "session_ended"],
        share: 0.09,
        outcome: "dropped",
        m: 1.3,
      },
      {
        steps: ["invite_accepted", "board_viewed", "comment_added"],
        share: 0.08,
        outcome: "activated",
        m: 1.2,
      },
      {
        steps: ["workspace_created", "project_created", "teammate_invited", "task_created"],
        share: 0.07,
        outcome: "activated",
        m: 0.8,
      },
      {
        steps: ["app_permissions_prompt", "session_ended"],
        share: 0.04,
        outcome: "dropped",
        m: mobile ? 3 : 0.2,
      },
    ] as const;
    const weights = paths.map((p) => p.share * (mobile ? p.m : 1));
    const scale = 0.94 / sum(weights);
    return {
      start: "signup_completed",
      totalUsers: total,
      paths: paths.map((p, i) => ({
        steps: [...p.steps],
        users: Math.round(total * weights[i] * scale),
        share: round(weights[i] * scale, 4),
        outcome: p.outcome,
      })),
    };
  },

  get_signups_by_source({ range, platform }: Input<"get_signups_by_source">) {
    const total = sum(signups(platform, "all", RANGE_DAYS[range]));
    const act = activationRate(platform, "all", 0) * 100;
    const counts = SOURCES.map((s) =>
      Math.round(total * s.share * between(`src:${s.label}:${range}`, 0.92, 1.08)),
    );
    const rates = SOURCES.map((s) => round(Math.min(85, act * s.activation)));
    const countTotal = sum(counts);
    return {
      labels: SOURCES.map((s) => s.label),
      signups: counts,
      activationRate: rates,
      items: SOURCES.map((s, i) => ({
        name: s.label,
        value: counts[i],
        share: round(counts[i] / countTotal, 4),
        change: round(between(`srcc:${s.label}:${range}`, -8, 14)),
      })),
      activation: SOURCES.map((s, i) => ({ name: s.label, value: rates[i] })),
    };
  },

  get_experiments({ status }: Input<"get_experiments">) {
    const experiments = [
      {
        name: "Onboarding checklist v2",
        hypothesis:
          "A four-step checklist that ends with inviting a teammate raises week-1 activation.",
        metric: "Week-1 activation rate",
        status: "won" as const,
        daysRunning: 28,
        variants: [
          { name: "Control", users: 12410, conversion: 31.2 },
          {
            name: "Checklist v2",
            users: 12388,
            conversion: 34.6,
            lift: 10.9,
            ciLow: 6.2,
            ciHigh: 15.6,
            significance: 0.999,
          },
        ],
        decision: "Shipped to everyone on Sep 22.",
      },
      {
        name: "Mobile quick-capture widget",
        hypothesis: "A home-screen widget for adding tasks makes mobile users return more often.",
        metric: "Mobile weekly active rate",
        status: "lost" as const,
        daysRunning: 21,
        variants: [
          { name: "Control", users: 6020, conversion: 52.3 },
          {
            name: "Widget",
            users: 5987,
            conversion: 50.1,
            lift: -4.2,
            ciLow: -7.4,
            ciHigh: -1.0,
            significance: 0.99,
          },
        ],
        decision: "Rolled back: widget users added tasks but opened the app less.",
      },
      {
        name: "AI summaries on by default",
        hypothesis:
          "Showing AI summaries without opt-in, with or without a daily digest email, improves week-2 retention.",
        metric: "Week-2 retention",
        status: "inconclusive" as const,
        daysRunning: 24,
        variants: [
          { name: "Control", users: 9104, conversion: 41.0 },
          {
            name: "On by default",
            users: 9087,
            conversion: 40.4,
            lift: -1.5,
            ciLow: -4.9,
            ciHigh: 1.9,
            significance: 0.41,
          },
          {
            name: "On + digest email",
            users: 9122,
            conversion: 42.1,
            lift: 2.7,
            ciLow: -0.6,
            ciHigh: 6.0,
            significance: 0.89,
          },
        ],
        decision: "No winner yet. Extend the digest-email arm for 2 weeks.",
      },
      {
        name: "Annual plan as default on upgrade",
        hypothesis:
          "Preselecting annual billing on the upgrade page raises paid conversion without hurting it.",
        metric: "Upgrade to paid within 14 days",
        status: "running" as const,
        daysRunning: 12,
        variants: [
          { name: "Control", users: 4120, conversion: 3.1 },
          {
            name: "Annual default",
            users: 4096,
            conversion: 3.32,
            lift: 7.1,
            ciLow: -4.8,
            ciHigh: 19.0,
            significance: 0.74,
          },
        ],
        decision: "Keep running: about 9 more days to reach 80% power.",
      },
    ];
    return {
      experiments: experiments.filter(
        (e) =>
          status === "all" ||
          (status === "running" ? e.status === "running" : e.status !== "running"),
      ),
    };
  },

  get_account_health({ plan, sort, limit }: Input<"get_account_health">) {
    const accounts = ACCOUNTS.filter((a) => plan === "all" || a.plan.toLowerCase() === plan);
    const sorted = [...accounts].sort((a, b) =>
      sort === "mrr" ? b.mrr - a.mrr : a.score - b.score,
    );
    const seats = sum(accounts.map((a) => a.seats));
    const active = sum(accounts.map((a) => a.active));
    const factorPlan = plan === "all" ? 1 : plan === "team" ? 0.82 : 0.18;
    return {
      metrics: [
        kpi("Paying workspaces", 1284 * factorPlan, 1210 * factorPlan, formatNumber, {
          hint: "Team and Business",
        }),
        kpi("Healthy", 68, 66, (v) => `${Math.round(v)}%`, { hint: "Health score 60 or more" }),
        kpi(
          "MRR at risk",
          41200 * factorPlan,
          36800 * factorPlan,
          (v) => `$${(v / 1000).toFixed(1)}K`,
          {
            goodDirection: "down",
            hint: "Workspaces with a score under 40",
          },
        ),
        kpi(
          "Seat utilization",
          (active / seats) * 100,
          (active / seats) * 100 * 1.02,
          (v) => `${v.toFixed(0)}%`,
          {
            hint: "Seats active in the last 7 days",
          },
        ),
      ],
      accounts: sorted.slice(0, limit).map((a) => ({
        name: a.name,
        plan: a.plan,
        seats: a.seats,
        activeSeats: a.active,
        healthScore: a.score,
        change: a.change,
        mrr: a.mrr,
        lastActiveDays: a.last,
      })),
    };
  },

  get_product_insights({ range, platform, plan }: Input<"get_product_insights">) {
    const days = RANGE_DAYS[range];
    const insights: Insight[] = [];
    const act = activationRate(platform, plan, 0) * 100;
    const actPrev = activationRate(platform, plan, days + 10) * 100;
    insights.push({
      tone: act >= actPrev ? "positive" : "negative",
      title: `Week-1 activation ${act >= actPrev ? "up" : "down"} ${Math.abs(act - actPrev).toFixed(1)} points`,
      detail:
        "Onboarding checklist v2 won its experiment (+10.9% lift) and shipped to everyone on Sep 22; invites in the first week rose with it.",
      metric: `${act.toFixed(1)}%`,
    });
    if (platform === "all" || platform === "android") {
      const web = retentionCurve("web", plan, 4)[4];
      const android = retentionCurve("android", plan, 4)[4];
      insights.push({
        tone: "warning",
        title: "Android users churn fastest",
        detail: `Week-4 retention is ${android.toFixed(0)}% on Android against ${web.toFixed(0)}% on web. The notification permission prompt ends 1 in 8 first sessions on mobile.`,
        metric: `${android.toFixed(0)}%`,
      });
    }
    if (plan === "all" || plan !== "free") {
      insights.push({
        tone: "negative",
        title: "Brightline Health's activity is falling",
        detail:
          "53% of its 180 seats were active this week and its health score dropped 9 points. $7,200 MRR; renewal in 41 days.",
        metric: "−9 pts",
      });
    }
    insights.push({
      tone: "info",
      title: "Automations is a power feature",
      detail:
        "Only 17% of monthly users try it, but they use it 4.3 days a week. Surfacing it in the Team plan trial could widen its reach.",
      metric: "4.3 d/wk",
    });
    insights.push({
      tone: "info",
      title: "Dormant users spiked in the week of Sep 7",
      detail:
        "Labor Day cut daily actives by 30% for the week. Most of those users came back the following week as resurrecting.",
      metric: "Holiday",
    });
    insights.push({
      tone: "warning",
      title: "Mobile quick-capture widget lost its test",
      detail:
        "It lowered mobile weekly active rate by 4.2% (95% CI −7.4% to −1.0%) and was rolled back.",
      metric: "−4.2%",
    });
    return { insights: insights.slice(0, 6) };
  },
};
