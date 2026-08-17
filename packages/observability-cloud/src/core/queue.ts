import type { WireEvent } from "./wire";

const DEFAULT_CAPACITY = 500;

export class EventQueue {
  private readonly items: WireEvent[] = [];
  private dropped = 0;

  constructor(private readonly capacity = DEFAULT_CAPACITY) {}

  get size(): number {
    return this.items.length;
  }

  enqueue(event: WireEvent): void {
    if (this.items.length >= this.capacity) {
      this.items.shift();
      this.dropped += 1;
    }
    this.items.push(event);
  }

  /** Removes and returns up to `limit` events in FIFO order. */
  drain(limit: number): WireEvent[] {
    if (limit <= 0 || this.items.length === 0) return [];
    return this.items.splice(0, Math.min(limit, this.items.length));
  }

  /** Returns the overflow drop count since the last read and resets it to zero. */
  readAndResetDropped(): number {
    const count = this.dropped;
    this.dropped = 0;
    return count;
  }
}
