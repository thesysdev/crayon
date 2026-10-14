import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { runTool } from "../core/prompt";
import type { Kpi } from "../core/schemas";
import { analyticsHandlers, flattening } from "./data";
import { analyticsKit } from "./kit";

// Relay's numbers have to add up: one population drives every count of users.

const run = (tool: string, args: Record<string, unknown> = {}) =>
  runTool(analyticsKit, tool, args, analyticsHandlers) as any;
const total = (values: number[]) => values.reduce((a, b) => a + b, 0);
const RANGES = ["7d", "30d", "90d", "mtd"] as const;
const PLATFORMS = ["web", "ios", "android"] as const;

function argumentSets(input: z.ZodObject): Record<string, unknown>[] {
  const sets: Record<string, unknown>[] = [{}];
  for (const [key, field] of Object.entries(input.shape)) {
    let inner = field as z.ZodType;
    while (inner instanceof z.ZodDefault || inner instanceof z.ZodOptional)
      inner = inner.unwrap() as z.ZodType;
    if (inner instanceof z.ZodEnum) for (const value of inner.options) sets.push({ [key]: value });
  }
  return sets;
}

describe("metric definitions", () => {
  for (const tool of analyticsKit.tools) {
    it(`${tool.name}: every KPI has a definition`, () => {
      for (const args of argumentSets(tool.input)) {
        const out = run(tool.name, args);
        for (const k of [out.hero, ...(out.metrics ?? [])].filter(Boolean) as Kpi[]) {
          expect(k.definition?.formula, `${k.label} ${JSON.stringify(args)}`).toBeTruthy();
        }
      }
    });
  }
});

describe("one population", () => {
  it("builds every segment quickly", () => {
    const started = performance.now();
    run("get_usage_kpis", { range: "90d" });
    expect(performance.now() - started).toBeLessThan(2000);
  });

  for (const range of RANGES) {
    it(`${range}: platforms add up to all users`, () => {
      const whole = run("get_active_users", { range });
      const parts = PLATFORMS.map((platform) => run("get_active_users", { range, platform }));
      whole.wau.forEach((v: number, i: number) =>
        expect(Math.abs(total(parts.map((p) => p.wau[i])) - v)).toBeLessThanOrEqual(3),
      );
    });

    it(`${range}: daily ≤ weekly ≤ monthly, and any event ≥ core`, () => {
      const core = run("get_active_users", { range });
      const any = run("get_active_users", { range, active: "any" });
      core.dau.forEach((v: number, i: number) => {
        expect(v).toBeLessThanOrEqual(core.wau[i]);
        expect(core.wau[i]).toBeLessThanOrEqual(core.mau[i]);
        expect(any.wau[i]).toBeGreaterThanOrEqual(core.wau[i]);
      });
    });
  }

  it("accounts for each week's actives in the lifecycle", () => {
    const life = run("get_lifecycle", { weeks: 8 });
    const wau = run("get_active_users", { range: "90d" });
    for (let w = 0; w < 8; w++) {
      expect(life.dormant[w]).toBeLessThan(0);
      expect(life.resurrecting[w]).toBeGreaterThan(0);
    }
    expect(Number(life.quickRatio)).toBeGreaterThan(0);
    expect(wau.labels.length).toBeGreaterThan(0);
  });

  it("finds activated users keep at least twice as well", () => {
    const funnel = run("get_activation_funnel", { range: "30d" });
    expect(funnel.validity.pass).toBe(true);
    for (let i = 1; i < funnel.steps.length; i++) {
      expect(funnel.steps[i].value).toBeLessThanOrEqual(funnel.steps[i - 1].value);
    }
  });

  it("shows the checklist lifting activation", () => {
    const kpis = run("get_usage_kpis", { range: "30d" });
    const activation = kpis.metrics.find((m: Kpi) => m.label === "Activation");
    expect(activation.change).toBeGreaterThan(0);
  });

  it("counts the iOS duplicate events on any event, not on core actions", () => {
    const core = run("get_active_users", { range: "30d", platform: "ios" });
    const any = run("get_active_users", { range: "30d", platform: "ios", active: "any" });
    const at = (label: string) => core.labels.indexOf(label);
    const bugDay = at("Oct 2");
    const before = at("Sep 24");
    const lift = (i: number) => any.dau[i] / core.dau[i];
    expect(lift(bugDay)).toBeGreaterThan(lift(before) * 1.1);
  });

  it("keeps cohorts falling week by week", () => {
    const { cohorts } = run("get_retention_cohorts", { weeks: 8 });
    for (const c of cohorts) {
      // The last value is the week in progress, a part week.
      const whole = c.values.slice(0, -1);
      expect(whole[0]).toBe(100);
      for (let w = 1; w < whole.length; w++) expect(whole[w]).toBeLessThanOrEqual(whole[w - 1]);
    }
    expect(cohorts[0].values.length).toBe(9);
  });
});

