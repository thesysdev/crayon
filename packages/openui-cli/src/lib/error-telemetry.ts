import type { CommandResult } from "./process-runner";

export type FailureCategory =
  | "command_missing"
  | "peer_dependency"
  | "registry_auth"
  | "dns"
  | "network_timeout"
  | "network"
  | "engine_mismatch"
  | "dependency_resolution"
  | "package_not_found"
  | "install_script"
  | "permission"
  | "disk_space"
  | "workspace_config"
  | "http_error"
  | "user_cancelled"
  | "unknown";

export interface ProcessFailureTelemetry {
  failure_category: FailureCategory;
  failure_code: string;
  exit_code?: number;
  failure_signal?: NodeJS.Signals;
  http_status?: number;
  cancellation_exit_code?: number;
}

interface FailureRule {
  pattern: RegExp;
  failureCategory: FailureCategory;
  failureCode: string;
}

export type ProcessFailureFingerprint = Pick<
  ProcessFailureTelemetry,
  "failure_category" | "failure_code"
>;

// Every emitted value is fixed here. Never forward a matched substring or the
// child process output itself: package-manager output can include private paths,
// registry URLs, usernames, and credentials.
const FAILURE_RULES: FailureRule[] = [
  {
    pattern: /ERR_PNPM_PEER_DEP_ISSUES/,
    failureCategory: "peer_dependency",
    failureCode: "ERR_PNPM_PEER_DEP_ISSUES",
  },
  {
    pattern: /\bYN0002\b|\bYN0060\b/,
    failureCategory: "peer_dependency",
    failureCode: "YARN_PEER_DEPENDENCY",
  },
  {
    pattern: /(?:npm ERR!\s+code\s+)?ERESOLVE\b/i,
    failureCategory: "peer_dependency",
    failureCode: "ERESOLVE",
  },
  {
    pattern: /ERR_PNPM_FETCH_401|\bE401\b/,
    failureCategory: "registry_auth",
    failureCode: "REGISTRY_401",
  },
  {
    pattern: /ERR_PNPM_FETCH_403|\bE403\b/,
    failureCategory: "registry_auth",
    failureCode: "REGISTRY_403",
  },
  {
    pattern: /ERR_PNPM_FETCH_404|\bE404\b/,
    failureCategory: "package_not_found",
    failureCode: "REGISTRY_404",
  },
  {
    pattern: /\bENOTFOUND\b/,
    failureCategory: "dns",
    failureCode: "ENOTFOUND",
  },
  {
    pattern: /\bEAI_AGAIN\b/,
    failureCategory: "dns",
    failureCode: "EAI_AGAIN",
  },
  {
    pattern: /\bETIMEDOUT\b|\bESOCKETTIMEDOUT\b|\bERR_SOCKET_TIMEOUT\b/,
    failureCategory: "network_timeout",
    failureCode: "ETIMEDOUT",
  },
  {
    pattern: /\bECONNRESET\b/,
    failureCategory: "network",
    failureCode: "ECONNRESET",
  },
  {
    pattern: /\bECONNREFUSED\b/,
    failureCategory: "network",
    failureCode: "ECONNREFUSED",
  },
  {
    pattern: /\bEHOSTUNREACH\b|\bENETUNREACH\b/,
    failureCategory: "network",
    failureCode: "NETWORK_UNREACHABLE",
  },
  {
    pattern: /ERR_PNPM_UNSUPPORTED_ENGINE|ERR_PNPM_BAD_PM_VERSION|\bEBADENGINE\b/,
    failureCategory: "engine_mismatch",
    failureCode: "ENGINE_MISMATCH",
  },
  {
    pattern: /ERR_PNPM_NO_MATCHING_VERSION|\bETARGET\b/,
    failureCategory: "dependency_resolution",
    failureCode: "NO_MATCHING_VERSION",
  },
  {
    pattern: /ERR_PNPM_OUTDATED_LOCKFILE|ERR_PNPM_LOCKFILE_BREAKING_CHANGE/,
    failureCategory: "workspace_config",
    failureCode: "LOCKFILE_INCOMPATIBLE",
  },
  {
    pattern: /\bEACCES\b|\bEPERM\b/,
    failureCategory: "permission",
    failureCode: "PERMISSION_DENIED",
  },
  {
    pattern: /\bENOSPC\b|\bEDQUOT\b/,
    failureCategory: "disk_space",
    failureCode: "DISK_FULL",
  },
  {
    pattern: /ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL|\bELIFECYCLE\b/,
    failureCategory: "install_script",
    failureCode: "INSTALL_SCRIPT_FAILED",
  },
];

export function detectProcessFailures(output: string): ProcessFailureFingerprint[] {
  return FAILURE_RULES.filter(({ pattern }) => pattern.test(output)).map(
    ({ failureCategory, failureCode }) => ({
      failure_category: failureCategory,
      failure_code: failureCode,
    }),
  );
}

