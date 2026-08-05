import type { CloudAuthMethod } from "../auth/mint";
import { createFunnelProps } from "./create-telemetry";
import type { TemplateName } from "./create-types";
import type { CommandResult } from "./process-runner";
import {
  CliCancelledError,
  CreateError,
  telemetry as defaultTelemetry,
  type CliErrorClass,
  type CliErrorMetadata,
  type Telemetry,
} from "./telemetry";

/** ASCII Record Separator — Untypeable in prompt text and always
 *  escaped by JSON.stringify, so it can never collide with either artifact. */
export const SEPARATION_DELIMITER = "\u001E";

export type CliErrorProperties = CliErrorMetadata & {
  failure_stage: string;
  error_class: CliErrorClass;
  error_code: string;
};

const errnoTelemetry: Record<string, Pick<CliErrorProperties, "error_class" | "error_code">> = {
  EACCES: { error_class: "filesystem", error_code: "PERMISSION_DENIED" },
  EPERM: { error_class: "filesystem", error_code: "PERMISSION_DENIED" },
  ENOENT: { error_class: "filesystem", error_code: "NOT_FOUND" },
  ENOSPC: { error_class: "filesystem", error_code: "DISK_FULL" },
};

/** Return only bounded values; never forward an error message or stack. */
export function cliErrorProperties(
  error: unknown,
  fallback: CliErrorProperties = {
    failure_stage: "unknown",
    error_class: "unknown",
    error_code: "UNKNOWN",
  },
): CliErrorProperties {
  if (error instanceof CreateError) {
    return {
      failure_stage: error.stage,
      error_class: error.errorClass,
      error_code: error.errorCode,
      ...error.errorMetadata,
    };
  }

  const errno = error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;
  const classified = errno ? errnoTelemetry[errno] : undefined;
  return classified ? { ...fallback, ...classified } : fallback;
}

type ProcessFailureRule = [RegExp, CliErrorClass, string];

const processFailureRules: ProcessFailureRule[] = [
  [
    /ERR_PNPM_PEER_DEP_ISSUES|\bYN0002\b|\bYN0060\b|\bERESOLVE\b/i,
    "peer_dependency",
    "PEER_DEPENDENCY",
  ],
  [/ERR_PNPM_FETCH_401|\bE401\b|\bENEEDAUTH\b/, "registry_auth", "REGISTRY_401"],
  [/ERR_PNPM_FETCH_403|\bE403\b/, "registry_auth", "REGISTRY_403"],
  [/ERR_PNPM_FETCH_404|\bE404\b/, "dependency", "PACKAGE_NOT_FOUND"],
  [/\bENOTFOUND\b|\bEAI_AGAIN\b/, "network", "DNS_FAILED"],
  [/\bETIMEDOUT\b|\bESOCKETTIMEDOUT\b|\bERR_SOCKET_TIMEOUT\b/, "network", "NETWORK_TIMEOUT"],
  [/\bECONNRESET\b|\bECONNREFUSED\b|\bEHOSTUNREACH\b|\bENETUNREACH\b/, "network", "NETWORK_FAILED"],
  [
    /ERR_PNPM_UNSUPPORTED_ENGINE|ERR_PNPM_BAD_PM_VERSION|\bEBADENGINE\b|\bYN0009\b/,
    "package_compatibility",
    "ENGINE_MISMATCH",
  ],
  [/ERR_PNPM_NO_MATCHING_VERSION|\bETARGET\b/, "package_compatibility", "NO_MATCHING_VERSION"],
  [
    /ERR_PNPM_OUTDATED_LOCKFILE|ERR_PNPM_LOCKFILE_BREAKING_CHANGE/,
    "workspace_config",
    "LOCKFILE_INCOMPATIBLE",
  ],
  [
    /ERR_PNPM_WORKSPACE_[A-Z0-9_]+|ERR_PNPM_NO_MATCHING_VERSION_INSIDE_WORKSPACE/,
    "workspace_config",
    "WORKSPACE_CONFIG_INVALID",
  ],
  [/ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL|\bELIFECYCLE\b/, "install_script", "INSTALL_SCRIPT_FAILED"],
  [/\bEACCES\b|\bEPERM\b/, "filesystem", "PERMISSION_DENIED"],
  [/\bENOSPC\b|\bEDQUOT\b/, "filesystem", "DISK_FULL"],
];