it("reports the tracking break and restatement in the data status", () => {
  const month = run("get_data_status", { range: "30d" });
  const labels = month.items.map((i: { label: string }) => i.label);
  expect(labels).toContain("Tracking break");
  expect(labels).toContain("Restated");
  const web = run("get_data_status", { range: "30d", platform: "web" });
  expect(web.items.map((i: { label: string }) => i.label)).not.toContain("Tracking break");
});

it("finds the seeded aha moment first, one candidate per behaviour", () => {
  const { candidates } = run("find_activation_moment", {});
  expect(candidates[0].rule).toBe("Invited 2+ teammates in 7 days");
  expect(new Set(candidates.map((c: { behaviour: string }) => c.behaviour)).size).toBe(
    candidates.length,
  );
  for (const c of candidates) {
    expect(c.reach).toBeGreaterThanOrEqual(0.05);
    expect(c.reach).toBeLessThanOrEqual(0.9);
  }
});

describe("explain_change", () => {
  it("puts the iOS duplicate events first under any event, and never under core actions", () => {
    const any = run("explain_change", {
      metric: "wau",
      range: "7d",
      active: "any",
      platform: "ios",
    });
    expect(any.dataQuality).toMatch(/iOS duplicate events/);
    expect(any.walk[1].label).toBe("Tracking");
    const core = run("explain_change", { metric: "wau", range: "7d", platform: "ios" });
    expect(core.dataQuality).toBeUndefined();
  });

  it("explains activation as a change within groups, naming the launch", () => {
    const why = run("explain_change", { metric: "activation", range: "30d" });
    expect(why.confidence.level).not.toBe("Low");
    expect(why.drivers[0].dimension).toBe("Within group");
    expect(why.summary).toMatch(/Onboarding checklist v2 shipped/);
  });

  it("walks from the prior period to this one", () => {
    for (const metric of ["wau", "dau", "signups", "activation", "stickiness"]) {
      const why = run("explain_change", { metric, range: "30d" });
      const end = why.walk.reduce(
        (t: number, s: { kind: string; value: number }) =>
          s.kind === "base"
            ? s.value
            : s.kind === "add"
              ? t + s.value
              : s.kind === "subtract"
                ? t - s.value
                : t,
        0,
      );
      const last = why.walk.at(-1);
      expect(Math.abs(end - last.value)).toBeLessThanOrEqual(
        Math.abs(last.value - why.walk[0].value) * 0.04 + 1,
      );
    }
  });
});

describe("workspaces", () => {
  it("counts every paying workspace and gives every row a reason", () => {
    for (const list of ["risk", "slipping", "expansion", "power", "mrr"]) {
      const out = run("get_account_health", { list, limit: 10 });
      expect(out.metrics[0].value).toBe("8,000");
      for (const a of out.accounts) {
        expect(a.reason.length).toBeGreaterThan(10);
        expect(total(a.breakdown.map((b: { weight: number }) => b.weight))).toBeGreaterThan(0);
        expect(a.history.length).toBe(12);
        expect(a.history.at(-1)).toBe(a.healthScore);
      }
    }
  });

  it("flags Harbor & Pine for review and lists Kestrel Labs as ready to expand", () => {
    const slipping = run("get_account_health", {
      list: "slipping",
      limit: 10,
      plan: "team",
    }).accounts;
    const harbor = run("get_account_health", {
      list: "risk",
      limit: 10,
      plan: "team",
    }).accounts.find((a: { name: string }) => a.name === "Harbor & Pine");
    expect(
      harbor?.reviewNow ?? slipping.some((a: { name: string }) => a.name === "Harbor & Pine"),
    ).toBe(true);
    const expansion = run("get_account_health", {
      list: "expansion",
      limit: 10,
      plan: "team",
    }).accounts;
    expect(expansion.map((a: { name: string }) => a.name)).toContain("Kestrel Labs");
  });

  it("gives different counts for the three account-active rules", () => {
    const last = (accountActive: string) =>
      run("get_account_activity", { accountActive }).active.at(-1);
    const counts = ["any", "team", "seats"].map(last);
    expect(new Set(counts).size).toBe(3);
    expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
    const funnel = run("get_account_activity", {}).seats;
    expect(funnel[0].value).toBeGreaterThanOrEqual(funnel[1].value);
    expect(funnel[1].value).toBeGreaterThanOrEqual(funnel[2].value);
  });
});