const baseProperties = (
  result: CommandResult,
): Pick<ProcessFailureTelemetry, "exit_code" | "failure_signal"> => ({
  ...(typeof result.exitCode === "number" ? { exit_code: result.exitCode } : {}),
  ...(result.signal ? { failure_signal: result.signal } : {}),
});

export function getProcessCancellationExitCode(result: CommandResult): number | undefined {
  if (result.signal === "SIGINT" || result.exitCode === 130) return 130;
  if (result.signal === "SIGTERM" || result.exitCode === 143) return 143;
  return undefined;
}

export function classifyProcessFailure(result: CommandResult): ProcessFailureTelemetry {
  const base = baseProperties(result);

  const cancellationExitCode = getProcessCancellationExitCode(result);
  if (cancellationExitCode) {
    return {
      ...base,
      failure_category: "user_cancelled",
      failure_code: cancellationExitCode === 130 ? "INTERRUPTED" : "TERMINATED",
      cancellation_exit_code: cancellationExitCode,
    };
  }

  const detectedCodes = new Set(
    result.detectedFailures?.map(({ failure_code: failureCode }) => failureCode),
  );
  const rule = FAILURE_RULES.find(
    ({ pattern, failureCode }) =>
      detectedCodes.has(failureCode) || pattern.test(result.diagnosticOutput),
  );
  if (rule) {
    return {
      ...base,
      failure_category: rule.failureCategory,
      failure_code: rule.failureCode,
    };
  }

  // Spawn errors are mapped from a small allowlist; arbitrary OS error codes are
  // not forwarded.
  if (result.spawnErrorCode === "ENOENT") {
    return {
      ...base,
      failure_category: "command_missing",
      failure_code: "COMMAND_NOT_FOUND",
    };
  }
  if (result.spawnErrorCode === "EACCES" || result.spawnErrorCode === "EPERM") {
    return {
      ...base,
      failure_category: "permission",
      failure_code: "PERMISSION_DENIED",
    };
  }

  return {
    ...base,
    failure_category: "unknown",
    failure_code: "UNKNOWN",
  };
}

type ErrorWithDetails = {
  cause?: unknown;
  code?: unknown;
  exitCode?: unknown;
  message?: unknown;
  signal?: unknown;
  status?: unknown;
  stderr?: unknown;
};

const SAFE_SIGNALS = new Set<NodeJS.Signals>(["SIGHUP", "SIGINT", "SIGKILL", "SIGTERM"]);

function errorDiagnosticText(error: unknown, depth = 0): string {
  if (depth > 2) return "";
  if (error == null) return "";
  if (typeof error !== "object") return String(error).slice(-4096);
  const detailed = error as ErrorWithDetails;
  const stderr =
    typeof detailed.stderr === "string"
      ? detailed.stderr
      : Buffer.isBuffer(detailed.stderr)
        ? detailed.stderr.toString("utf8")
        : "";
  return [
    typeof detailed.message === "string" ? detailed.message : "",
    typeof detailed.code === "string" ? detailed.code : "",
    stderr,
  ]
    .concat(errorDiagnosticText(detailed.cause, depth + 1))
    .filter(Boolean)
    .join("\n")
    .slice(-16_384);
}

function errorWithProcessDetails(error: unknown, depth = 0): ErrorWithDetails | undefined {
  if (depth > 2 || error == null || typeof error !== "object") return undefined;
  const detailed = error as ErrorWithDetails;
  if (
    typeof detailed.exitCode === "number" ||
    typeof detailed.status === "number" ||
    typeof detailed.signal === "string" ||
    typeof detailed.code === "string"
  ) {
    return detailed;
  }
  return errorWithProcessDetails(detailed.cause, depth + 1);
}

/** Classifies arbitrary errors locally while returning only allowlisted values. */
export function classifyUnknownFailure(error: unknown): ProcessFailureTelemetry {
  const detailed = errorWithProcessDetails(error);
  const rawExitCode = detailed?.exitCode ?? detailed?.status;
  const exitCode = typeof rawExitCode === "number" ? rawExitCode : null;
  const signal =
    typeof detailed?.signal === "string" && SAFE_SIGNALS.has(detailed.signal as NodeJS.Signals)
      ? (detailed.signal as NodeJS.Signals)
      : null;
  const diagnosticOutput = errorDiagnosticText(error);
  const classified = classifyProcessFailure({
    succeeded: false,
    exitCode,
    signal,
    spawnErrorCode: typeof detailed?.code === "string" ? detailed.code : undefined,
    diagnosticOutput,
    durationMs: 0,
  });
  if (classified.failure_category !== "unknown") return classified;

  const httpStatusMatch = diagnosticOutput.match(/\bHTTP\s+([1-5]\d{2})\b/i);
  const httpStatus = httpStatusMatch?.[1] ? Number(httpStatusMatch[1]) : undefined;
  return httpStatus
    ? {
        ...classified,
        failure_category: "http_error",
        failure_code: `HTTP_${httpStatus}`,
        http_status: httpStatus,
      }
    : classified;
}
