import { describe, expect, it } from "vitest";
import { asArray, buildChartData, buildSliceData, hasAllProps } from "../genui-lib/helpers";

describe("hasAllProps", () => {
  it("returns true when all keys are present", () => {
    expect(hasAllProps({ a: 1, b: 2 }, "a", "b")).toBe(true);
  });

  it("returns false when a key is missing", () => {
    expect(hasAllProps({ a: 1 }, "a", "b")).toBe(false);
  });

  it("returns false when a value is null", () => {
    expect(hasAllProps({ a: null, b: 2 }, "a", "b")).toBe(false);
  });
});

describe("asArray", () => {
  it("returns the same array if already an array", () => {
    expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("wraps a non-array value in an array", () => {
    expect(asArray(42)).toEqual([42]);
  });

  it("returns an empty array for null/undefined", () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
  });
});

describe("buildChartData", () => {
  it("builds chart data from tabular format", () => {
    const result = buildChartData(["day", "views", "users"], [
      ["Mon", 100, 50],
      ["Tue", 200, 75],
    ]);
    expect(result).toEqual([
      { category: "Mon", views: 100, users: 50 },
      { category: "Tue", views: 200, users: 75 },
    ]);
  });

  it("builds chart data from element format", () => {
    const result = buildChartData(["Jan", "Feb"], [
      { type: "element", props: { category: "Sales", values: [100, 200] } },
    ]);
    expect(result).toEqual([
      { category: "Jan", Sales: 100 },
      { category: "Feb", Sales: 200 },
    ]);
  });

  it("handles empty labels", () => {
    expect(buildChartData([], [])).toEqual([]);
  });
});

describe("buildSliceData", () => {
  it("builds slice data from element nodes", () => {
    const result = buildSliceData([
      { type: "element", props: { category: "A", value: 10 } },
      { type: "element", props: { category: "B", value: 20 } },
    ]);
    expect(result).toEqual([
      { category: "A", value: 10 },
      { category: "B", value: 20 },
    ]);
  });

  it("filters out non-element nodes", () => {
    const result = buildSliceData([
      { type: "element", props: { category: "A", value: 10 } },
      { type: "not-element", props: { category: "B", value: 20 } },
    ]);
    expect(result).toEqual([{ category: "A", value: 10 }]);
  });
});
