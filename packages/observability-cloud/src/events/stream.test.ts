import type { ObservabilityEvent } from "@openuidev/observability";
import { describe, expect, it } from "vitest";
import { selectStreamEvent } from "./stream";

function settledEvent(overrides: Record<string, unknown> = {}): ObservabilityEvent {
  return {
    level: "info",
    timestamp: 1_700_000_000_000,
    detail: {
      id: "stream-1",
      kind: "react-lang:stream",
      phase: "settled",
      updateIndex: 2,
      errorCount: 0,
      response: "hello",
      message: "OpenUI Lang settled",
      errors: [],
      parser: {
        incomplete: false,
        unresolved: [],
        orphaned: [],
        statementCount: 1,
      },
      ...overrides,
    },
  };
}

describe("selectStreamEvent", () => {
  it("accepts settled react-lang:stream events only", () => {
    expect(selectStreamEvent(settledEvent(), "full")).toMatchObject({
      id: "stream-1",
      kind: "react-lang:stream",
      level: "info",
      timestamp: 1_700_000_000_000,
      updateIndex: 2,
      errorCount: 0,
      response: "hello",
      message: "OpenUI Lang settled",
      errors: [],
    });
  });

  it("rejects streaming and other kinds", () => {
    expect(selectStreamEvent(settledEvent({ phase: "streaming" }), "full")).toBeNull();
    expect(selectStreamEvent(settledEvent({ kind: "other", phase: "settled" }), "full")).toBeNull();
  });

  it("truncates full-mode response and sets responseTruncated", () => {
    const selected = selectStreamEvent(settledEvent({ response: "x".repeat(16_385) }), "full");

    expect(selected?.response).toHaveLength(16_384);
    expect(selected?.responseTruncated).toBe(true);
  });

  it("minimal mode contains only allowed keys", () => {
    const selected = selectStreamEvent(settledEvent(), "minimal");

    expect(selected).toEqual({
      id: "stream-1",
      kind: "react-lang:stream",
      level: "info",
      timestamp: 1_700_000_000_000,
      updateIndex: 2,
      errorCount: 0,
      parser: {
        incomplete: false,
        unresolved: [],
        orphaned: [],
        statementCount: 1,
      },
    });
    expect(selected).not.toHaveProperty("response");
    expect(selected).not.toHaveProperty("responseTruncated");
    expect(selected).not.toHaveProperty("message");
    expect(selected).not.toHaveProperty("errors");
  });
});