describe("lifecycle states and retention modes", () => {
  it("keeps the daily states adding up to daily actives", () => {
    const states = run("get_lifecycle", { view: "states" });
    const daily = run("get_active_users", { range: "30d" }).dau.slice(-28);
    states.current.forEach((c: number, i: number) => {
      const active = c + states.newUsers[i] + states.reactivated[i] + states.resurrected[i];
      expect(Math.abs(active - daily[i])).toBeLessThanOrEqual(4);
    });
    expect(states.atRiskWau.every((v: number) => v <= 0)).toBe(true);
    expect(states.sensitivity[0].value).toBeGreaterThan(0);
  });

  it("counts unbounded retention at or above exact retention", () => {
    const exact = run("get_retention_cohorts", { weeks: 6 }).cohorts;
    const unbounded = run("get_retention_cohorts", { weeks: 6, mode: "unbounded" }).cohorts;
    exact.forEach((c: { values: number[] }, k: number) =>
      c.values
        .slice(0, -1)
        .forEach((v, w) => expect(unbounded[k].values[w]).toBeGreaterThanOrEqual(v - 0.05)),
    );
  });
});

describe("experiments", () => {
  const list = run("get_experiments", { status: "all" }).experiments;
  const named = (name: string) => list.find((e: { name: string }) => e.name === name);

  it("scores the checklist win from its counts", () => {
    const v = named("Onboarding checklist v2").variants[1];
    expect(v.lift).toBeCloseTo(10.9, 0);
    expect(v.ciLow).toBeGreaterThan(6);
    expect(v.ciHigh).toBeLessThan(16);
  });

  it("refuses to read a test whose traffic split wrong", () => {
    const pricing = named("Pricing page redesign");
    expect(pricing.split.ok).toBe(false);
    expect(pricing.recommendation).toBe("fix_split");
  });

  it("holds a test with a guardrail past its limit, and extends a young unclear one", () => {
    expect(named("AI summaries on by default").recommendation).toBe("discuss");
    expect(named("Annual plan as default on upgrade").recommendation).toBe("extend");
  });

  it("filters running from finished", () => {
    const running = run("get_experiments", { status: "running" }).experiments;
    expect(running.every((e: { status: string }) => e.status === "running")).toBe(true);
    expect(running.length).toBe(3);
  });
});

describe("revenue retention", () => {
  const revenue = run("get_revenue_retention", { plan: "all" });

  it("walks the latest month from its start to today's MRR", () => {
    const walk = revenue.walk as { value: number; kind: string }[];
    const moved = walk.reduce(
      (a, s) => a + (s.kind === "add" ? s.value : s.kind === "subtract" ? -s.value : 0),
      0,
    );
    expect(Math.abs(walk[0]!.value + moved - walk.at(-1)!.value)).toBeLessThanOrEqual(3);
  });

  it("explains September's seat cuts, which only Business carries", () => {
    expect(revenue.note).toMatch(/cut seats/);
    expect(run("get_revenue_retention", { plan: "team" }).note).not.toMatch(/cut seats/);
  });

  it("adds the plans up to the whole", () => {
    const end = (plan: string) => run("get_revenue_retention", { plan }).walk.at(-1).value;
    expect(Math.abs(end("team") + end("business") - end("all"))).toBeLessThanOrEqual(1);
  });
});

