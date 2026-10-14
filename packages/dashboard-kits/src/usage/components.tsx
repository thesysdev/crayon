"use client";

import { defineComponent } from "@openuidev/react-lang";
import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { TrendChart as TrendChartView } from "../components/Charts/TrendChart";
import { formatCurrency, formatNumber } from "../core/format";
import { passed } from "../core/schemas";
import { Pending } from "../genui-lib/Pending";
import type {
  auditEventSchema,
  benchmarkSchema,
  championSchema,
  coverageSchema,
  creditSchema,
  memberRowSchema,
  seatStateSchema,
  teamRowSchema,
  valueLineSchema,
} from "./tools";

type SeatState = z.infer<typeof seatStateSchema>;
type MemberRow = z.infer<typeof memberRowSchema>;
type TeamRow = z.infer<typeof teamRowSchema>;
type Credits = z.infer<typeof creditSchema>;
type Benchmark = z.infer<typeof benchmarkSchema>;
type ValueLine = z.infer<typeof valueLineSchema>;
type Coverage = z.infer<typeof coverageSchema>;
type AuditEvent = z.infer<typeof auditEventSchema>;
type Champion = z.infer<typeof championSchema>;

// The usage kit's components: what a workspace admin sees about their own
// workspace. Props reuse the tool schemas, so a Query result plugs in as is.

/** Seat states in the order a seat moves through them, each with its tone. */
const SEAT_TONE: Record<SeatState["state"], string> = {
  active: "var(--kit-s1)",
  inactive: "var(--kit-warn)",
  dormant: "var(--kit-bad)",
  never_active: "color-mix(in oklch, var(--kit-bad) 55%, var(--kit-card))",
  pending: "var(--kit-s3)",
  unassigned: "var(--kit-muted-mark)",
};

export const SeatInventory = defineComponent({
  name: "SeatInventory",
  description:
    "Every paid seat in one bar: active, inactive, dormant, never active, pending invites, and unassigned, each with its count and what it means. Pass get_seat_inventory's states and paid.",
  props: z.object({
    states: z.array(passed("A seat state from get_seat_inventory")).default([]),
    paid: z.number().optional(),
  }),
  component: ({ props }) => {
    const states = (props.states ?? []) as unknown as SeatState[];
    if (states.length === 0) return <Pending kind="list" rows={4} />;
    const total = props.paid ?? states.reduce((a, s) => a + s.seats, 0);
    return (
      <div className="kit-seats-inv">
        <div
          className="kit-seats-inv__bar"
          role="img"
          aria-label={states.map((s) => `${s.label} ${s.seats}`).join(", ")}
        >
          {states
            .filter((s) => s.seats > 0)
            .map((s) => (
              <span
                key={s.state}
                className="kit-seats-inv__part"
                style={{ flexGrow: s.seats, background: SEAT_TONE[s.state] }}
                title={`${s.label}: ${s.seats} seats`}
              />
            ))}
        </div>
        <ul className="kit-seats-inv__legend">
          {states.map((s) => (
            <li key={s.state} className={s.seats === 0 ? "kit-seats-inv__item--empty" : undefined}>
              <i style={{ background: SEAT_TONE[s.state] }} aria-hidden />
              <span className="kit-seats-inv__label">{s.label}</span>
              <span className="kit-num kit-strong">{s.seats}</span>
              <span className="kit-num kit-muted">
                {Math.round((s.seats / Math.max(1, total)) * 100)}%
              </span>
              <span className="kit-small kit-muted kit-seats-inv__detail">{s.detail}</span>
            </li>
          ))}
        </ul>
        <div className="kit-small kit-muted">{formatNumber(total)} paid seats</div>
      </div>
    );
  },
});

const STATUS_CHIP: Record<MemberRow["status"], { label: string; tone: string }> = {
  active: { label: "Active", tone: "positive" },
  inactive: { label: "Inactive", tone: "warning" },
  dormant: { label: "Dormant", tone: "negative" },
  never_active: { label: "Never active", tone: "negative" },
};

type SortKey = "name" | "team" | "lastActive" | "activeDays" | "aiActions";

