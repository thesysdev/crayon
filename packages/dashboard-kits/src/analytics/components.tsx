"use client";

import { defineComponent } from "@openuidev/react-lang";
import { BarChart, HeatmapChart, useTheme } from "@openuidev/react-ui";
import { Fragment } from "react";
import { z } from "zod/v4";
import { MUTED_COLOR, SERIES_COLORS } from "../components/Charts/utils/constants";
import { paletteInOrder } from "../components/Charts/utils/palette";
import { formatChange, formatCurrency, formatNumber, formatPoints } from "../core/format";
import { Pending } from "../genui-lib/Pending";
import { EngagementMatrix as EngagementMatrixView } from "./charts/EngagementMatrix";
import {
  accountSchema,
  experimentSchema,
  featureSchema,
  pathSchema,
  trackedEventSchema,
} from "./tools";

// Props reuse the tool schemas, so a Query result plugs in without reshaping:
// LifecycleChart(life.labels, life.newUsers, life.returning, life.resurrecting, life.dormant, life.quickRatio).

const shortWeek = (label: string) => label.replace(/^Wk of /, "");

/** Validated in stack order (resurrecting, new, returning, then dormant below zero). */
const LIFECYCLE = [
  { key: "returning", name: "Returning", color: "var(--kit-s1)" },
  { key: "newUsers", name: "New", color: "var(--kit-s3)" },
  { key: "resurrecting", name: "Resurrecting", color: "var(--kit-s2)" },
] as const;
const DORMANT = "var(--kit-s8)";

/**
 * The kit's ordinal blue ramp, low to high, for react-ui's HeatmapChart. Hex,
 * not tokens: the heatmap interpolates between steps. Dark mode runs from the
 * card color up to the brightest step, so low values recede on either surface.
 */
const HEAT_RAMP_LIGHT = [
  "#eaf2fc",
  "#c3dbf7",
  "#86b6ef",
  "#5598e7",
  "#2a78d6",
  "#1c5cab",
  "#104281",
];
const HEAT_RAMP_DARK = [
  "#141b28",
  "#16335a",
  "#184f95",
  "#256abf",
  "#3987e5",
  "#6da7ec",
  "#9ec5f4",
];

