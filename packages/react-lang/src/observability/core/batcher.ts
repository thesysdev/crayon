import { EventQueue } from "./queue";
import { sendEnvelope, sendEnvelopeBeacon, type TransportConfig } from "./transport";
import { SDK_VERSION, type WireEnvelope, type WireEvent } from "./wire";

const FLUSH_INTERVAL_MS = 5000;
const BATCH_SIZE = 50;
const DEFAULT_FLUSH_TIMEOUT_MS = 10_000;

function buildEnvelope(events: WireEvent[], droppedEvents: number): WireEnvelope {
  return {
    v: 1,
    sentAt: Date.now(),
    sdk: { name: "react-lang", version: SDK_VERSION },
    ...(droppedEvents > 0 ? { droppedEvents } : {}),
    events,
  };
}

type BatchSendResult = { accepted: boolean; timedOut: boolean };

export class Batcher {
  private readonly queue = new EventQueue();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private readonly onPageHide: () => void;
  private readonly onVisibilityChange: () => void;

  constructor(private readonly transport: TransportConfig) {
    this.onPageHide = () => {
      this.flushBeaconSync();
    };
    this.onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        this.flushBeaconSync();
      }
    };

    if (typeof document !== "undefined") {
      window.addEventListener("pagehide", this.onPageHide);
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    }
  }

  enqueue(event: WireEvent): void {
    if (this.closed) return;
    this.queue.enqueue(event);
    if (this.queue.size >= BATCH_SIZE) {
      void this.flushNextBatch();
    }
    this.ensureInterval();
  }

  async flush(timeoutMs = DEFAULT_FLUSH_TIMEOUT_MS): Promise<boolean> {
    if (this.closed && this.queue.size === 0) return true;

    const deadline = Date.now() + timeoutMs;
    let allAccepted = true;

    while (this.queue.size > 0) {
      if (Date.now() >= deadline) return false;

      const result = await this.flushNextBatch(deadline);
      if (result.timedOut) return false;
      if (!result.accepted) allAccepted = false;
    }

    this.stopInterval();
    return allAccepted;
  }

  close(): Promise<boolean> {
    this.closed = true;
    this.detachPageListeners();
    this.stopInterval();
    return this.flush();
  }

  private ensureInterval(): void {
    if (this.intervalId !== null || this.closed) return;
    this.intervalId = setInterval(() => {
      if (this.queue.size === 0) {
        this.stopInterval();
        return;
      }
      void this.flushNextBatch();
    }, FLUSH_INTERVAL_MS);
  }

  private stopInterval(): void {
    if (this.intervalId === null) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private detachPageListeners(): void {
    if (typeof document === "undefined") return;
    window.removeEventListener("pagehide", this.onPageHide);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  private flushBeaconSync(): void {
    while (this.queue.size > 0) {
      const droppedEvents = this.queue.readAndResetDropped();
      const events = this.queue.drain(BATCH_SIZE);
      if (events.length === 0) break;
      sendEnvelopeBeacon(buildEnvelope(events, droppedEvents), this.transport);
    }
    this.stopInterval();
  }

  private async flushNextBatch(deadline?: number): Promise<BatchSendResult> {
    if (this.queue.size === 0) return { accepted: true, timedOut: false };

    const droppedEvents = this.queue.readAndResetDropped();
    const events = this.queue.drain(BATCH_SIZE);
    if (events.length === 0) return { accepted: true, timedOut: false };

    return this.sendWithDeadline(buildEnvelope(events, droppedEvents), deadline);
  }

  private async sendWithDeadline(
    envelope: WireEnvelope,
    deadline?: number,
  ): Promise<BatchSendResult> {
    const sendPromise = sendEnvelope(envelope, this.transport).catch(() => false);

    if (deadline === undefined) {
      return { accepted: await sendPromise, timedOut: false };
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return { accepted: false, timedOut: true };
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<BatchSendResult>((resolve) => {
      timeoutId = setTimeout(() => resolve({ accepted: false, timedOut: true }), remainingMs);
    });

    try {
      return await Promise.race([
        sendPromise.then((accepted) => ({ accepted, timedOut: false })),
        timeoutPromise,
      ]);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }
}
