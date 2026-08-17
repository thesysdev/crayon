import type { ObservabilityEvent } from "@openuidev/observability";
import { describe, expect, it, vi } from "vitest";
import { selectEvent } from "./selector";

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

describe("selectEvent", () => {
  it("samples deterministically per id and respects rate 0 and 1", () => {
    const id = "deterministic-id-a";
    const options = { capture: "full" as const, sampleRate: 0.5, debug: false };

    const first = selectEvent(settledEvent({ id }), options);
    const second = selectEvent(settledEvent({ id }), options);
    expect(Boolean(first)).toBe(Boolean(second));

    const decisions = Array.from({ length: 100 }, (_, index) =>
      Boolean(selectEvent(settledEvent({ id: `sample-id-${index}` }), options)),
    );
    expect(decisions.some(Boolean)).toBe(true);
    expect(decisions.some((kept) => !kept)).toBe(true);

    expect(selectEvent(settledEvent({ id }), { ...options, sampleRate: 1 })).not.toBeNull();
    expect(selectEvent(settledEvent({ id }), { ...options, sampleRate: 0 })).toBeNull();
  });

  it("beforeSend can mutate or drop events", () => {
    const mutated = selectEvent(settledEvent(), {
      capture: "full",
      sampleRate: 1,
      debug: false,
      beforeSend: (event) => ({ ...event, message: "mutated" }),
    });
    const dropped = selectEvent(settledEvent(), {
      capture: "full",
      sampleRate: 1,
      debug: false,
      beforeSend: () => null,
    });

    expect(mutated?.message).toBe("mutated");
    expect(dropped).toBeNull();
  });

  it("drops when beforeSend throws without propagating", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      selectEvent(settledEvent(), {
        capture: "full",
        sampleRate: 1,
        debug: true,
        beforeSend: () => {
          throw new Error("boom");
        },
      }),
    ).toBeNull();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
