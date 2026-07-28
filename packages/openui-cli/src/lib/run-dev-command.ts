import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";

import type { PackageManager } from "./detect-package-manager";
import { telemetry as defaultTelemetry } from "./telemetry";

type TelemetryCapture = Pick<typeof defaultTelemetry, "capture">;
type SpawnDevCommand = (command: string, args: string[], options: SpawnOptions) => ChildProcess;

export type DevCommandResult =
  | {
      status: "stopped";
      exitCode: number | null;
      signal: NodeJS.Signals | null;
    }
  | {
      status: "failed";
      exitCode: number;
      signal: NodeJS.Signals | null;
      reason: "spawn_error" | "nonzero_exit";
    };

type RunDevCommandOptions = {
  telemetry?: TelemetryCapture;
  spawnCommand?: SpawnDevCommand;
  now?: () => number;
};

const defaultSpawnCommand: SpawnDevCommand = (command, args, options) =>
  spawn(command, args, options);

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) return "UNKNOWN";
  const code = error.code;
  return typeof code === "string" ? code : "UNKNOWN";
}

export function runDevCommand(
  projectDir: string,
  packageManager: Pick<PackageManager, "name" | "runCmd">,
  options: RunDevCommandOptions = {},
): Promise<DevCommandResult> {
  const telemetry = options.telemetry ?? defaultTelemetry;
  const spawnCommand = options.spawnCommand ?? defaultSpawnCommand;
  const now = options.now ?? Date.now;
  const startedAt = now();

  telemetry.capture("cli_dev_command_started", {
    package_manager: packageManager.name,
  });

  return new Promise((resolve) => {
    let settled = false;
    let child: ChildProcess | undefined;
    const forwardSignal = (signal: NodeJS.Signals) => {
      try {
        child?.kill(signal);
      } catch {
        // The child may have exited between receiving the terminal signal and forwarding it.
      }
    };
    const handleSigint = () => forwardSignal("SIGINT");
    const handleSigterm = () => forwardSignal("SIGTERM");
    const removeSignalHandlers = () => {
      process.off("SIGINT", handleSigint);
      process.off("SIGTERM", handleSigterm);
    };
    const finish = (result: DevCommandResult) => {
      if (settled) return;
      settled = true;
      removeSignalHandlers();
      resolve(result);
    };

    try {
      child = spawnCommand(packageManager.runCmd, ["run", "dev"], {
        cwd: projectDir,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
    } catch (error) {
      telemetry.capture("cli_dev_command_failed", {
        package_manager: packageManager.name,
        duration_ms: Math.max(0, now() - startedAt),
        failure_reason: "spawn_error",
        error_code: errorCode(error),
      });
      finish({
        status: "failed",
        exitCode: 1,
        signal: null,
        reason: "spawn_error",
      });
      return;
    }

    process.on("SIGINT", handleSigint);
    process.on("SIGTERM", handleSigterm);

    child.once("error", (error) => {
      telemetry.capture("cli_dev_command_failed", {
        package_manager: packageManager.name,
        duration_ms: Math.max(0, now() - startedAt),
        failure_reason: "spawn_error",
        error_code: errorCode(error),
      });
      finish({
        status: "failed",
        exitCode: 1,
        signal: null,
        reason: "spawn_error",
      });
    });

    child.once("close", (exitCode, signal) => {
      const durationMs = Math.max(0, now() - startedAt);
      if (
        exitCode === 0 ||
        exitCode === 130 ||
        exitCode === 143 ||
        signal === "SIGINT" ||
        signal === "SIGTERM"
      ) {
        telemetry.capture("cli_dev_command_stopped", {
          package_manager: packageManager.name,
          duration_ms: durationMs,
          exit_code: exitCode,
          signal,
        });
        finish({ status: "stopped", exitCode, signal });
        return;
      }

      const normalizedExitCode = exitCode ?? 1;
      telemetry.capture("cli_dev_command_failed", {
        package_manager: packageManager.name,
        duration_ms: durationMs,
        failure_reason: "nonzero_exit",
        exit_code: normalizedExitCode,
        signal,
      });
      finish({
        status: "failed",
        exitCode: normalizedExitCode,
        signal,
        reason: "nonzero_exit",
      });
    });
  });
}