export const LifecycleChart = defineComponent({
  name: "LifecycleChart",
  description:
    "Lifecycle (growth accounting) chart: per week, stacked columns of returning, new, and resurrecting users above zero and dormant users below it, with a tooltip per week and the latest quick ratio. Pass get_lifecycle's labels, newUsers, returning, resurrecting, dormant, and quickRatio directly.",
  props: z.object({
    labels: z.array(z.string()).default([]),
    newUsers: z.array(z.number()).default([]),
    returning: z.array(z.number()).default([]),
    resurrecting: z.array(z.number()).default([]),
    dormant: z.array(z.number()).default([]),
    quickRatio: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels ?? [];
    if (labels.length === 0) return <Pending kind="columns" />;
    const returning = props.returning ?? [];
    const newUsers = props.newUsers ?? [];
    const resurrecting = props.resurrecting ?? [];
    const dormant = (props.dormant ?? []).map((v) => -Math.abs(v));
    // react-ui's BarChart stacks by sign: growth above zero, dormant below.
    const data = labels.map((label, i) => ({
      week: shortWeek(label),
      Returning: returning[i] ?? 0,
      New: newUsers[i] ?? 0,
      Resurrecting: resurrecting[i] ?? 0,
      Dormant: dormant[i] ?? 0,
    }));
    const last = labels.length - 1;
    return (
      <div className="kit-lifecycle">
        <BarChart
          data={data}
          categoryKey="week"
          variant="stacked"
          customPalette={paletteInOrder([...LIFECYCLE.map((s) => s.color), DORMANT])}
          condensed
          height={300}
          maxBarWidth={24}
          barRadius={4}
          yAxisLabel="Users"
          isAnimationActive
        />
        <div className="kit-chart-note">
          <span>
            Latest week: <strong>{formatNumber(returning[last] ?? 0)}</strong> returning,{" "}
            <strong>{formatNumber(newUsers[last] ?? 0)}</strong> new,{" "}
            <strong>{formatNumber(resurrecting[last] ?? 0)}</strong> resurrecting,{" "}
            <strong>{formatNumber(Math.abs(dormant[last] ?? 0))}</strong> went dormant.
          </span>
          {props.quickRatio && (
            <span className="kit-chart-note__figure">
              Quick ratio <strong>{props.quickRatio}</strong>
              <span className="kit-muted"> · above 1 means growing</span>
            </span>
          )}
        </div>
      </div>
    );
  },
});

export const PowerUserCurve = defineComponent({
  name: "PowerUserCurve",
  description:
    "Power user curve (stickiness): columns for the share of active users who were active on 1, 2, … N days of the last 7 or 28 days, with power users in the accent and everyone else in gray, and their share summarized. Pass get_stickiness's buckets, window, and powerUserShare directly.",
  props: z.object({
    buckets: z.array(z.object({ days: z.number(), users: z.number() })).default([]),
    window: z.number().optional(),
    powerUserShare: z.string().optional(),
  }),
  component: ({ props }) => {
    const buckets = props.buckets ?? [];
    if (buckets.length === 0) return <Pending kind="columns" />;
    const window = props.window ?? buckets.length;
    const powerFrom = window >= 28 ? 20 : Math.ceil((window * 5) / 7);
    const total = buckets.reduce((a, b) => a + b.users, 0) || 1;
    // Two stacked series, so power days draw in the accent and the rest in gray.
    const data = buckets.map((b) => {
      const share = Math.round((b.users / total) * 1000) / 10;
      const power = b.days >= powerFrom;
      return { days: String(b.days), "Power users": power ? share : 0, Others: power ? 0 : share };
    });
    return (
      <div className="kit-power">
        <p className="kit-power__summary">
          <strong>{props.powerUserShare ?? "—"}</strong> are power users, active {powerFrom}+ of{" "}
          {window} days.{" "}
          <span className="kit-muted">
            {Math.round(((buckets[0]?.users ?? 0) / total) * 100)}% came once.
          </span>
        </p>
        <BarChart
          data={data}
          categoryKey="days"
          variant="stacked"
          customPalette={paletteInOrder([SERIES_COLORS[0]!, MUTED_COLOR])}
          condensed
          height={260}
          maxBarWidth={28}
          barRadius={4}
          xAxisLabel={`Days active in the last ${window} days`}
          yAxisLabel="% of active users"
          isAnimationActive
        />
      </div>
    );
  },
});

export const EngagementMatrix = defineComponent({
  name: "EngagementMatrix",
  description:
    "Feature engagement matrix: each feature a bubble placed by breadth (percent of monthly active users) and frequency (days used per week), sized by users, split at the medians into Core, Power, Broad but infrequent, and Review or retire. Pass get_feature_engagement's features directly.",
  props: z.object({
    features: z.array(featureSchema).default([]),
  }),
  component: ({ props }) => {
    const features = props.features ?? [];
    if (features.length === 0) return <Pending kind="trend" />;
    return <EngagementMatrixView features={features} />;
  },
});

export const FeatureAdoption = defineComponent({
  name: "FeatureAdoption",
  description:
    "Feature adoption as ranked bars: percent of monthly active users who used each feature, with user counts, days per week, and the change in percentage points. Pass get_feature_engagement's features directly.",
  props: z.object({
    features: z.array(featureSchema).default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const features = (props.features ?? []).slice(0, props.limit ?? 20);
    if (features.length === 0) return <Pending kind="list" rows={8} />;
    return (
      <ul className="kit-barlist">
        {features.map((f) => (
          <li
            key={f.name}
            className="kit-barlist__row"
            title={`${f.name}: ${formatNumber(f.users)} users, ${f.frequency} days/week`}
          >
            <span className="kit-barlist__track">
              <span
                className="kit-barlist__fill"
                style={{ width: `${Math.min(100, f.breadth)}%` }}
              />
              <span className="kit-barlist__name">{f.name}</span>
            </span>
            <span className="kit-barlist__value">{f.breadth.toFixed(1)}%</span>
            <span
              className={`kit-barlist__meta ${f.change >= 0 ? "kit-text-good" : "kit-text-bad"}`}
            >
              {formatPoints(f.change)}
            </span>
          </li>
        ))}
      </ul>
    );
  },
});

export const EventTable = defineComponent({
  name: "EventTable",
  description:
    "Top tracked events as a table: event name, volume with a bar against the largest, unique users, events per user, and change against the prior period. Pass get_top_events' events directly.",
  props: z.object({
    events: z.array(trackedEventSchema).default([]),
  }),
  component: ({ props }) => {
    const events = props.events ?? [];
    if (events.length === 0) return <Pending kind="table" rows={8} />;
    const max = Math.max(1, ...events.map((e) => e.count));
    return (
      <div className="kit-scroll">
        <table className="kit-table kit-events">
          <thead>
            <tr>
              <th>Event</th>
              <th className="kit-num">Events</th>
              <th aria-hidden />
              <th className="kit-num">Users</th>
              <th className="kit-num">Per user</th>
              <th className="kit-num">Change</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.name}>
                <td>
                  <code className="kit-step">{e.name}</code>
                </td>
                <td className="kit-num kit-cell-title">{formatNumber(e.count)}</td>
                <td className="kit-events__bar">
                  <span className="kit-meter">
                    <span
                      className="kit-meter__fill"
                      style={{ width: `${(e.count / max) * 100}%` }}
                    />
                  </span>
                </td>
                <td className="kit-num">{formatNumber(e.users)}</td>
                <td className="kit-num">{e.perUser.toFixed(1)}</td>
                <td className={`kit-num kit-text-${e.change >= 0 ? "good" : "bad"}`}>
                  {formatChange(e.change)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

export const ActivityHeatmap = defineComponent({
  name: "ActivityHeatmap",
  description:
    "Weekday by hour heatmap of activity, shaded relative to the busiest hour, with the hovered cell read out. Pass get_activity_heatmap's days and hourLabels directly.",
  props: z.object({
    days: z.array(z.object({ day: z.string(), values: z.array(z.number()) })).default([]),
    hourLabels: z.array(z.string()).optional(),
  }),
  component: ({ props }) => {
    const { mode } = useTheme();
    const days = props.days ?? [];
    if (days.length === 0) return <Pending kind="grid" rows={7} />;
    const hours = Math.max(...days.map((d) => d.values.length));
    const labels = props.hourLabels ?? Array.from({ length: hours }, (_, h) => `${h}:00`);
    let peak = { d: 0, h: 0 };
    days.forEach((row, d) =>
      row.values.forEach((v, h) => v > days[peak.d].values[peak.h] && (peak = { d, h })),
    );
    // Columns are hours, rows are weekdays: react-ui's HeatmapChart contract.
    const data = labels.slice(0, hours).map((hour, h) => {
      const column: Record<string, string | number> = { hour };
      for (const row of days) column[row.day] = row.values[h] ?? 0;
      return column;
    });
    return (
      <div className="kit-heat">
        <p className="kit-heat__readout">
          <span className="kit-muted">Busiest hour</span>{" "}
          <strong>
            {days[peak.d]?.day} {labels[peak.h]}
          </strong>{" "}
          · {formatNumber(days[peak.d]?.values[peak.h] ?? 0)} events
        </p>
        <HeatmapChart
          data={data}
          categoryKey="hour"
          customPalette={mode === "dark" ? HEAT_RAMP_DARK : HEAT_RAMP_LIGHT}
          legend={false}
          cellGap={2}
          cellRadius={3}
          isAnimationActive
        />
      </div>
    );
  },
});

const OUTCOME_TONE = {
  activated: "positive",
  "in progress": "neutral",
  dropped: "negative",
} as const;

export const UserPaths = defineComponent({
  name: "UserPaths",
  description:
    "Most common user paths after a start event: each path's steps in order, its share of users, and whether it ended activated, in progress, or dropped. Pass get_user_paths's start, totalUsers, and paths directly.",
  props: z.object({
    start: z.string().optional(),
    totalUsers: z.number().optional(),
    paths: z.array(pathSchema).default([]),
  }),
  component: ({ props }) => {
    const paths = props.paths ?? [];
    if (paths.length === 0) return <Pending kind="list" rows={6} />;
    const top = Math.max(...paths.map((p) => p.share), 0.01);
    const activated = paths
      .filter((p) => p.outcome === "activated")
      .reduce((a, p) => a + p.share, 0);
    const dropped = paths.filter((p) => p.outcome === "dropped").reduce((a, p) => a + p.share, 0);
    return (
      <div className="kit-paths">
        <div className="kit-paths__summary">
          {props.start && (
            <span>
              {props.totalUsers != null
                ? `${formatNumber(props.totalUsers)} users after `
                : "After "}
              <code className="kit-step kit-step--start">{props.start}</code>
            </span>
          )}
          <span className="kit-status kit-status--positive">
            <i className="kit-status__dot" />
            {Math.round(activated * 100)}% activated
          </span>
          <span className="kit-status kit-status--negative">
            <i className="kit-status__dot" />
            {Math.round(dropped * 100)}% dropped
          </span>
        </div>
        <ol className="kit-paths__list">
          {paths.map((p, i) => (
            <li key={i} className="kit-paths__item">
              <span className="kit-paths__share">
                <span className="kit-paths__pct">{Math.round(p.share * 100)}%</span>
                <span className="kit-meter">
                  <span style={{ width: `${(p.share / top) * 100}%` }} />
                </span>
                <span className="kit-paths__users">{formatNumber(p.users)}</span>
              </span>
              <span className="kit-paths__steps">
                {p.steps.map((step, j) => (
                  <Fragment key={j}>
                    {j > 0 && (
                      <svg className="kit-paths__arrow" viewBox="0 0 12 12" aria-hidden>
                        <path d="M2 6h8M7 3l3 3-3 3" />
                      </svg>
                    )}
                    <code className="kit-step">{step}</code>
                  </Fragment>
                ))}
                <span className={`kit-status kit-status--${OUTCOME_TONE[p.outcome]}`}>
                  <i className="kit-status__dot" />
                  {p.outcome}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  },
});

const STATUS = {
  won: { label: "Significant win", tone: "positive" },
  lost: { label: "Significant loss", tone: "negative" },
  inconclusive: { label: "Inconclusive", tone: "neutral" },
  running: { label: "Running", tone: "info" },
} as const;

export const ExperimentResults = defineComponent({
  name: "ExperimentResults",
  description:
    "A/B test results: for each experiment its hypothesis, metric, and status, and for each variant the exposures, metric value, relative lift against control with its 95% confidence interval drawn around zero, the significance, and the decision. Pass get_experiments's experiments directly.",
  props: z.object({
    experiments: z.array(experimentSchema).default([]),
  }),
  component: ({ props }) => {
    const experiments = props.experiments ?? [];
    if (experiments.length === 0) return <Pending kind="table" rows={6} />;
    return (
      <div className="kit-experiments">
        {experiments.map((e) => {
          const status = STATUS[e.status] ?? STATUS.running;
          const bounds = e.variants.flatMap((v) => [v.ciLow ?? 0, v.ciHigh ?? 0, v.lift ?? 0]);
          const span = Math.max(5, ...bounds.map(Math.abs)) * 1.15;
          const pos = (v: number) => `${((v + span) / (2 * span)) * 100}%`;
          return (
            <section key={e.name} className="kit-experiment">
              <header className="kit-experiment__head">
                <div>
                  <span className="kit-experiment__name">{e.name}</span>
                  <span className="kit-experiment__meta">
                    {e.metric} · {e.daysRunning} days
                  </span>
                </div>
                <span className={`kit-status kit-status--${status.tone}`}>
                  <i className="kit-status__dot" />
                  {status.label}
                </span>
              </header>
              <p className="kit-experiment__hypothesis">{e.hypothesis}</p>
              <div className="kit-experiment__variants">
                {e.variants.map((v) => {
                  const tone =
                    v.ciLow == null
                      ? "neutral"
                      : v.ciLow > 0
                        ? "good"
                        : (v.ciHigh ?? 0) < 0
                          ? "bad"
                          : "neutral";
                  return (
                    <div key={v.name} className="kit-variant">
                      <span className="kit-variant__name">{v.name}</span>
                      <span className="kit-variant__users">{formatNumber(v.users)} users</span>
                      <span className="kit-variant__metric">{v.conversion}%</span>
                      {v.lift == null ? (
                        <span className="kit-variant__baseline">Baseline</span>
                      ) : (
                        <span className="kit-ci">
                          <span className={`kit-ci__value kit-text-${tone}`}>
                            {formatChange(v.lift)}
                          </span>
                          <span className="kit-ci__track">
                            <i className="kit-ci__zero" style={{ left: pos(0) }} />
                            {v.ciLow != null && v.ciHigh != null && (
                              <span
                                className={`kit-ci__range kit-ci__range--${tone}`}
                                style={{
                                  left: pos(v.ciLow),
                                  width: `calc(${pos(v.ciHigh)} - ${pos(v.ciLow)})`,
                                }}
                              />
                            )}
                            <i
                              className={`kit-ci__dot kit-ci__dot--${tone}`}
                              style={{ left: pos(v.lift) }}
                            />
                          </span>
                          <span className="kit-ci__bounds">
                            {v.ciLow != null && v.ciHigh != null
                              ? `${formatChange(v.ciLow)} to ${formatChange(v.ciHigh)}`
                              : ""}
                          </span>
                        </span>
                      )}
                      <span
                        className={`kit-variant__sig${(v.significance ?? 0) >= 0.95 ? " kit-variant__sig--strong" : ""}`}
                      >
                        {v.significance != null
                          ? `${(v.significance * 100).toFixed(v.significance > 0.99 ? 1 : 0)}% sig.`
                          : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="kit-experiment__decision">→ {e.decision}</p>
            </section>
          );
        })}
      </div>
    );
  },
});

function HealthRing({ score }: { score: number }) {
  const tone = score < 40 ? "negative" : score < 60 ? "warning" : "positive";
  const c = 2 * Math.PI * 14;
  return (
    <span className={`kit-ring kit-ring--${tone}`} aria-label={`Health ${score}`}>
      <svg viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" className="kit-ring__track" />
        <circle
          cx="18"
          cy="18"
          r="14"
          className="kit-ring__fill"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <span>{score}</span>
    </span>
  );
}

export const AccountHealth = defineComponent({
  name: "AccountHealth",
  description:
    "Paying workspace health table: plan, weekly active seats against seats, a health score ring with its 30-day change, MRR, last activity, and a Healthy, Watch, or At risk status. Pass get_account_health's accounts directly.",
  props: z.object({
    accounts: z.array(accountSchema).default([]),
  }),
  component: ({ props }) => {
    const accounts = props.accounts ?? [];
    if (accounts.length === 0) return <Pending kind="table" rows={6} />;
    return (
      <div className="kit-scroll">
        <table className="kit-table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Health</th>
              <th>Active seats, last 7 days</th>
              <th className="kit-num">MRR</th>
              <th>Last active</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const status =
                a.healthScore < 40 ? "At risk" : a.healthScore < 60 ? "Watch" : "Healthy";
              const tone =
                a.healthScore < 40 ? "negative" : a.healthScore < 60 ? "warning" : "positive";
              const utilization = a.activeSeats / (a.seats || 1);
              return (
                <tr key={a.name}>
                  <td>
                    <span className="kit-cell-title">{a.name}</span>
                    <span className="kit-tag">{a.plan}</span>
                  </td>
                  <td>
                    <span className="kit-health">
                      <HealthRing score={a.healthScore} />
                      <span
                        className={`kit-num kit-small ${a.change >= 0 ? "kit-text-good" : "kit-text-bad"}`}
                      >
                        {a.change >= 0 ? "+" : "−"}
                        {Math.abs(a.change)} pts
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="kit-seats">
                      <span className="kit-meter">
                        <span style={{ width: `${utilization * 100}%` }} />
                      </span>
                      <span className="kit-num kit-small kit-muted">
                        {formatNumber(a.activeSeats)} of {formatNumber(a.seats)} ·{" "}
                        {Math.round(utilization * 100)}%
                      </span>
                    </span>
                  </td>
                  <td className="kit-num kit-strong">{formatCurrency(a.mrr)}</td>
                  <td className="kit-small">
                    {a.lastActiveDays === 0 ? "Today" : `${a.lastActiveDays}d ago`}
                  </td>
                  <td>
                    <span className={`kit-status kit-status--${tone}`}>
                      <i className="kit-status__dot" />
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
});
