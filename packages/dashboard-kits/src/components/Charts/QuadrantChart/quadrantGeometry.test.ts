import { describe, expect, it } from "vitest";
import { BUBBLE_STRIDE, median, packBubbles, placeLabels, quadrantOf } from "./quadrantGeometry";

describe("median", () => {
  it("takes the middle value, or the mean of the middle two", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("quadrantOf", () => {
  it("splits at the medians", () => {
    expect(quadrantOf({ x: 80, y: 4 }, 50, 2)).toBe("highHigh");
    expect(quadrantOf({ x: 20, y: 4 }, 50, 2)).toBe("lowHigh");
    expect(quadrantOf({ x: 80, y: 1 }, 50, 2)).toBe("highLow");
    expect(quadrantOf({ x: 20, y: 1 }, 50, 2)).toBe("lowLow");
  });
});

describe("placeLabels", () => {
  it("leaves a label off when every spot would cover another, keeping the bigger bubble's", () => {
    // Six bubbles on one point: four spots around it, so two labels can't fit.
    const crowd = [8, 20, 8, 8, 8, 8].map((r, i) => ({ cx: 200, cy: 100, r, label: `Point ${i}` }));
    const labels = placeLabels(crowd, { left: 0, right: 400 });
    expect(labels[1]).toBeDefined();
    expect(labels.some((l) => l === undefined)).toBe(true);
  });

  it("puts a lone label to the right of its bubble", () => {
    const [p] = placeLabels([{ cx: 100, cy: 100, r: 8, label: "Docs" }], { left: 0, right: 400 });
    expect(p?.anchor).toBe("start");
    expect(p!.x).toBeGreaterThan(108);
  });

  it("moves a label off a neighbouring bubble", () => {
    const [, second] = placeLabels(
      [
        { cx: 150, cy: 100, r: 8, label: "Right neighbour" },
        { cx: 120, cy: 100, r: 8, label: "Docs" },
      ],
      { left: 0, right: 400 },
    );
    expect(second?.anchor).not.toBe("start");
  });

  it("flips a label left at the right edge", () => {
    const [p] = placeLabels([{ cx: 390, cy: 100, r: 8, label: "Edge" }], { left: 0, right: 400 });
    expect(p?.anchor).toBe("end");
  });
});

describe("packBubbles", () => {
  it("lays out each bubble and its label at the stride, NaN where unlabeled", () => {
    const flat = packBubbles(
      [
        { cx: 1, cy: 2, r: 3, label: "a" },
        { cx: 4, cy: 5, r: 6, label: "b" },
      ],
      [{ x: 7, y: 8, anchor: "start" }, undefined],
    );
    expect(flat.length).toBe(2 * BUBBLE_STRIDE);
    expect([...flat.subarray(0, 5)]).toEqual([1, 2, 3, 7, 8]);
    expect(Number.isNaN(flat[8]!)).toBe(true);
  });
});