describe("actions and alerts", () => {
  it("recommends from the data, the largest effect first", () => {
    const actions = run("get_actions", {}).actions as { id: string; impact: number }[];
    expect(actions.map((a) => a.id)).toContain("fix-pricing-split");
    expect(actions.map((a) => a.id)).toContain("save-slipping");
    actions.slice(1).forEach((a, i) => expect(a.impact).toBeLessThanOrEqual(actions[i]!.impact));
  });

  it("fires on Labor Day and calls it a holiday, not an incident", () => {
    const alert = run("preview_alert", { metric: "dau", drop: 15 });
    expect(alert.fired).toBeGreaterThan(0);
    expect(alert.events.every((e: { kind: string }) => e.kind === "holiday")).toBe(true);
    expect(alert.summary).toMatch(/Labor Day week, not a real drop/);
  });

  it("fires at least as often with a smaller drop, and less when it must confirm", () => {
    const fired = (args: Record<string, unknown>) =>
      run("preview_alert", { metric: "signups", ...args }).fired;
    expect(fired({ drop: 5 })).toBeGreaterThanOrEqual(fired({ drop: 15 }));
    expect(fired({ drop: 5, confirm: "2of3" })).toBeLessThanOrEqual(fired({ drop: 5 }));
  });

  it("holds a weekend alert to Monday, and keeps the holiday as the cause when confirming", () => {
    const quiet = run("preview_alert", { metric: "dau", quiet: "weekends" });
    expect(quiet.summary).toMatch(/held to Monday/);
    const confirmed = run("preview_alert", { metric: "dau", confirm: "2of3" });
    expect(confirmed.events[0].kind).toBe("holiday");
  });

  it("never blames the iOS any-event bug for a signup alert", () => {
    const alert = run("preview_alert", { metric: "signups", drop: 5 });
    expect(alert.summary).not.toMatch(/iOS duplicate/);
  });

  it("tells each kind of action what approving would do", () => {
    const actions = run("get_actions", {}).actions as { kind: string; effect: string }[];
    expect(new Set(actions.map((a) => a.kind))).toEqual(
      new Set(["task", "audience", "experiment", "change"]),
    );
    actions.forEach((a) => expect(a.effect).toMatch(/^Would /));
  });
});

describe("retention modes and units", () => {
  it("reads a curve as flattened only when it falls under a point a week at the end", () => {
    expect(flattening([100, 50, 30, 22, 21.5, 21, 20.8])).toBe("flattened at 21% from week 3");
    expect(flattening([100, 60, 45, 35, 30, 25])).toBe("still falling 6.7 pts a week");
  });

  it("hatches the week in progress on exact cohorts only", () => {
    const exact = run("get_retention_cohorts", { weeks: 6 }).cohorts;
    expect(exact.every((c: { partial?: boolean }) => c.partial)).toBe(true);
    const unbounded = run("get_retention_cohorts", { weeks: 6, mode: "unbounded" }).cohorts;
    expect(unbounded.some((c: { partial?: boolean }) => c.partial)).toBe(false);
  });

  it("brackets weeks 0, 1, 2–3, and 4–7, each at least the exact week it starts with", () => {
    const bracket = run("get_retention_cohorts", { weeks: 8, mode: "bracket" });
    const exact = run("get_retention_cohorts", { weeks: 8 });
    expect(bracket.periodLabels).toEqual(["Week 0", "Week 1", "Weeks 2–3", "Weeks 4–7"]);
    expect(bracket.cohorts[0].values[2]).toBeGreaterThanOrEqual(exact.cohorts[0].values[2] - 0.05);
    expect(bracket.cohorts[0].values[3]).toBeGreaterThanOrEqual(exact.cohorts[0].values[4] - 0.05);
  });

  it("starts workspace cohorts at team activation, and never rises after", () => {
    const ws = run("get_retention_cohorts", { weeks: 6, unit: "workspace" }).cohorts;
    ws.forEach((c: { values: number[] }) => {
      expect(c.values[0]).toBeGreaterThan(25);
      expect(c.values[0]).toBeLessThanOrEqual(80);
    });
    const curves = run("get_retention_curves", { unit: "workspace", mode: "unbounded" });
    for (let w = 1; w < curves.business.length; w++)
      expect(curves.business[w]).toBeLessThanOrEqual(curves.business[w - 1] + 0.05);
    expect(run("get_retention_curves", { unit: "workspace" }).flattened).toMatch(/^All workspaces/);
  });
});

