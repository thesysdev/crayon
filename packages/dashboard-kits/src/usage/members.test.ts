import { describe, expect, it } from "vitest";
import { commitOf } from "../analytics/data";
import { activeBetween, sum, sumFrom, WORKSPACE_IDS, workspaceModel } from "./members";

describe("workspace model", () => {
  for (const id of WORKSPACE_IDS) {
    const w = workspaceModel(id);
    const count = (from: number, to: number) =>
      w.members.filter((m) => activeBetween(m, from, to)).length;

    it(`${id}: counts the vendor's record off its members`, () => {
      expect(count(6, 0)).toBe(w.record.active7);
      expect(count(27, 0)).toBe(w.record.active28);
      expect(count(117, 90)).toBe(w.record.active28Before);
    });

    it(`${id}: adds seat states up to the paid seats`, () => {
      expect(w.members.length + w.invites.length + w.unassigned).toBe(w.paidSeats);
      expect(w.unassigned).toBeGreaterThanOrEqual(0);
    });

    it(`${id}: is never active after a member's last active day, nor before they joined`, () => {
      for (const m of w.members) {
        for (let ago = 0; ago < 210; ago++) {
          const on = activeBetween(m, ago, ago);
          if (m.lastActiveAgo == null || ago < m.lastActiveAgo || ago > m.joinedAgo) {
            expect(on).toBe(false);
          }
        }
        if (m.lastActiveAgo != null)
          expect(activeBetween(m, m.lastActiveAgo, m.lastActiveAgo)).toBe(true);
      }
    });

    it(`${id}: gives AI actions only to members with access, after AI was turned on`, () => {
      for (const m of w.members) {
        if (!m.aiAccess) expect(sumFrom(m.aiActions, 210)).toBe(0);
        expect(sumFrom(m.aiActions, 210) - sumFrom(m.aiActions, w.aiSince + 1)).toBe(0);
      }
    });
  }

  it("matches Brightline's credits so far to the vendor's commit record", () => {
    const w = workspaceModel("brightline");
    const actions = sum(w.members.map((m) => sumFrom(m.aiActions, w.credits.elapsedDays)));
    expect(w.credits.kind).toBe("annual");
    expect(
      Math.abs(actions * w.credits.perAction - commitOf("Brightline Health")!.used),
    ).toBeLessThan(1);
  });
});
