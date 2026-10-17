import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { coerceArgs } from "./prompt";

describe("coerceArgs: numbers", () => {
  const input = z.object({
    weeks: z.number().int().min(4).max(10).default(8),
    share: z.number().min(0).max(1).optional(),
    label: z.string().optional(),
  });

  it("brings numbers inside their bounds and to whole numbers where wanted", () => {
    expect(coerceArgs(input, { weeks: 12 })).toEqual({ weeks: 10 });
    expect(coerceArgs(input, { weeks: 2 })).toEqual({ weeks: 4 });
    expect(coerceArgs(input, { weeks: 6.6, share: 1.4 })).toEqual({ weeks: 7, share: 1 });
  });

  it("leaves everything else alone", () => {
    expect(coerceArgs(input, { weeks: 8, label: "x" })).toEqual({ weeks: 8, label: "x" });
    expect(coerceArgs(input, {})).toEqual({});
  });

  it("lets the schema still reject what is not a number", () => {
    expect(() => input.parse(coerceArgs(input, { weeks: "twelve" }))).toThrow();
  });
});

describe("coerceArgs: choices", () => {
  const input = z.object({
    range: z.enum(["7d", "30d", "90d", "mtd"]).default("30d"),
    view: z.enum(["weekly", "states"]).optional(),
    mode: z.enum(["a", "b"]),
  });

  it("maps periods to the nearest day-count option", () => {
    expect(coerceArgs(input, { range: "ytd" })).toEqual({ range: "90d" });
    expect(coerceArgs(input, { range: "12m" })).toEqual({ range: "90d" });
    expect(coerceArgs(input, { range: "2 weeks" })).toEqual({ range: "7d" });
    expect(coerceArgs(input, { range: "60d" })).toEqual({ range: "30d" });
    expect(coerceArgs(input, { range: "30D" })).toEqual({ range: "30d" });
  });

  it("falls back to the default, or drops an optional choice, when nothing fits", () => {
    expect(input.parse(coerceArgs(input, { range: "banana", mode: "a" })).range).toBe("30d");
    expect(coerceArgs(input, { view: "monthly", mode: "a" })).toEqual({ mode: "a" });
  });

  it("leaves a required choice to fail validation", () => {
    expect(() => input.parse(coerceArgs(input, { mode: "c" }))).toThrow();
  });
});