export function processErrorProperties(
  result: CommandResult,
  failureStage: string,
  fallback: Pick<CliErrorProperties, "error_class" | "error_code">,
): CliErrorProperties {
  const metadata: CliErrorMetadata = {
    duration_ms: result.durationMs,
    ...(typeof result.status === "number" ? { exit_code: result.status } : {}),
    ...(result.signal ? { failure_signal: result.signal } : {}),
  };
  const cancellationExitCode =
    result.signal === "SIGINT" || result.status === 130
      ? 130
      : result.signal === "SIGTERM" || result.status === 143
        ? 143
        : undefined;
  if (cancellationExitCode) {
    return {
      failure_stage: failureStage,
      error_class: "user_cancelled",
      error_code: cancellationExitCode === 130 ? "INTERRUPTED" : "TERMINATED",
      ...metadata,
      cancellation_exit_code: cancellationExitCode,
    };
  }

  const diagnostic = `${result.error?.message ?? ""}\n${result.diagnosticTail}`;
  const rule = processFailureRules.find(([pattern]) => pattern.test(diagnostic));
  if (rule) {
    const [, errorClass, errorCode] = rule;
    return {
      failure_stage: failureStage,
      error_class: errorClass,
      error_code: errorCode,
      ...metadata,
    };
  }

  const spawnCode = result.error ? (result.error as NodeJS.ErrnoException).code : undefined;
  if (spawnCode === "ENOENT") {
    return {
      failure_stage: failureStage,
      error_class: "process",
      error_code: "COMMAND_NOT_FOUND",
      ...metadata,
    };
  }

  return { failure_stage: failureStage, ...fallback, ...metadata };
}

export function createCliError(message: string, properties: CliErrorProperties): CreateError {
  const { failure_stage, error_class, error_code, ...metadata } = properties;
  return new CreateError(failure_stage, message, error_class, error_code, metadata);
}

export function handleCliError(
  e: unknown,
  event: string,
  telemetry: Telemetry = defaultTelemetry,
): void {
  const cancelled = e instanceof CliCancelledError;
  const message = e instanceof Error ? e.message : String(e);
  if (cancelled) console.info("Cancelled.");
  else console.error(e instanceof CreateError ? `Error: ${message}` : message);

  const errorProperties = cliErrorProperties(e);
  const capturedEvent = cancelled ? event.replace(/_failed$/, "_cancelled") : event;

  if (event === "cli_create_failed") {
    telemetry.capture(capturedEvent, {
      ...createFunnelProps(cancelled ? "create_cancelled" : "create_failed"),
      ...errorProperties,
    });
  } else {
    telemetry.capture(capturedEvent, errorProperties);
  }

  process.exitCode = cancelled ? e.exitCode : 1;
}

export function normalizeTemplate(t?: string): TemplateName | undefined {
  if (!t) return undefined;
  const v = t.toLowerCase();
  if (v === "self-hosted" || v === "openui-self-hosted") return "openui-self-hosted";
  if (v === "cloud" || v === "openui-cloud") return "openui-cloud";
  throw new CreateError(
    "args_resolution",
    `unknown template "${t}". Use: openui-self-hosted | openui-cloud.`,
    "invalid_input",
    "INVALID_TEMPLATE",
  );
}

export function normalizeAuth(a?: string): CloudAuthMethod | undefined {
  if (!a) return undefined;
  const v = a.toLowerCase();
  if (v === "oauth" || v === "manual" || v === "skip") return v;
  throw new CreateError(
    "args_resolution",
    `unknown --auth "${a}". Use: oauth | skip (manual is deprecated).`,
    "invalid_input",
    "INVALID_AUTH",
  );
}
