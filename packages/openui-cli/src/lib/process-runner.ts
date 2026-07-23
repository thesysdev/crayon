import { spawn, spawnSync } from "node:child_process";

import { resolveCommandInvocation } from "./command-invocation";
import { detectProcessFailures, type ProcessFailureFingerprint } from "./error-telemetry";

const MAX_DIAGNOSTIC_OUTPUT_CHARS = 16_384;

export interface CommandResult {
  succeeded: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  spawnErrorCode?: string;
  detectedFailures?: ProcessFailureFingerprint[];
  diagnosticOutput: string;
  durationMs: number;
}

function appendDiagnosticWindow(current: string, chunk: string): string {
  const combined = current + chunk;
  return combined.length <= MAX_DIAGNOSTIC_OUTPUT_CHARS
    ? combined
    : combined.slice(0, MAX_DIAGNOSTIC_OUTPUT_CHARS / 2) +
        combined.slice(-MAX_DIAGNOSTIC_OUTPUT_CHARS / 2);
}

/**
 * Run a known executable while preserving its terminal output. A bounded
 * head-and-tail window is retained in memory only so callers can map failures
 * to an allowlisted telemetry code. The raw output must never be sent to telemetry.
 */
export function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<CommandResult> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    let diagnosticOutput = "";
    let diagnosticScanTail = "";
    const detectedFailures = new Map<string, ProcessFailureFingerprint>();
    let settled = false;
    let forwardedSignal: NodeJS.Signals | null = null;
    let forceKillTimer: NodeJS.Timeout | undefined;
    const invocation = resolveCommandInvocation(command, args);
    const child = spawn(invocation.command, invocation.args, {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
    });

    const observeDiagnostic = (chunk: string) => {
      const scanWindow = diagnosticScanTail + chunk;
      for (const failure of detectProcessFailures(scanWindow)) {
        detectedFailures.set(failure.failure_code, failure);
      }
      diagnosticScanTail = scanWindow.slice(-128);
      diagnosticOutput = appendDiagnosticWindow(diagnosticOutput, chunk);
    };

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      process.stdout.write(chunk);
      observeDiagnostic(chunk);
    });
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      process.stderr.write(chunk);
      observeDiagnostic(chunk);
    });

    const terminateChild = (signal: NodeJS.Signals, force: boolean) => {
      try {
        // Windows package managers run below cmd.exe. Terminate the full tree so
        // pnpm/npx cannot continue writing after the wrapper exits.
        if (process.platform === "win32" && child.pid) {
          const result = spawnSync(
            "taskkill",
            ["/PID", String(child.pid), "/T", ...(force ? ["/F"] : [])],
            {
              stdio: "ignore",
              windowsHide: true,
            },
          );
          if (result.status === 0) return;
        }
        child.kill(force ? "SIGKILL" : signal);
      } catch {
        /* process already exited or the platform rejected the signal */
      }
    };
    const forceKill = () => terminateChild(forwardedSignal ?? "SIGTERM", true);
    const forwardSignal = (signal: NodeJS.Signals) => {
      if (forwardedSignal) {
        forceKill();
        return;
      }
      forwardedSignal = signal;
      terminateChild(signal, false);
      forceKillTimer = setTimeout(forceKill, 5000);
      forceKillTimer.unref();
    };
    const onSigint = () => forwardSignal("SIGINT");
    const onSigterm = () => forwardSignal("SIGTERM");
    const cleanupSignalHandlers = () => {
      process.off("SIGINT", onSigint);
      process.off("SIGTERM", onSigterm);
      if (forceKillTimer) clearTimeout(forceKillTimer);
    };

    const finish = (result: Omit<CommandResult, "diagnosticOutput" | "durationMs">) => {
      if (settled) return;
      settled = true;
      cleanupSignalHandlers();
      resolve({
        ...result,
        ...(detectedFailures.size > 0
          ? { detectedFailures: Array.from(detectedFailures.values()) }
          : {}),
        diagnosticOutput,
        durationMs: Date.now() - startedAt,
      });
    };

    // Keep the parent alive long enough to classify the interruption and flush
    // the cancellation event in the command wrapper's finally block.
    process.on("SIGINT", onSigint);
    process.on("SIGTERM", onSigterm);

    child.once("error", (error: NodeJS.ErrnoException) => {
      finish({
        succeeded: false,
        exitCode: null,
        signal: forwardedSignal,
        spawnErrorCode: error.code,
      });
    });
    child.once("close", (exitCode, signal) => {
      const effectiveSignal = forwardedSignal ?? signal;
      finish({
        succeeded: exitCode === 0 && !effectiveSignal,
        exitCode,
        signal: effectiveSignal,
      });
    });
  });
}
