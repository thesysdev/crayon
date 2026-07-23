import { afterEach, describe, expect, it, vi } from "vitest";

import { classifyProcessFailure } from "./error-telemetry";
import { runCommand } from "./process-runner";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runCommand", () => {
  it("retains a bounded diagnostic view of both stdout and stderr", async () => {
    const result = await runCommand(
      process.execPath,
      [
        "-e",
        "process.stdout.write('stdout-code'); process.stderr.write('stderr-code'); process.exit(1)",
      ],
      process.cwd(),
    );

    expect(result).toMatchObject({
      succeeded: false,
      exitCode: 1,
      signal: null,
    });
    expect(result.diagnosticOutput).toContain("stdout-code");
    expect(result.diagnosticOutput).toContain("stderr-code");
  });

  it("detects a pnpm code that falls outside the bounded diagnostic window", async () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = await runCommand(
      process.execPath,
      [
        "-e",
        "process.stderr.write('x'.repeat(9000) + 'ERR_PNPM_PEER_DEP_ISSUES' + 'y'.repeat(9000)); process.exit(1)",
      ],
      process.cwd(),
    );

    expect(result.diagnosticOutput.length).toBeLessThanOrEqual(16_384);
    expect(result.diagnosticOutput).not.toContain("ERR_PNPM_PEER_DEP_ISSUES");
    expect(classifyProcessFailure(result)).toMatchObject({
      failure_category: "peer_dependency",
      failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
    });
  });

  it("forwards termination and removes its parent signal listener", async () => {
    const existingListeners = new Set(process.listeners("SIGTERM"));
    const pending = runCommand(
      process.execPath,
      ["-e", "setInterval(() => undefined, 1000)"],
      process.cwd(),
    );
    const signalListener = process
      .listeners("SIGTERM")
      .find((listener) => !existingListeners.has(listener));

    expect(signalListener).toBeDefined();
    signalListener?.("SIGTERM");
    const result = await pending;

    expect(result).toMatchObject({
      succeeded: false,
      signal: "SIGTERM",
    });
    expect(classifyProcessFailure(result)).toMatchObject({
      cancellation_exit_code: 143,
      failure_category: "user_cancelled",
      failure_code: "TERMINATED",
    });
    expect(process.listeners("SIGTERM")).not.toContain(signalListener);
  });
});
