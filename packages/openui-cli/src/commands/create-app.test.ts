import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CliCancelledError, telemetry } from "../lib/telemetry";
import { runCreateApp } from "./create-app";

const promptMocks = vi.hoisted(() => {
  class ExitPromptError extends Error {
    override name = "ExitPromptError";
  }

  return {
    ExitPromptError,
    password: vi.fn(),
  };
});

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
  input: vi.fn(),
  password: promptMocks.password,
  select: vi.fn(),
}));
vi.mock("@inquirer/core", () => ({
  ExitPromptError: promptMocks.ExitPromptError,
}));

const originalCwd = process.cwd();
let tempDir = "";
let capture: ReturnType<typeof vi.spyOn>;

const cloudOptions = {
  name: "test-app",
  template: "openui-cloud" as const,
  skill: false,
  noInteractive: true,
  noInstall: true,
};

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "openui-cli-create-test-"));
  process.chdir(tempDir);
  capture = vi.spyOn(telemetry, "capture").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  promptMocks.password.mockReset();
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("runCreateApp cloud auth telemetry", () => {
  it("records auth skip as skipped and still completes creation", async () => {
    await runCreateApp({ ...cloudOptions, auth: "skip" });

    expect(capture).toHaveBeenCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        auth_method: "skip",
        stage: "cloud_auth",
        stage_status: "skipped",
      }),
    );
    expect(capture).not.toHaveBeenCalledWith("cli_cloud_auth_failed", expect.anything());
    expect(capture).toHaveBeenCalledWith("cli_create_succeeded", expect.anything());
  });

  it("records a blank manual key as skipped and still completes creation", async () => {
    promptMocks.password.mockResolvedValueOnce("");

    await runCreateApp({ ...cloudOptions, auth: "manual" });

    expect(capture).toHaveBeenCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        auth_method: "manual",
        stage: "cloud_auth",
        stage_status: "skipped",
      }),
    );
    expect(capture).not.toHaveBeenCalledWith("cli_cloud_auth_failed", expect.anything());
    expect(capture).toHaveBeenCalledWith("cli_create_succeeded", expect.anything());
  });

  it("records a recoverable auth failure without failing creation", async () => {
    await runCreateApp(cloudOptions);

    expect(capture).toHaveBeenCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        failure_stage: "method_resolution",
        stage: "cloud_auth",
        stage_status: "failed",
      }),
    );
    expect(capture).toHaveBeenCalledWith(
      "cli_cloud_auth_failed",
      expect.objectContaining({
        auth_succeeded: false,
        failure_stage: "method_resolution",
      }),
    );
    expect(capture).toHaveBeenCalledWith("cli_create_succeeded", expect.anything());
  });

  it("propagates prompt cancellation without recording an auth failure", async () => {
    promptMocks.password.mockRejectedValueOnce(new promptMocks.ExitPromptError("cancelled"));

    await expect(runCreateApp({ ...cloudOptions, auth: "manual" })).rejects.toBeInstanceOf(
      CliCancelledError,
    );

    expect(capture).toHaveBeenCalledWith(
      "cli_create_stage",
      expect.objectContaining({
        failure_category: "user_cancelled",
        stage: "cloud_auth",
        stage_status: "cancelled",
      }),
    );
    expect(capture).not.toHaveBeenCalledWith("cli_cloud_auth_failed", expect.anything());
    expect(capture).not.toHaveBeenCalledWith("cli_create_succeeded", expect.anything());
  });
});
