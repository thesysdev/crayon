import { observability, type Remove } from "@openuidev/observability";
import { Batcher } from "./batcher";
import { selectEvent, type SelectorOptions } from "./selector";
import type { TransportConfig } from "./transport";

export interface CloudClientOptions extends SelectorOptions, TransportConfig {}

export class CloudObservabilityClient {
  private readonly removeListener: Remove;
  private readonly batcher: Batcher;

  constructor(options: CloudClientOptions) {
    this.batcher = new Batcher({
      endpoint: options.endpoint,
      apiKey: options.apiKey,
      debug: options.debug,
    });

    this.removeListener = observability.listenAll((event) => {
      try {
        const wireEvent = selectEvent(event, options);
        if (wireEvent) this.batcher.enqueue(wireEvent);
      } catch (error) {
        if (options.debug) {
          console.warn(
            "[@openuidev/react-lang/observability]",
            "listener threw; dropping event",
            error,
          );
        }
      }
    });
  }

  flush(timeoutMs?: number): Promise<boolean> {
    return this.batcher.flush(timeoutMs);
  }

  close(): Promise<boolean> {
    this.removeListener();
    return this.batcher.close();
  }
}