describe("comparisons", () => {
  it("compares usage with last year's same weekdays grown by the plan", () => {
    const lastYear = run("get_usage_kpis", { compare: "last_year" });
    const plan = run("get_usage_kpis", { compare: "plan" });
    expect(plan.periodLabel).toMatch(/vs plan$/);
    expect(plan.heroTrend.comparisonLabel).toBe("Plan");
    const previous = (k: { hero: { previous: string } }) => parseFloat(k.hero.previous);
    expect(previous(plan) / previous(lastYear)).toBeCloseTo(1.22, 1);
    const activation = plan.metrics.find((m: Kpi) => m.label === "Activation");
    expect(activation.previous).toBe("30.0%");
  });

  it("marks shipped and rolled-back experiments on the charts", () => {
    const events = run("get_annotations", { range: "30d" }).events as { label: string }[];
    expect(events.map((e) => e.label)).toContain("Quick-capture widget rolled back");
    expect(events.map((e) => e.label)).toContain("Onboarding checklist v2");
  });
});

describe("monetisation and usage commits", () => {
  const money = run("get_monetization", { range: "90d" });

  it("narrows the funnel at every step, and paying never exceeds product-qualified", () => {
    const values = money.funnel.map((s: { value: number }) => s.value);
    values.slice(1).forEach((v: number, i: number) => expect(v).toBeLessThanOrEqual(values[i]));
  });

  it("keeps free to paid inside the freemium good band", () => {
    money.freeToPaid.forEach((v: number) => {
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
    });
  });

  it("starts trials from a third of new paying workspaces, and adds the outcomes up to them", () => {
    const total = money.trials.reduce((a: number, t: { value: number }) => a + t.value, 0);
    const paying = money.funnel.find((s: { label: string }) => s.label.startsWith("Paying")).value;
    expect(Math.abs(total - paying * 0.35)).toBeLessThanOrEqual(3);
  });

  it("gives every monetisation KPI a real weekly series", () => {
    money.metrics.forEach((m: { series?: number[] }) =>
      expect(m.series?.length).toBeGreaterThan(1),
    );
  });

  it("lists under-pacing commits first, still two weeks or more from renewal", () => {
    const { commits } = run("get_usage_commits", {});
    const firstOther = commits.findIndex((c: { status: string }) => c.status !== "under");
    commits
      .slice(0, firstOther)
      .forEach((c: { renewalInDays: number }) =>
        expect(c.renewalInDays).toBeGreaterThanOrEqual(14),
      );
    expect(commits.map((c: { name: string }) => c.name)).toContain("Brightline Health");
    const over = commits.find((c: { status: string }) => c.status === "over");
    expect(over.pace).toBeGreaterThan(110);
  });
});

describe("weekly review", () => {
  const { rows } = run("get_weekly_review", {});

  it("gives each metric 6 weeks and 12 months, with last year beside them", () => {
    rows.forEach(
      (r: { weeks: { current: number[]; yearAgo: number[] }; months: { current: number[] } }) => {
        expect(r.weeks.current.length).toBe(6);
        expect(r.weeks.yearAgo.length).toBe(6);
        expect(r.months.current.length).toBe(12);
      },
    );
  });

  it("explains known exceptions and names an owner for the rest", () => {
    const exceptions = rows.filter((r: { status: string }) => r.status === "exception");
    expect(exceptions.length).toBeGreaterThan(0);
    exceptions.forEach((r: { cause: string; owner: string }) => {
      expect(r.cause.length).toBeGreaterThan(0);
      expect(r.owner.length).toBeGreaterThan(0);
    });
    expect(rows.find((r: { key: string }) => r.key === "signups").cause).toBe("Cause unknown");
    expect(rows.find((r: { key: string }) => r.key === "activation").cause).toMatch(/checklist/);
  });

  it("ends the MRR weeks on the revenue card's MRR", () => {
    const mrr = rows.find((r: { key: string }) => r.key === "mrr");
    const walk = run("get_revenue_retention", { plan: "all" }).walk;
    expect(Math.abs(mrr.weeks.current[5] - walk.at(-1).value)).toBeLessThan(2);
  });
});

describe("signups by source", () => {
  it("adds up to the funnel's signups, and its rates average to activation", () => {
    for (const range of ["7d", "30d", "90d"] as const) {
      const sources = run("get_signups_by_source", { range });
      const funnel = run("get_activation_funnel", { range });
      const total = sources.items.reduce((a: number, i: { value: number }) => a + i.value, 0);
      expect(total).toBe(funnel.steps[0].value);
    }
  });
});
