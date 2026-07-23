import { afterEach, describe, expect, it, vi } from "vitest";

import { CliCancelledError, CreateError, type Telemetry } from "./telemetry";
import { handleCliError } from "./utils";

const telemetryDouble = () => {
  const capture = vi.fn();
  return {
    capture,
    telemetry: { capture } as unknown as Telemetry,
  };
};

afterEach(() => {
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe("handleCliError", () => {
  it("captures a code-defined create failure stage without the error message", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { capture, telemetry } = telemetryDouble();

    handleCliError(
      new CreateError("dependency_install", "private path /Users/example/secret-project"),
      "cli_create_failed",
      telemetry,
    );

    expect(capture).toHaveBeenCalledWith("cli_create_failed", {
      funnel: "cli_create",
      funnel_version: "frontloaded_cloud_setup_v1",
      step_rank: "9000",
      step_key: "create_failed",
      failure_stage: "dependency_install",
      failure_category: "unknown",
      failure_code: "UNKNOWN",
    });
    expect(JSON.stringify(capture.mock.calls)).not.toContain("secret-project");
    expect(process.exitCode).toBe(1);
  });

  it("uses unknown for an untyped create error", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { capture, telemetry } = telemetryDouble();

    handleCliError(new Error("sensitive message"), "cli_create_failed", telemetry);

    expect(capture).toHaveBeenCalledWith(
      "cli_create_failed",
      expect.objectContaining({ failure_stage: "unknown" }),
    );
    expect(JSON.stringify(capture.mock.calls)).not.toContain("sensitive message");
  });

  it("does not send raw messages for non-create failures", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { capture, telemetry } = telemetryDouble();

    handleCliError(
      new CreateError("generate_entry_missing", "/Users/example/private-source.ts"),
      "cli_generate_failed",
      telemetry,
    );

    expect(capture).toHaveBeenCalledWith("cli_generate_failed", {
      stage: "generate_entry_missing",
      failure_category: "unknown",
      failure_code: "UNKNOWN",
    });
    expect(JSON.stringify(capture.mock.calls)).not.toContain("private-source.ts");
  });

  it("reports prompt cancellation separately and preserves a zero exit code", () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { capture, telemetry } = telemetryDouble();

    handleCliError(
      new CliCancelledError("cloud_auth_method_prompt"),
      "cli_create_failed",
      telemetry,
    );

    expect(capture).toHaveBeenCalledWith("cli_create_cancelled", {
      funnel: "cli_create",
      funnel_version: "frontloaded_cloud_setup_v1",
      step_rank: "9010",
      step_key: "create_cancelled",
      cancellation_stage: "cloud_auth_method_prompt",
      cancellation_exit_code: 0,
    });
    expect(process.exitCode).toBe(0);
  });

  it("preserves the conventional exit code for an interrupted child process", () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { telemetry } = telemetryDouble();

    handleCliError(
      new CliCancelledError("dependency_install", 130),
      "cli_create_failed",
      telemetry,
    );

    expect(process.exitCode).toBe(130);
  });
});
