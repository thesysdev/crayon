import { describe, expect, it } from "vitest";
import { liftToClear, type Box } from "./avoidHostControls";

// A 40px launcher 16px above the bottom of a 768px-tall window.
const launcher: Box = { top: 712, bottom: 752, left: 712, right: 752 };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const controlsAt = (controls: Box[]) => (box: Box) =>
  controls.find((c) => overlaps(box, c)) ?? null;

describe("liftToClear", () => {
  it("stays put when nothing is underneath", () => {
    expect(liftToClear(launcher, "bottom", controlsAt([]), 300)).toBe(0);
  });

  it("moves a bottom launcher just above a control it covers", () => {
    const send: Box = { top: 700, bottom: 736, left: 700, right: 736 };
    const lift = liftToClear(launcher, "bottom", controlsAt([send]), 300);
    expect(lift).toBe(752 - 700 + 8);
    const moved = { ...launcher, top: launcher.top - lift, bottom: launcher.bottom - lift };
    expect(overlaps(moved, send)).toBe(false);
  });

  it("clears controls stacked above each other", () => {
    const send: Box = { top: 700, bottom: 736, left: 700, right: 736 };
    const chip: Box = { top: 640, bottom: 680, left: 690, right: 760 };
    const lift = liftToClear(launcher, "bottom", controlsAt([send, chip]), 300);
    const moved = { ...launcher, top: launcher.top - lift, bottom: launcher.bottom - lift };
    expect(overlaps(moved, send) || overlaps(moved, chip)).toBe(false);
  });

  it("moves a top launcher down below a control", () => {
    const top: Box = { top: 16, bottom: 56, left: 712, right: 752 };
    const toggle: Box = { top: 12, bottom: 44, left: 720, right: 752 };
    expect(liftToClear(top, "top", controlsAt([toggle]), 300)).toBe(44 + 8 - 16);
  });

  it("gives up rather than moving further than the limit", () => {
    const tall: Box = { top: 100, bottom: 760, left: 700, right: 760 };
    expect(liftToClear(launcher, "bottom", controlsAt([tall]), 300)).toBe(0);
  });
});
