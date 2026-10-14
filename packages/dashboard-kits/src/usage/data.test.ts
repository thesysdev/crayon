import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { runTool } from "../core/prompt";
import type { Kpi } from "../core/schemas";
import { RULES, usageHandlers } from "./data";
import { itemModel } from "./items";
import { usageKit } from "./kit";
import { dayIndex, WORKSPACE_IDS, workspaceModel } from "./members";

// A workspace's usage page has to add up: every figure is counted off its members.

const run = (tool: string, args: Record<string, unknown> = {}) =>
  runTool(usageKit, tool, args, usageHandlers) as any;
const total = (values: number[]) => values.reduce((a, b) => a + b, 0);

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
  for (const tool of usageKit.tools) {
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

describe.each(WORKSPACE_IDS)("%s", (workspace) => {
  const w = workspaceModel(workspace);

  it("adds every seat state up to the paid seats", () => {
    const seats = run("get_seat_inventory", { workspace });
    expect(total(seats.states.map((s: { seats: number }) => s.seats))).toBe(seats.paid);
  });

  it("agrees on active members across the overview, the activity chart, and the seats", () => {
    const activity = run("get_activity", { workspace, window: "28d" });
    const seats = run("get_seat_inventory", { workspace });
    const active = seats.states.find((s: { state: string }) => s.state === "active").seats;
    expect(activity.mau.at(-1)).toBe(active);
    expect(active).toBe(w.record.active28);
  });

  it("lists exactly the seats to reclaim, each idle 30+ days or never active after 14", () => {
    const reclaim = run("get_members", { workspace, view: "reclaim", limit: 500 });
    for (const r of reclaim.rows)
      expect(r.daysInactive).toBeGreaterThanOrEqual(RULES.neverActiveGrace);
    const overview = run("get_workspace_overview", { workspace });
    const kpi = overview.metrics.find((m: Kpi) => m.label === "Seats to reclaim");
    expect(Number(kpi.value)).toBe(reclaim.total);
  });

  it("hides every team under 5 members", () => {
    for (const row of run("get_team_adoption", { workspace }).rows) {
      expect(row.hidden).toBe(row.members < RULES.minGroup);
      if (row.hidden) expect(row.active).toBeUndefined();
    }
  });

  it("never shows a team under 5 members in credits by team", () => {
    const sizes = new Map(
      run("get_team_adoption", { workspace }).rows.map((r: { team: string; members: number }) => [
        r.team,
        r.members,
      ]),
    );
    for (const t of run("get_credits", { workspace }).byTeam) {
      if (sizes.has(t.name)) expect(sizes.get(t.name)).toBeGreaterThanOrEqual(RULES.minGroup);
    }
  });

  it("hides names when asked", () => {
    const rows = run("get_members", { workspace, names: "hide" }).rows;
    for (const r of rows) expect(r.name).toMatch(/^Member \d+$/);
  });

  it("states the value estimate's working: actions × minutes, × rate", () => {
    const v = run("get_value_estimate", { workspace, minutes: "10", rate: "100" });
    const actions = total(v.lines.map((l: { actions: number }) => l.actions));
    expect(Math.abs(v.hours - (actions * 10) / 60)).toBeLessThan(2);
    expect(Math.abs(v.value - v.hours * 100)).toBeLessThan(150);
  });
});

describe("stories", () => {
  it("Brightline: idle seats before renewal and AI credits under pace", () => {
    const insights = run("get_usage_insights", { workspace: "brightline" }).insights;
    expect(insights[0].title).toMatch(/idle, 41 days before renewal/);
    const pool = run("get_credits", { workspace: "brightline" }).pool;
    expect(pool.pace).toBeLessThan(80);
    expect(pool.kind).toBe("annual");
  });

  it("Kestrel: seats nearly full and the credit pool on pace to run out", () => {
    const titles = run("get_usage_insights", { workspace: "kestrel" }).insights.map(
      (i: { title: string }) => i.title,
    );
    expect(titles.some((t: string) => t.startsWith("Seats nearly full"))).toBe(true);
    expect(run("get_credits", { workspace: "kestrel" }).pool.alert).toBe("projected");
  });

  it("puts the workspace against peers of its own size", () => {
    expect(run("get_peer_benchmarks", { workspace: "bluefin" }).pool).toMatch(/1–24 seats/);
    expect(run("get_peer_benchmarks", { workspace: "brightline" }).pool).toMatch(/100–249 seats/);
  });
});

describe("collaboration and champions", () => {
  for (const workspace of WORKSPACE_IDS) {
    const w = workspaceModel(workspace);

    it(`${workspace}: edits only on days a member was active, and only on items that existed`, () => {
      const model = itemModel(w);
      const { item, member, ago } = model.edits;
      for (let k = 0; k < item.length; k++) {
        expect(w.members[member[k]!]!.active[dayIndex(ago[k]!)]).toBe(1);
        expect(model.items[item[k]!]!.bornAgo).toBeGreaterThanOrEqual(ago[k]!);
      }
    });

    it(`${workspace}: counts cross-team items among items worked on together`, () => {
      const c = run("get_collaboration", { workspace });
      const value = (label: string) =>
        parseFloat(c.metrics.find((m: Kpi) => m.label === label).value);
      expect(value("Across teams")).toBeLessThanOrEqual(value("Worked on together"));
    });

    it(`${workspace}: never names a team under 5 members in collaboration`, () => {
      const small = new Set(
        w.teams.filter((t) => w.members.filter((m) => m.team === t).length < RULES.minGroup),
      );
      const c = run("get_collaboration", { workspace });
      for (const row of [...c.pairs, ...c.byTeam])
        for (const team of small) expect(row.name).not.toContain(team);
    });

    it(`${workspace}: ranks ten champions, hides names by default, and leaves out who opted out`, () => {
      const hidden = run("get_champions", { workspace });
      expect(hidden.rows.length).toBeLessThanOrEqual(10);
      hidden.rows.forEach((r: { name: string }, k: number) =>
        expect(r.name).toBe(`Champion ${k + 1}`),
      );
      const small = w.teams.filter(
        (t) => w.members.filter((m) => m.team === t).length < RULES.minGroup,
      );
      hidden.rows.forEach((r: { team: string }) => expect(small).not.toContain(r.team));
      const shown = run("get_champions", { workspace, names: "show" }).rows;
      shown
        .slice(1)
        .forEach((r: { score: number }, k: number) =>
          expect(r.score).toBeLessThanOrEqual(shown[k].score),
        );
      expect(hidden.note).toMatch(/opted out/);
    });
  }
});