function toCsv(rows: MemberRow[]) {
  const head = [
    "Name",
    "Email",
    "Team",
    "Role",
    "Status",
    "Last active",
    "Active days (28)",
    "AI actions (28)",
    "Credits (28)",
    "Sign-in",
  ];
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [
    head,
    ...rows.map((r) => [
      r.name,
      r.email,
      r.team,
      r.role,
      STATUS_CHIP[r.status].label,
      r.lastActive,
      r.activeDays,
      r.aiActions,
      r.credits,
      r.auth,
    ]),
  ]
    .map((line) => line.map(cell).join(","))
    .join("\n");
}

export const MemberTable = defineComponent({
  name: "MemberTable",
  description:
    "The member directory: status, team, last active, active days and AI actions in 28 days, credits, and sign-in method; sortable by any column, searchable, and exportable as CSV. Pass get_members's rows.",
  props: z.object({
    rows: z.array(passed("A member row from get_members")).default([]),
  }),
  component: ({ props }) => {
    const rows = useMemo(() => (props.rows ?? []) as unknown as MemberRow[], [props.rows]);
    const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
      key: "lastActive",
      desc: false,
    });
    const [query, setQuery] = useState("");
    const shown = useMemo(() => {
      const q = query.trim().toLowerCase();
      const filtered = q
        ? rows.filter((r) => `${r.name} ${r.team} ${r.email}`.toLowerCase().includes(q))
        : rows;
      const value = (r: MemberRow) =>
        sort.key === "lastActive" ? (r.daysInactive ?? rows.indexOf(r)) : r[sort.key];
      return [...filtered].sort((a, b) => {
        const x = value(a);
        const y = value(b);
        const order =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y));
        return sort.desc ? -order : order;
      });
    }, [rows, sort, query]);
    if (rows.length === 0) return <Pending kind="table" rows={8} />;
    const header = (key: SortKey, label: string, num = false) => (
      <th
        className={num ? "kit-num" : undefined}
        aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}
      >
        <button
          type="button"
          className="kit-sort"
          onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : num }))}
        >
          {label}
          <span aria-hidden>{sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}</span>
        </button>
      </th>
    );
    const exportCsv = () => {
      const blob = new Blob([toCsv(shown)], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "members.csv";
      a.click();
      URL.revokeObjectURL(url);
    };
    return (
      <div className="kit-members">
        <div className="kit-members__tools">
          <input
            type="search"
            className="kit-input"
            placeholder="Search name, team, or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search members"
          />
          <span className="kit-small kit-muted">
            {shown.length} of {rows.length}
          </span>
          <button type="button" className="kit-button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
        <div className="kit-scroll">
          <table className="kit-table">
            <thead>
              <tr>
                {header("name", "Member")}
                {header("team", "Team")}
                <th>Status</th>
                {header("lastActive", "Last active")}
                {header("activeDays", "Active days", true)}
                {header("aiActions", "AI actions", true)}
                <th className="kit-num">Credits</th>
                <th>Sign-in</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const chip = STATUS_CHIP[r.status];
                return (
                  <tr key={r.id}>
                    <th scope="row">
                      <span className="kit-members__name">{r.name}</span>
                      <span className="kit-small kit-muted">
                        {r.role === "Member" ? r.email : `${r.role} · ${r.email}`}
                      </span>
                    </th>
                    <td>{r.team}</td>
                    <td>
                      <span className={`kit-status kit-status--${chip.tone}`}>
                        <i className="kit-status__dot" />
                        {chip.label}
                      </span>
                    </td>
                    <td className="kit-small">{r.lastActive}</td>
                    <td className="kit-num">
                      <span className="kit-members__days">
                        <span className="kit-meter">
                          <span style={{ width: `${(r.activeDays / 28) * 100}%` }} />
                        </span>
                        {r.activeDays}
                      </span>
                    </td>
                    <td className="kit-num">{formatNumber(r.aiActions)}</td>
                    <td className="kit-num">{formatNumber(r.credits)}</td>
                    <td className={r.auth === "Password" ? "kit-text-bad" : undefined}>
                      {r.auth === "2FA" ? "Password + 2FA" : r.auth}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});

export const ReclaimList = defineComponent({
  name: "ReclaimList",
  description:
    'Seats to reclaim, longest idle first, each at its stage (remind at 30 days, reclaim at 60) with its monthly cost; select members to remind or reclaim, and a log records the decision (the demo sends nothing). Pass get_members\'s rows and rule from view "reclaim".',
  props: z.object({
    rows: z.array(passed("A member row from get_members, view reclaim")).default([]),
    rule: z.string().optional(),
  }),
  component: ({ props }) => {
    const rows = (props.rows ?? []) as unknown as MemberRow[];
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [done, setDone] = useState<Record<string, "reminded" | "reclaimed">>({});
    const [log, setLog] = useState<string[]>([]);
    if (rows.length === 0)
      return (
        <Pending
          kind="list"
          rows={5}
          empty="No seats to reclaim: every member was active in the last 30 days."
        />
      );
    const open = rows.filter((r) => !done[r.id]);
    const toggle = (id: string) =>
      setPicked((p) => {
        const n = new Set(p);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    const act = (what: "reminded" | "reclaimed") => {
      const chosen = open.filter((r) => picked.has(r.id));
      if (!chosen.length) return;
      setDone((d) => ({ ...d, ...Object.fromEntries(chosen.map((r) => [r.id, what])) }));
      setPicked(new Set());
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const cost = chosen.reduce((a, r) => a + r.monthlyCost, 0);
      setLog((l) => [
        what === "reclaimed"
          ? `${time} · Would reclaim ${chosen.length} seat${chosen.length === 1 ? "" : "s"}, saving ${formatCurrency(cost)} a month`
          : `${time} · Would remind ${chosen.length} member${chosen.length === 1 ? "" : "s"} their seat is reclaimed in 30 days`,
        ...l,
      ]);
    };
    const pickedCost = open.filter((r) => picked.has(r.id)).reduce((a, r) => a + r.monthlyCost, 0);
    return (
      <div className="kit-reclaim">
        {props.rule && <p className="kit-small kit-muted kit-reclaim__rule">{props.rule}</p>}
        <div className="kit-reclaim__bar">
          <label className="kit-reclaim__all">
            <input
              type="checkbox"
              checked={open.length > 0 && open.every((r) => picked.has(r.id))}
              onChange={(e) =>
                setPicked(e.target.checked ? new Set(open.map((r) => r.id)) : new Set())
              }
            />
            Select all
          </label>
          <span className="kit-small kit-muted">
            {picked.size
              ? `${picked.size} selected · ${formatCurrency(pickedCost)} a month`
              : `${open.length} to review`}
          </span>
          <button
            type="button"
            className="kit-button"
            disabled={!picked.size}
            onClick={() => act("reminded")}
          >
            Remind
          </button>
          <button
            type="button"
            className="kit-button kit-button--primary"
            disabled={!picked.size}
            onClick={() => act("reclaimed")}
          >
            Reclaim
          </button>
        </div>
        <ul className="kit-reclaim__list">
          {rows.map((r) => {
            const state = done[r.id];
            return (
              <li
                key={r.id}
                className={`kit-reclaim__row${state ? " kit-reclaim__row--done" : ""}`}
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${r.name}`}
                  checked={picked.has(r.id)}
                  disabled={!!state}
                  onChange={() => toggle(r.id)}
                />
                <span className="kit-reclaim__who">
                  <span className="kit-strong">{r.name}</span>
                  <span className="kit-small kit-muted">
                    {r.team} · {r.lastActive}
                  </span>
                </span>
                <span
                  className={`kit-status kit-status--${r.stage === "reclaim" ? "negative" : "warning"}`}
                >
                  <i className="kit-status__dot" />
                  {state
                    ? state === "reclaimed"
                      ? "Reclaimed"
                      : "Reminded"
                    : r.stage === "reclaim"
                      ? "Reclaim"
                      : "Remind"}
                </span>
                <span className="kit-num kit-reclaim__days">{r.daysInactive ?? "—"} days</span>
                <span className="kit-num kit-muted">{formatCurrency(r.monthlyCost)}/mo</span>
              </li>
            );
          })}
        </ul>
        <div className="kit-actions__log" aria-live="polite">
          <span className="kit-actions__log-title">Decision log</span>
          {log.length === 0 ? (
            <span className="kit-muted">
              Nothing done yet. This demo only records the decision; nothing is sent.
            </span>
          ) : (
            <ul>
              {log.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
});

const heat = (v: number) =>
  `color-mix(in oklch, var(--kit-accent) ${Math.round(8 + (v / 100) * 70)}%, var(--kit-card))`;

export const TeamAdoption = defineComponent({
  name: "TeamAdoption",
  description:
    "Adoption by team as a heat table: share active, using AI, and contributing, with credits; teams under 5 members show no rates (privacy), and teams with AI off say so. Pass get_team_adoption's rows.",
  props: z.object({
    rows: z.array(passed("A team row from get_team_adoption")).default([]),
  }),
  component: ({ props }) => {
    const rows = (props.rows ?? []) as unknown as TeamRow[];
    if (rows.length === 0) return <Pending kind="table" rows={6} />;
    const cell = (v: number | undefined, off?: string) =>
      v == null ? (
        <td className="kit-team__cell kit-team__cell--none">{off ?? "—"}</td>
      ) : (
        <td className="kit-team__cell">
          <span
            style={{ background: heat(v) }}
            className={v >= 62 ? "kit-team__fill kit-team__fill--strong" : "kit-team__fill"}
          >
            {v}%
          </span>
        </td>
      );
    return (
      <div className="kit-scroll">
        <table className="kit-table kit-team">
          <thead>
            <tr>
              <th>Team</th>
              <th className="kit-num">Members</th>
              <th>Active</th>
              <th>Using AI</th>
              <th>Contributing</th>
              <th className="kit-num">Credits</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) =>
              r.hidden ? (
                <tr key={r.team} className="kit-team__hidden">
                  <th scope="row">{r.team}</th>
                  <td className="kit-num">{r.members}</td>
                  <td colSpan={4} className="kit-small kit-muted">
                    Fewer than 5 members: rates hidden so no one can be singled out
                  </td>
                </tr>
              ) : (
                <tr key={r.team}>
                  <th scope="row">{r.team}</th>
                  <td className="kit-num">{r.members}</td>
                  {cell(r.active)}
                  {r.aiOff ? cell(undefined, "AI off") : cell(r.aiActive)}
                  {cell(r.contributors)}
                  <td className="kit-num">{r.credits != null ? formatNumber(r.credits) : "—"}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    );
  },
});

const ALERT_LABEL: Record<Credits["alert"], { text: string; tone: string }> = {
  none: { text: "No alert", tone: "positive" },
  "75": { text: "75% used", tone: "warning" },
  "90": { text: "90% used", tone: "negative" },
  "100": { text: "Allowance used up", tone: "negative" },
  projected: { text: "Projected to run out", tone: "warning" },
};

export const CreditBurn = defineComponent({
  name: "CreditBurn",
  description:
    "The AI credit pool: used against the allowance with 75/90/100% marks and the alert state, the pace, and the burn against a straight line through the period with the allowance as its limit. Pass get_credits's pool.",
  props: z.object({
    pool: passed("get_credits's pool"),
  }),
  component: ({ props }) => {
    const pool = props.pool as unknown as Credits | undefined;
    if (!pool || !pool.labels?.length) return <Pending kind="trend" />;
    const used = pool.used / pool.allowance;
    const alert = ALERT_LABEL[pool.alert];
    return (
      <div className="kit-credits">
        <div className="kit-credits__head">
          <div>
            <span className="kit-credits__used kit-num">{formatNumber(pool.used)}</span>
            <span className="kit-muted">
              {" "}
              of {formatNumber(pool.allowance)} credits · {pool.pace}% of pace
            </span>
          </div>
          <span className={`kit-status kit-status--${alert.tone}`}>
            <i className="kit-status__dot" />
            {alert.text}
          </span>
        </div>
        <div
          className="kit-credits__meter"
          role="img"
          aria-label={`${Math.round(used * 100)}% of the allowance used`}
        >
          <span className="kit-credits__fill" style={{ width: `${Math.min(100, used * 100)}%` }} />
          {[75, 90, 100].map((mark) => (
            <i key={mark} className="kit-credits__mark" style={{ left: `${mark}%` }}>
              <b>{mark}%</b>
            </i>
          ))}
        </div>
        <p className="kit-small kit-muted kit-credits__summary">
          {pool.summary} {pool.resetLabel}.
        </p>
        <TrendChartView
          labels={pool.labels}
          series={[
            { name: "Used", values: pool.burn, emphasis: "primary" },
            { name: "Straight line", values: pool.ideal, emphasis: "muted" },
          ]}
          format="number"
          variant="area"
          target={{ label: `Allowance ${formatNumber(pool.allowance)}`, value: pool.allowance }}
          height={200}
        />
      </div>
    );
  },
});

export const ValueEstimate = defineComponent({
  name: "ValueEstimate",
  description:
    "Estimated hours saved and their value, badged as an estimate, with the formula, a line per AI action type, hours per AI user, and the caveat. Pass get_value_estimate's result.",
  props: z.object({
    value: passed("get_value_estimate's result"),
  }),
  component: ({ props }) => {
    const v = props.value as unknown as
      | {
          hours: number;
          value: number;
          lines: ValueLine[];
          perMember: number;
          formula: string;
          caveat: string;
          rate: number;
        }
      | undefined;
    if (!v || !v.lines?.length) return <Pending kind="list" rows={4} />;
    const most = Math.max(...v.lines.map((l) => l.hours), 1);
    return (
      <div className="kit-value">
        <div className="kit-value__figures">
          <div>
            <span className="kit-value__big kit-num">{formatNumber(v.hours)}</span>
            <span className="kit-muted"> hours saved</span>
          </div>
          <div>
            <span className="kit-value__big kit-num">{formatCurrency(v.value)}</span>
            <span className="kit-muted"> at ${v.rate} an hour</span>
          </div>
          <span className="kit-value__badge">Estimate</span>
        </div>
        <p className="kit-value__formula kit-num">{v.formula}</p>
        <ul className="kit-value__lines">
          {v.lines.map((l) => (
            <li key={l.action}>
              <span>{l.action}</span>
              <span className="kit-meter">
                <span style={{ width: `${(l.hours / most) * 100}%` }} />
              </span>
              <span className="kit-num kit-muted">{formatNumber(l.actions)} actions</span>
              <span className="kit-num kit-strong">{l.hours.toFixed(1)} h</span>
            </li>
          ))}
        </ul>
        <p className="kit-small kit-muted">
          {v.perMember} hours per AI user. {v.caveat}
        </p>
      </div>
    );
  },
});

export const PeerBenchmark = defineComponent({
  name: "PeerBenchmark",
  description:
    "This workspace against similar ones as bullet bars: the band from the median to the top quartile shaded, the median marked, and this workspace's value. Pass get_peer_benchmarks's rows and pool.",
  props: z.object({
    rows: z.array(passed("A benchmark row from get_peer_benchmarks")).default([]),
    pool: z.string().optional(),
  }),
  component: ({ props }) => {
    const rows = (props.rows ?? []) as unknown as Benchmark[];
    if (rows.length === 0) return <Pending kind="list" rows={3} />;
    return (
      <div className="kit-peers">
        {rows.map((r) => {
          const above =
            r.value >= r.topQuartile
              ? "Top quartile"
              : r.value >= r.median
                ? "Above the median"
                : "Below the median";
          const tone = r.value >= r.median ? "kit-text-good" : "kit-text-bad";
          return (
            <div key={r.metric} className="kit-peers__row">
              <div className="kit-peers__head">
                <span className="kit-strong">{r.metric}</span>
                <span className={`kit-num kit-strong ${tone}`}>{r.value.toFixed(0)}%</span>
                <span className="kit-small kit-muted">
                  {above} · median {r.median.toFixed(0)}%
                </span>
              </div>
              <div
                className="kit-peers__track"
                role="img"
                aria-label={`${r.metric} ${r.value.toFixed(0)}%, median ${r.median.toFixed(0)}%, top quartile from ${r.topQuartile.toFixed(0)}%`}
              >
                <span
                  className="kit-peers__band"
                  style={{
                    left: `${r.median}%`,
                    width: `${Math.max(0.5, r.topQuartile - r.median)}%`,
                  }}
                />
                <i className="kit-peers__median" style={{ left: `${r.median}%` }} />
                <i className="kit-peers__value" style={{ left: `${Math.min(100, r.value)}%` }} />
              </div>
              <span className="kit-small kit-muted">{r.note}</span>
            </div>
          );
        })}
        {props.pool && (
          <p className="kit-small kit-muted">{props.pool}. Shaded: median to top quartile.</p>
        )}
      </div>
    );
  },
});

const PART_TONE = {
  good: "var(--kit-good)",
  warn: "var(--kit-warn)",
  bad: "var(--kit-bad)",
} as const;

export const SecurityPosture = defineComponent({
  name: "SecurityPosture",
  description:
    "Security coverage as segmented bars (how members sign in, how they were added, guests), each part toned good, watch, or gap, with a note naming the gap. Pass get_security's coverage.",
  props: z.object({
    coverage: z.array(passed("A coverage row from get_security")).default([]),
  }),
  component: ({ props }) => {
    const rows = (props.coverage ?? []) as unknown as Coverage[];
    if (rows.length === 0) return <Pending kind="list" rows={3} />;
    return (
      <div className="kit-posture">
        {rows.map((r) => {
          const total = r.parts.reduce((a, p) => a + p.value, 0) || 1;
          return (
            <div key={r.label} className="kit-posture__row">
              <span className="kit-strong">{r.label}</span>
              <div
                className="kit-posture__bar"
                role="img"
                aria-label={r.parts.map((p) => `${p.name} ${p.value}`).join(", ")}
              >
                {r.parts
                  .filter((p) => p.value > 0)
                  .map((p) => (
                    <span
                      key={p.name}
                      style={{ flexGrow: p.value, background: PART_TONE[p.tone] }}
                      title={`${p.name}: ${p.value}`}
                    />
                  ))}
              </div>
              <ul className="kit-posture__legend">
                {r.parts.map((p) => (
                  <li key={p.name}>
                    <i style={{ background: PART_TONE[p.tone] }} aria-hidden />
                    {p.name} <span className="kit-num kit-strong">{p.value}</span>
                    <span className="kit-num kit-muted">
                      {" "}
                      {Math.round((p.value / total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
              <span className="kit-small kit-muted">{r.note}</span>
            </div>
          );
        })}
      </div>
    );
  },
});

const EVENT_KIND: Record<AuditEvent["kind"], string> = {
  seats: "Seats",
  roles: "Roles",
  sharing: "Sharing",
  security: "Security",
  ai: "AI",
};

export const AuditLog = defineComponent({
  name: "AuditLog",
  description:
    "Recent admin events, newest first: when, who, what changed, and its kind (seats, roles, sharing, security, AI). Pass get_security's events.",
  props: z.object({
    events: z.array(passed("An event from get_security")).default([]),
  }),
  component: ({ props }) => {
    const events = (props.events ?? []) as unknown as AuditEvent[];
    if (events.length === 0)
      return <Pending kind="list" rows={5} empty="No admin events in the last 30 days." />;
    return (
      <ol className="kit-audit">
        {events.map((e, k) => (
          <li key={k} className="kit-audit__item">
            <span className={`kit-audit__kind kit-audit__kind--${e.kind}`}>
              {EVENT_KIND[e.kind]}
            </span>
            <span className="kit-audit__what">
              <span className="kit-strong">{e.action}</span>
              <span className="kit-small kit-muted">{e.detail}</span>
            </span>
            <span className="kit-small kit-muted kit-audit__when">
              {e.actor} · {e.when}
            </span>
          </li>
        ))}
      </ol>
    );
  },
});

export const ChampionList = defineComponent({
  name: "ChampionList",
  description:
    "The top 10 members by contribution or by helping other teams: rank, name (or a placeholder when names are hidden), team, a bar against the leader, and what they did. Pass get_champions's rows and note.",
  props: z.object({
    rows: z.array(passed("A champion from get_champions")).default([]),
    note: z.string().optional(),
  }),
  component: ({ props }) => {
    const rows = (props.rows ?? []) as unknown as Champion[];
    if (rows.length === 0)
      return <Pending kind="list" rows={6} empty="Nobody contributed in this window." />;
    const top = Math.max(1, rows[0]!.score);
    return (
      <div className="kit-champions">
        <ol className="kit-champions__list">
          {rows.map((r) => (
            <li key={r.rank} className="kit-champions__row">
              <span
                className={`kit-champions__rank${r.rank <= 3 ? " kit-champions__rank--top" : ""}`}
              >
                {r.rank}
              </span>
              <span className="kit-champions__who">
                <span className="kit-strong">{r.name}</span>
                <span className="kit-small kit-muted">{r.team}</span>
              </span>
              <span className="kit-meter kit-champions__bar">
                <span style={{ width: `${(r.score / top) * 100}%` }} />
              </span>
              <span className="kit-small kit-muted kit-champions__what">
                {[
                  r.created ? `${r.created} started` : "",
                  `${r.edits} edits`,
                  `${r.comments} comments`,
                  `${r.helped} for other teams`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ol>
        {props.note && <p className="kit-small kit-muted kit-champions__note">{props.note}</p>}
      </div>
    );
  },
});
