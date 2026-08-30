import { describe, expect, it } from "vitest";
import { EventQueue } from "./queue";
import type { WireEvent } from "./wire";

function wireEvent(id: string): WireEvent {
  return {
    id,
    kind: "react-lang:stream",
    level: "info",
    timestamp: 1,
    updateIndex: 1,
    errorCount: 0,
  };
}

describe("EventQueue", () => {
  it("preserves FIFO order", () => {
    const queue = new EventQueue(10);
    queue.enqueue(wireEvent("a"));
    queue.enqueue(wireEvent("b"));
    queue.enqueue(wireEvent("c"));

    expect(queue.drain(2).map((event) => event.id)).toEqual(["a", "b"]);
    expect(queue.drain(10).map((event) => event.id)).toEqual(["c"]);
  });

  it("drops the oldest event on overflow and counts drops", () => {
    const queue = new EventQueue(2);
    queue.enqueue(wireEvent("a"));
    queue.enqueue(wireEvent("b"));
    queue.enqueue(wireEvent("c"));

    expect(queue.size).toBe(2);
    expect(queue.drain(10).map((event) => event.id)).toEqual(["b", "c"]);
    expect(queue.readAndResetDropped()).toBe(1);
    expect(queue.readAndResetDropped()).toBe(0);
  });
});
