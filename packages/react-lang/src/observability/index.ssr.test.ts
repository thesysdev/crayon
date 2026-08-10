import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as cloud from "./index";

const GLOBAL_KEY = Symbol.for("openui.cloudObservability");

function resetGlobalState(): void {
  const root = globalThis as Record<symbol, { client: unknown; options: unknown } | undefined>;
  root[GLOBAL_KEY] = { client: null, options: null };
}

const baseOptions = {
  apiKey: "test-key",
  debug: true,
} as const;

describe("cloud observability SSR guard", () => {
  beforeEach(async () => {
    await cloud.close();
    resetGlobalState();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cloud.close();
    resetGlobalState();
  });

  it("init no-ops when window is undefined", () => {
    const originalWindow = globalThis.window;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });

    cloud.init(baseOptions);

    expect(debug).toHaveBeenCalledWith(
      "[@openuidev/react-lang/observability]",
      "init skipped in non-browser environment",
    );
    expect((globalThis as Record<symbol, { client: unknown }>)[GLOBAL_KEY]?.client).toBeNull();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });
});
