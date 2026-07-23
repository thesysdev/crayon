import { describe, expect, it, vi } from "vitest";

import { captureCreateStageSkipped, instrumentCreateStage } from "./create-telemetry";
import { classifyProcessFailure } from "./error-telemetry";
import type { CommandResult } from "./process-runner";
import { CliCancelledError } from "./telemetry";

const telemetryRecorder = () => {
  const capture = vi.fn();
  return {
    capture,
    telemetry: { capture },
  };
};

describe("instrumentCreateStage", () => {
  it("records a benchmarkable stage lifecycle and duration", async () => {
    const { capture, telemetry } = telemetryRecorder();
    const clock = [100, 145];

    const result = await instrumentCreateStage("scaffold", () => "ok", {
      telemetry,
      now: () => clock.shift() ?? 145,
      properties: { template: "openui-cloud" },
    });

    expect(result).toBe("ok");
    expect(capture).toHaveBeenNthCalledWith(
      1,
      "cli_create_stage",
      expect.objectContaining({
        stage: "scaffold",
        stage_rank: 300,
        stage_schema_version: 1,
        stage_status: "started",
      }),
    );
    expect(capture).toHaveBeenNthCalledWith(
      2,
      "cli_create_stage",
      expect.objectContaining({
        stage: "scaffold",
        stage_status: "succeeded",
        duration_ms: 45,
      }),
    );
  });

  it("supports terminal status and normalized result properties", async () => {
    const { capture, telemetry } = telemetryRecorder();

    await instrumentCreateStage(
      "dependency_install",
      () => ({
        succeeded: false,
        failure_category: "peer_dependency",
        failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
      }),
      {
        telemetry,
        resultStatus: () => "failed",
        resultProperties: (result) => result,
      },
    );

    expect(capture).toHaveBeenLastCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        stage_status: "failed",
        failure_category: "peer_dependency",
        failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
      }),
    );
  });

  it("classifies thrown stage errors without emitting their raw message", async () => {
    const { capture, telemetry } = telemetryRecorder();

    await expect(
      instrumentCreateStage(
        "dependency_install",
        () => {
          throw Object.assign(new Error("private/path ERR_PNPM_PEER_DEP_ISSUES secret-value"), {
            status: 1,
          });
        },
        { telemetry },
      ),
    ).rejects.toMatchObject({
      name: "CreateError",
      stage: "dependency_install",
    });

    expect(capture).toHaveBeenLastCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        stage_status: "failed",
        failure_category: "peer_dependency",
        failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
        exit_code: 1,
      }),
    );
    expect(JSON.stringify(capture.mock.calls)).not.toMatch(/private\/path|secret-value/);
  });

  it("records prompt cancellation separately and rethrows it", async () => {
    const { capture, telemetry } = telemetryRecorder();

    await expect(
      instrumentCreateStage(
        "skill_prompt",
        () => {
          throw new CliCancelledError("skill_install_prompt");
        },
        { telemetry },
      ),
    ).rejects.toMatchObject({
      name: "CliCancelledError",
      stage: "skill_install_prompt",
    });

    expect(capture).toHaveBeenLastCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        stage: "skill_prompt",
        stage_status: "cancelled",
        failure_category: "user_cancelled",
        failure_code: "USER_CANCELLED",
      }),
    );
  });

  it("records the conventional exit code for a cancelled command stage", async () => {
    const { capture, telemetry } = telemetryRecorder();
    const result: CommandResult = {
      succeeded: false,
      exitCode: null,
      signal: "SIGINT",
      diagnosticOutput: "",
      durationMs: 10,
    };

    await instrumentCreateStage("dependency_install", () => result, {
      telemetry,
      resultStatus: () => "cancelled",
      resultProperties: (commandResult) => ({
        ...classifyProcessFailure(commandResult),
      }),
    });

    expect(capture).toHaveBeenLastCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        cancellation_exit_code: 130,
        failure_code: "INTERRUPTED",
        stage_status: "cancelled",
      }),
    );
  });
});

describe("captureCreateStageSkipped", () => {
  it("records intentional skips without a failed stage", () => {
    const { capture, telemetry } = telemetryRecorder();

    captureCreateStageSkipped("dependency_install", "no_install_flag", {}, telemetry);

    expect(capture).toHaveBeenCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        stage: "dependency_install",
        stage_status: "skipped",
        skip_reason: "no_install_flag",
        duration_ms: 0,
      }),
    );
  });
});
